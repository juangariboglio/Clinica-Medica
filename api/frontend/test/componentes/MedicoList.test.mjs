// TESTS DEL COMPONENTE MedicoList. CUBREN EL LISTADO, LA BUSQUEDA POR NOMBRE,
// EL FILTRO POR ESPECIALIDAD Y LA AUSENCIA DE BORRADO DESDE LA PANTALLA.
import { configurarFetch, crearRespuesta } from '../helpers/dom.mjs';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicoList } from '../../src/components/MedicoList.js';

// EL BACKEND DEVUELVE UNA PAGINA DE SPRING: EL SERVICIO DESEMPAQUETA .content
const paginaMedicos = {
  content: [
    { id: 1, nombre: 'Dra. House', especialidad: 'CARDIOLOGIA', dni: '11.111.111', email: 'house@vollmed.com' },
    { id: 2, nombre: 'Dr. Strange', especialidad: 'PEDIATRIA', dni: '22.222.222', email: 'strange@vollmed.com' },
    { id: 3, nombre: 'Dra. Grey', especialidad: 'CARDIOLOGIA', dni: '33.333.333', email: 'grey@vollmed.com' }
  ]
};

const renderizarLista = () =>
  render(
    React.createElement(MemoryRouter, null, React.createElement(MedicoList, null))
  );

describe('Componente MedicoList', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('muestra los medicos del backend con su especialidad', async () => {
    const llamadas = configurarFetch(() => crearRespuesta(200, paginaMedicos));
    renderizarLista();

    await screen.findByText('Dra. House');
    assert.strictEqual(llamadas[0].url, '/api/medico?size=50');
    assert.ok(screen.getByText('Dr. Strange'));
    assert.ok(screen.getByText('Dra. Grey'));
    assert.ok(screen.getAllByText('CARDIOLOGIA').length >= 1);
    assert.ok(screen.getByRole('button', { name: 'Registrar nuevo médico' }));
    // NO HAY BORRADO DESDE LA LISTA
    assert.strictEqual(screen.queryByRole('button', { name: /Eliminar médico/ }), null);
  });

  it('busca por nombre sin distinguir mayusculas', async () => {
    configurarFetch(() => crearRespuesta(200, paginaMedicos));
    const user = userEvent.setup();
    renderizarLista();

    await screen.findByText('Dra. House');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar médico por nombre' }), 'strange');

    assert.ok(screen.getByText('Dr. Strange'));
    assert.strictEqual(screen.queryByText('Dra. House'), null);
    assert.strictEqual(screen.queryByText('Dra. Grey'), null);
  });

  it('filtra por especialidad', async () => {
    configurarFetch(() => crearRespuesta(200, paginaMedicos));
    renderizarLista();

    await screen.findByText('Dra. House');
    fireEvent.change(screen.getByLabelText('Filtrar médicos por especialidad'), {
      target: { value: 'PEDIATRIA' }
    });

    assert.ok(screen.getByText('Dr. Strange'));
    assert.strictEqual(screen.queryByText('Dra. House'), null);
  });

  it('avisa cuando ningun medico coincide con los filtros', async () => {
    configurarFetch(() => crearRespuesta(200, paginaMedicos));
    const user = userEvent.setup();
    renderizarLista();

    await screen.findByText('Dra. House');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar médico por nombre' }), 'inexistente');

    await screen.findByText('No se encontraron médicos');
  });

  it('muestra el error del servicio si falla la carga', async () => {
    configurarFetch(() => crearRespuesta(500, { mensaje: 'Fallo del servidor' }));
    renderizarLista();

    await screen.findByText('Fallo del servidor');
  });
});
