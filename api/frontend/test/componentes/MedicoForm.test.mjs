// TESTS DEL COMPONENTE MedicoForm. CUBREN ALTA Y EDICION DE MEDICOS:
// VALIDACION INLINE, ESPECIALIDAD OBLIGATORIA, CUERPO DEL POST/PUT,
// DNI BLOQUEADO EN EDICION Y DUPLICADOS (409).
import { configurarFetch, crearRespuesta } from '../helpers/dom.mjs';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicoForm } from '../../src/components/MedicoForm.js';

// RELLENA EL FORMULARIO CON DATOS VALIDOS (DIRECCION CON SUS 5 SUBCAMPOS)
const completarFormularioValido = async (user) => {
  await user.type(screen.getByLabelText('Nombre:'), 'Gregory House');
  await user.type(screen.getByLabelText('DNI (formato 12.345.678):'), '12.345.678');
  await user.type(screen.getByLabelText('Email:'), 'house@vollmed.com');
  await user.type(screen.getByLabelText('Teléfono (9 dígitos):'), '600123456');
  await user.selectOptions(screen.getByLabelText('Especialidad:'), 'CARDIOLOGIA');
  await user.type(screen.getByLabelText('Calle:'), 'Calle Falsa');
  await user.type(screen.getByLabelText('Número:'), '123');
  await user.type(screen.getByLabelText('Complemento (opcional):'), 'Piso 2');
  await user.type(screen.getByLabelText('Distrito (opcional):'), 'Centro');
  await user.type(screen.getByLabelText('Ciudad:'), 'Madrid');
};

describe('Componente MedicoForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('muestra errores inline y no envia nada con el formulario vacio', async () => {
    const llamadas = configurarFetch(() => crearRespuesta(201, null));
    const user = userEvent.setup();
    render(React.createElement(MedicoForm));

    await user.click(screen.getByRole('button', { name: 'Guardar médico' }));

    await screen.findByText('El nombre no puede estar vacío');
    await screen.findByText('El DNI no puede estar vacío');
    await screen.findByText('La especialidad es obligatoria');
    await screen.findByText('La calle es obligatorio');
    assert.strictEqual(llamadas.length, 0, 'con campos invalidos no se llama al servidor');
    assert.strictEqual(screen.getByLabelText('Nombre:').getAttribute('aria-invalid'), 'true');
    assert.strictEqual(screen.getByLabelText('Especialidad:').getAttribute('aria-invalid'), 'true');
  });

  it('crea el medico con la especialidad y la direccion anidada', async () => {
    const llamadas = configurarFetch(() => crearRespuesta(201, null));
    const user = userEvent.setup();
    render(React.createElement(MedicoForm));

    // EN EL ALTA SE AVISA DE QUE EL DNI NO SE PODRA EDITAR DESPUES
    assert.ok(screen.getByText('El DNI no se podrá editar después de guardar.'));

    await completarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: 'Guardar médico' }));

    await screen.findByText('Médico creado correctamente');
    assert.strictEqual(llamadas.length, 1);
    assert.strictEqual(llamadas[0].metodo, 'POST');
    assert.strictEqual(llamadas[0].url, '/api/medico');
    const cuerpo = JSON.parse(llamadas[0].cuerpo);
    assert.strictEqual(cuerpo.nombre, 'Gregory House');
    assert.strictEqual(cuerpo.especialidad, 'CARDIOLOGIA');
    assert.deepStrictEqual(cuerpo.direccion, {
      calle: 'Calle Falsa',
      numero: '123',
      complemento: 'Piso 2',
      distrito: 'Centro',
      ciudad: 'Madrid'
    });
    // EL FORMULARIO SE LIMPIA TRAS EL ALTA
    assert.strictEqual(screen.getByLabelText('Nombre:').value, '');
    assert.strictEqual(screen.getByLabelText('Especialidad:').value, '');
  });

  it('convierte el 409 de duplicado en un error inline junto al DNI', async () => {
    configurarFetch(() =>
      crearRespuesta(409, { mensaje: 'El DNI ya está registrado en el sistema' })
    );
    const user = userEvent.setup();
    render(React.createElement(MedicoForm));

    await completarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: 'Guardar médico' }));

    await screen.findByText('Este DNI ya está registrado en el sistema');
    assert.strictEqual(screen.getByLabelText('DNI (formato 12.345.678):').getAttribute('aria-invalid'), 'true');
  });

  it('en edicion bloquea el DNI y el PUT envia email, telefono y especialidad (sin DNI)', async () => {
    const detalle = {
      id: 3,
      nombre: 'Gregory House',
      especialidad: 'CARDIOLOGIA',
      email: 'house@vollmed.com',
      telefono: '600123456',
      dni: '12.345.678',
      direccion: { calle: 'C/ Mayor', numero: '1', complemento: '', distrito: '', ciudad: 'Madrid' }
    };
    const llamadas = configurarFetch((llamada) => {
      if (llamada.url === '/api/medico/3') return crearRespuesta(200, detalle);
      if (llamada.metodo === 'PUT') return crearRespuesta(200, null);
      throw new Error(`Llamada inesperada: ${llamada.metodo} ${llamada.url}`);
    });
    const user = userEvent.setup();
    render(React.createElement(MedicoForm, { medicoId: 3 }));

    await screen.findByDisplayValue('Gregory House');
    assert.ok(screen.getByLabelText('DNI (formato 12.345.678):').disabled, 'DNI solo lectura en edicion');
    assert.strictEqual(screen.getByLabelText('Email:').disabled, false);
    assert.strictEqual(screen.getByLabelText('Especialidad:').disabled, false);
    assert.strictEqual(screen.queryByText('El DNI no se podrá editar después de guardar.'), null);

    const telefono = screen.getByLabelText('Teléfono (9 dígitos):');
    await user.clear(telefono);
    await user.type(telefono, '600999888');
    await user.selectOptions(screen.getByLabelText('Especialidad:'), 'PEDIATRIA');
    await user.click(screen.getByRole('button', { name: 'Guardar médico' }));

    await screen.findByText('Médico actualizado correctamente');
    const put = llamadas.find((llamada) => llamada.metodo === 'PUT');
    assert.ok(put, 'debe haber una llamada PUT');
    const cuerpo = JSON.parse(put.cuerpo);
    assert.strictEqual(cuerpo.id, 3);
    assert.strictEqual(cuerpo.telefono, '600999888');
    assert.strictEqual(cuerpo.especialidad, 'PEDIATRIA');
    assert.strictEqual(cuerpo.email, 'house@vollmed.com');
    // EL DNI NO SE EDITA: NO VIAJA EN EL CUERPO DEL PUT
    assert.ok(!('dni' in cuerpo), 'el PUT no debe llevar dni');
    assert.strictEqual(cuerpo.direccion.calle, 'C/ Mayor');
  });
});
