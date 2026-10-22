// TESTS DEL COMPONENTE PacienteForm (T31). CUBREN RF-2 (FORMULARIO DE PACIENTE),
// RF-3 (ALTA CORRECTA), RF-4 (ERRORES INLINE SIN ENVIAR), RF-14 (FORMATO DE
// EMAIL/TELEFONO/DNI), RF-15 (DUPLICADOS) Y LA EDICION CON CAMPOS SOLO LECTURA.
import { configurarFetch, crearRespuesta } from '../helpers/dom.mjs';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PacienteForm } from '../../src/components/PacienteForm.js';

// RELLENA EL FORMULARIO CON DATOS VALIDOS (LA DIRECCION SON 5 SUBCAMPOS)
const completarFormularioValido = async (user) => {
  await user.type(screen.getByLabelText('Nombre:'), 'Juan Pérez');
  await user.type(screen.getByLabelText('DNI (formato 12.345.678):'), '12.345.678');
  await user.type(screen.getByLabelText('Email:'), 'juan.perez@vollmed.com');
  await user.type(screen.getByLabelText('Teléfono (9 dígitos):'), '600123456');
  await user.type(screen.getByLabelText('Calle:'), 'Calle Falsa');
  await user.type(screen.getByLabelText('Número:'), '123');
  await user.type(screen.getByLabelText('Complemento (opcional):'), 'Piso 2');
  await user.type(screen.getByLabelText('Distrito (opcional):'), 'Centro');
  await user.type(screen.getByLabelText('Ciudad:'), 'Madrid');
};

// RELLENA SOLO LOS CAMPOS OBLIGATORIOS: COMPLEMENTO Y DISTRITO SE QUEDAN EN BLANCO
const completarSoloObligatorios = async (user) => {
  await user.type(screen.getByLabelText('Nombre:'), 'Ana Sin Distrito');
  await user.type(screen.getByLabelText('DNI (formato 12.345.678):'), '12.345.678');
  await user.type(screen.getByLabelText('Email:'), 'ana.sindistrito@vollmed.com');
  await user.type(screen.getByLabelText('Teléfono (9 dígitos):'), '600123456');
  await user.type(screen.getByLabelText('Calle:'), 'Calle Falsa');
  await user.type(screen.getByLabelText('Número:'), '123');
  await user.type(screen.getByLabelText('Ciudad:'), 'Madrid');
};

describe('Componente PacienteForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('muestra errores inline en todos los campos obligatorios y no envia nada con el formulario vacio (RF-4)', async () => {
    const llamadas = configurarFetch(() => crearRespuesta(201, null));
    const user = userEvent.setup();
    render(React.createElement(PacienteForm));

    await user.click(screen.getByRole('button', { name: 'Guardar paciente' }));

    await screen.findByText('El nombre no puede estar vacío');
    await screen.findByText('El DNI no puede estar vacío');
    await screen.findByText('La calle es obligatorio');
    assert.strictEqual(llamadas.length, 0, 'con campos invalidos no se llama al servidor');
    // RF-12: EL CAMPO CON ERROR SE ANUNCIA COMO INVALIDO PARA LECTORES DE PANTALLA
    assert.strictEqual(screen.getByLabelText('Nombre:').getAttribute('aria-invalid'), 'true');
  });

  it('valida el formato al salir de cada campo con un mensaje inline (RF-14)', async () => {
    configurarFetch(() => crearRespuesta(201, null));
    const user = userEvent.setup();
    render(React.createElement(PacienteForm));

    const email = screen.getByLabelText('Email:');
    await user.type(email, 'juan.perez@vollmed');
    fireEvent.blur(email);
    await screen.findByText('El email no tiene un formato válido');

    const dni = screen.getByLabelText('DNI (formato 12.345.678):');
    await user.type(dni, '12345678');
    fireEvent.blur(dni);
    await screen.findByText('El DNI debe tener el formato 12.345.678');

    const telefono = screen.getByLabelText('Teléfono (9 dígitos):');
    await user.type(telefono, '600');
    fireEvent.blur(telefono);
    await screen.findByText('El teléfono debe tener exactamente 9 dígitos');
  });

  it('muestra el error de DNI duplicado junto al campo y no deja crear el paciente (RF-15)', async () => {
    configurarFetch((llamada) => {
      assert.strictEqual(llamada.metodo, 'POST');
      return crearRespuesta(409, { mensaje: 'El DNI 12.345.678 ya está registrado en el sistema' });
    });
    const user = userEvent.setup();
    render(React.createElement(PacienteForm));

    await completarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: 'Guardar paciente' }));

    await screen.findByText('Este DNI ya está registrado en el sistema');
    assert.strictEqual(screen.queryByText('Paciente creado correctamente'), null);
  });

  it('convierte los errores 400 del backend (array {campo, error}) en mensajes inline', async () => {
    configurarFetch(() =>
      crearRespuesta(400, [{ campo: 'nombre', error: 'El nombre es obligatorio' }])
    );
    const user = userEvent.setup();
    render(React.createElement(PacienteForm));

    await completarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: 'Guardar paciente' }));

    await screen.findByText('El nombre es obligatorio');
  });

  it('crea el paciente con la direccion anidada y muestra el mensaje de exito (RF-3)', async () => {
    const llamadas = configurarFetch((llamada) => {
      assert.strictEqual(llamada.url, '/api/pacientes');
      assert.strictEqual(llamada.metodo, 'POST');
      return crearRespuesta(201, null);
    });
    const user = userEvent.setup();
    render(React.createElement(PacienteForm));

    await completarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: 'Guardar paciente' }));

    await screen.findByText('Paciente creado correctamente');
    assert.strictEqual(llamadas.length, 1);
    const cuerpo = JSON.parse(llamadas[0].cuerpo);
    assert.strictEqual(cuerpo.nombre, 'Juan Pérez');
    assert.strictEqual(cuerpo.dni, '12.345.678');
    assert.deepStrictEqual(cuerpo.direccion, {
      calle: 'Calle Falsa',
      numero: '123',
      complemento: 'Piso 2',
      distrito: 'Centro',
      ciudad: 'Madrid'
    });
    // EL FORMULARIO SE LIMPIA TRAS EL ALTA PARA PERMITIR REGISTRAR OTRO PACIENTE
    assert.strictEqual(screen.getByLabelText('Nombre:').value, '');
  });

  it('permite crear el paciente con complemento y distrito en blanco (opcionales)', async () => {
    const llamadas = configurarFetch(() => crearRespuesta(201, null));
    const user = userEvent.setup();
    render(React.createElement(PacienteForm));

    // EN EL ALTA SE AVISA DE QUE EL DNI NO SE PODRA EDITAR DESPUES
    assert.ok(screen.getByText('El DNI no se podrá editar después de guardar.'));

    await completarSoloObligatorios(user);
    await user.click(screen.getByRole('button', { name: 'Guardar paciente' }));

    await screen.findByText('Paciente creado correctamente');
    assert.strictEqual(llamadas.length, 1);
    const cuerpo = JSON.parse(llamadas[0].cuerpo);
    assert.strictEqual(cuerpo.direccion.complemento, '');
    assert.strictEqual(cuerpo.direccion.distrito, '');
    // NO SON OBLIGATORIOS: NO SE MARCAN COMO required NI COMO aria-required
    assert.strictEqual(screen.getByLabelText('Complemento (opcional):').required, false);
    assert.strictEqual(screen.getByLabelText('Distrito (opcional):').getAttribute('aria-required'), 'false');
  });

  it('en edicion carga el detalle, deshabilita DNI y email, y el PUT no los envia', async () => {    const detalle = {
      id: 5,
      nombre: 'Ana García',
      dni: '12.345.678',
      email: 'ana@vollmed.com',
      telefono: '600111222',
      direccion: { calle: 'C/ Mayor', numero: '1', complemento: 'Piso 1', distrito: 'Centro', ciudad: 'Madrid' }
    };
    const llamadas = configurarFetch((llamada) => {
      if (llamada.url === '/api/pacientes/5') return crearRespuesta(200, detalle);
      if (llamada.metodo === 'PUT') return crearRespuesta(200, null);
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    const user = userEvent.setup();
    render(React.createElement(PacienteForm, { pacienteId: 5 }));

    await screen.findByDisplayValue('Ana García');
    assert.ok(screen.getByLabelText('DNI (formato 12.345.678):').disabled, 'DNI solo lectura en edicion');
    assert.strictEqual(screen.getByLabelText('Email:').disabled, false, 'el email si se puede editar');
    assert.strictEqual(screen.queryByText('El DNI no se podrá editar después de guardar.'), null);

    const email = screen.getByLabelText('Email:');
    await user.clear(email);
    await user.type(email, 'ana.nueva@vollmed.com');
    const telefono = screen.getByLabelText('Teléfono (9 dígitos):');
    await user.clear(telefono);
    await user.type(telefono, '600999888');
    await user.click(screen.getByRole('button', { name: 'Guardar paciente' }));

    await screen.findByText('Paciente actualizado correctamente');
    const put = llamadas.find((llamada) => llamada.metodo === 'PUT');
    assert.ok(put, 'debe haber una llamada PUT');
    const cuerpo = JSON.parse(put.cuerpo);
    assert.strictEqual(cuerpo.id, 5);
    assert.strictEqual(cuerpo.nombre, 'Ana García');
    assert.strictEqual(cuerpo.email, 'ana.nueva@vollmed.com');
    assert.strictEqual(cuerpo.telefono, '600999888');
    // EL DNI NO SE EDITA: NO VIAJA EN EL CUERPO DEL PUT
    assert.ok(!('dni' in cuerpo), 'el PUT no debe llevar dni');
    assert.strictEqual(cuerpo.direccion.calle, 'C/ Mayor');
  });
});
