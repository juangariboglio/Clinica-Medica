// TESTS DEL COMPONENTE ConsultaForm (T31). CUBREN RF-5 (HORARIOS LIBRES DEL
// MEDICO), RF-6 (CREACION DE CITA), RF-16 (PACIENTE/MEDICO INEXISTENTE) Y LOS
// CASOS LIMITE DE DOMINGO CERRADO Y MENSAJES DE VALIDACION DEL BACKEND.
import { configurarFetch, crearRespuesta } from '../helpers/dom.mjs';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsultaForm } from '../../src/components/ConsultaForm.js';

// EL BACKEND DEVUELVE PAGINAS DE SPRING: LOS SERVICIOS DESEMPAQUETAN .content
const paginaPacientes = { content: [{ id: 1, nombre: 'Juan Pérez' }] };
const paginaMedicos = { content: [{ id: 10, nombre: 'Dra. House', especialidad: 'CARDIOLOGIA' }] };

// FECHA LABORABLE FUTURA (NUNCA HOY: EL FILTRO DE HORARIOS PASADOS QUITARIA
// FRANJAS Y HARIA EL TEST NO DETERMINISTA). SE FORMATEA EN HORA LOCAL: LA
// SEMANA SE COMPRUEBA CON getDay(), QUE TAMBIEN ES LOCAL (toISOString DESPLAZA
// LA FECHA AL CONVERTIR A UTC Y PODRIA DEVOLVER OTRO DIA).
const aCadenaLocal = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

const proximaFechaLaborable = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  while (fecha.getDay() === 0) {
    fecha.setDate(fecha.getDate() + 1);
  }
  return aCadenaLocal(fecha);
};

// DOMINGO FUTURO (LA CLINICA ESTA CERRADA)
const proximoDomingo = () => {
  const fecha = new Date();
  do {
    fecha.setDate(fecha.getDate() + 1);
  } while (fecha.getDay() !== 0);
  return aCadenaLocal(fecha);
};

// SELECCIONA PACIENTE, MEDICO Y FECHA EN LOS TRES CONTROLES DEL FORMULARIO
const seleccionarPacienteMedicoFecha = (fecha) => {
  fireEvent.change(screen.getByLabelText('Paciente:'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Médico:'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Fecha:'), { target: { value: fecha } });
};

describe('Componente ConsultaForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('carga las listas de pacientes y medicos del backend (RF-5)', async () => {
    configurarFetch((llamada) => {
      if (llamada.url.includes('/api/pacientes?')) return crearRespuesta(200, paginaPacientes);
      if (llamada.url.includes('/api/medico?')) return crearRespuesta(200, paginaMedicos);
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    render(React.createElement(ConsultaForm));

    await screen.findByText('Juan Pérez');
    await screen.findByText('Dra. House (CARDIOLOGIA)');
  });

  it('muestra los horarios libres del medico excluyendo los ya ocupados (RF-5)', async () => {
    const fecha = proximaFechaLaborable();
    const ocupadas = [{ id: 77, fecha: `${fecha}T09:00:00` }];
    const llamadas = configurarFetch((llamada) => {
      if (llamada.url.includes('/api/pacientes?')) return crearRespuesta(200, paginaPacientes);
      if (llamada.url.includes('/api/medico?')) return crearRespuesta(200, paginaMedicos);
      if (llamada.url.startsWith('/api/consultas?')) {
        assert.ok(llamada.url.includes('medicoId=10'), `URL sin filtro de medico: ${llamada.url}`);
        assert.ok(llamada.url.includes(`fecha=${fecha}`), `URL sin filtro de fecha: ${llamada.url}`);
        return crearRespuesta(200, ocupadas);
      }
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    render(React.createElement(ConsultaForm));

    await screen.findByText('Juan Pérez');
    seleccionarPacienteMedicoFecha(fecha);

    // 09:00-09:30 OCUPADO -> LIBRE 07:00-09:00 Y 09:30-19:00
    const franjaManana = await screen.findByLabelText('Horario de 07:00 a 09:00');
    assert.strictEqual(franjaManana.type, 'radio');
    assert.ok(screen.getByLabelText('Horario de 09:30 a 19:00'));
    assert.ok(llamadas.some((llamada) => llamada.url.startsWith('/api/consultas?')));
  });

  it('no ofrece horarios cuando la fecha es un domingo (clinica cerrada)', async () => {
    const fecha = proximoDomingo();
    configurarFetch((llamada) => {
      if (llamada.url.includes('/api/pacientes?')) return crearRespuesta(200, paginaPacientes);
      if (llamada.url.includes('/api/medico?')) return crearRespuesta(200, paginaMedicos);
      if (llamada.url.startsWith('/api/consultas?')) return crearRespuesta(200, []);
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    render(React.createElement(ConsultaForm));

    await screen.findByText('Juan Pérez');
    seleccionarPacienteMedicoFecha(fecha);

    await screen.findByText('No hay horarios disponibles para la selección');
  });

  it('bloquea la cita con un error inline cuando el paciente no existe (RF-16)', async () => {
    const fecha = proximaFechaLaborable();
    const llamadas = configurarFetch((llamada) => {
      if (llamada.url.includes('/api/pacientes?')) return crearRespuesta(200, paginaPacientes);
      if (llamada.url.includes('/api/medico?')) return crearRespuesta(200, paginaMedicos);
      if (llamada.url.startsWith('/api/consultas?')) return crearRespuesta(200, []);
      if (llamada.url === '/api/pacientes/1') return crearRespuesta(404, 'Paciente no encontrado');
      if (llamada.url === '/api/medico/10') return crearRespuesta(200, { id: 10, nombre: 'Dra. House' });
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    const user = userEvent.setup();
    render(React.createElement(ConsultaForm));

    await screen.findByText('Juan Pérez');
    seleccionarPacienteMedicoFecha(fecha);
    fireEvent.click(await screen.findByLabelText('Horario de 07:00 a 19:00'));
    await user.click(screen.getByRole('button', { name: 'Crear consulta' }));

    await screen.findByText('El paciente seleccionado no existe en el sistema');
    assert.strictEqual(
      llamadas.filter((llamada) => llamada.metodo === 'POST').length,
      0,
      'no se crea la cita si el paciente no existe'
    );
  });

  it('muestra el mensaje de validacion del backend cuando rechaza la cita', async () => {
    const fecha = proximaFechaLaborable();
    const mensajeBackend = 'El paciente ya tiene una consulta programada ese día';
    configurarFetch((llamada) => {
      if (llamada.url.includes('/api/pacientes?')) return crearRespuesta(200, paginaPacientes);
      if (llamada.url.includes('/api/medico?')) return crearRespuesta(200, paginaMedicos);
      if (llamada.url.startsWith('/api/consultas?')) return crearRespuesta(200, []);
      if (llamada.url === '/api/pacientes/1') return crearRespuesta(200, { id: 1, nombre: 'Juan Pérez' });
      if (llamada.url === '/api/medico/10') return crearRespuesta(200, { id: 10, nombre: 'Dra. House' });
      if (llamada.metodo === 'POST') return crearRespuesta(400, mensajeBackend);
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    const user = userEvent.setup();
    render(React.createElement(ConsultaForm));

    await screen.findByText('Juan Pérez');
    seleccionarPacienteMedicoFecha(fecha);
    fireEvent.click(await screen.findByLabelText('Horario de 07:00 a 19:00'));
    await user.click(screen.getByRole('button', { name: 'Crear consulta' }));

    await screen.findByText(mensajeBackend);
  });

  it('crea la cita con el DTO del backend y muestra el mensaje de exito (RF-6)', async () => {
    const fecha = proximaFechaLaborable();
    const llamadas = configurarFetch((llamada) => {
      if (llamada.url.includes('/api/pacientes?')) return crearRespuesta(200, paginaPacientes);
      if (llamada.url.includes('/api/medico?')) return crearRespuesta(200, paginaMedicos);
      if (llamada.url.startsWith('/api/consultas?')) return crearRespuesta(200, []);
      if (llamada.url === '/api/pacientes/1') return crearRespuesta(200, { id: 1, nombre: 'Juan Pérez' });
      if (llamada.url === '/api/medico/10') return crearRespuesta(200, { id: 10, nombre: 'Dra. House' });
      if (llamada.metodo === 'POST') return crearRespuesta(201, null);
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    const user = userEvent.setup();
    render(React.createElement(ConsultaForm));

    await screen.findByText('Juan Pérez');
    seleccionarPacienteMedicoFecha(fecha);
    fireEvent.click(await screen.findByLabelText('Horario de 07:00 a 19:00'));
    await user.click(screen.getByRole('button', { name: 'Crear consulta' }));

    await screen.findByText('Cita creada exitosamente');
    const post = llamadas.find((llamada) => llamada.metodo === 'POST');
    assert.ok(post, 'debe haber una llamada POST a /consultas');
    const cuerpo = JSON.parse(post.cuerpo);
    assert.strictEqual(String(cuerpo.idPaciente), '1');
    assert.strictEqual(String(cuerpo.idMedico), '10');
    // EL BACKEND ESPERA EL LocalDateTime ISO: "2026-10-20T07:00:00"
    assert.strictEqual(cuerpo.fecha, `${fecha}T07:00:00`);
  });
});
