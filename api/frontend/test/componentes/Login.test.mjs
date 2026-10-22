// TESTS DEL COMPONENTE LOGIN (T31). CUBREN RF-1 (INICIO DE SESION Y PAGINA
// PRINCIPAL TRAS AUTENTICARSE) Y EL CASO DE CREDENCIALES INVALIDAS.
import { configurarFetch, crearRespuesta, crearJWT } from '../helpers/dom.mjs';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../src/components/Login.js';

// EL LOGIN USA useNavigate: SE MONTA DENTRO DEL ROUTER CON UNA RUTA DESTINO
// PARA PODER COMPROBAR LA REDIRECCION TRAS INICIAR SESION
const montarLogin = () =>
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/login'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/login', element: React.createElement(Login) }),
        React.createElement(Route, { path: '/', element: React.createElement('div', null, 'PAGINA PRINCIPAL') })
      )
    )
  );

describe('Componente Login', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('muestra un error accesible si se envia vacio y no llama al backend (RF-14)', async () => {
    const llamadas = configurarFetch(() => crearRespuesta(200, {}));
    const user = userEvent.setup();
    montarLogin();

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const aviso = await screen.findByRole('alert');
    assert.strictEqual(aviso.textContent, 'Debe completar el usuario y la contraseña');
    assert.strictEqual(llamadas.length, 0, 'no debe haber llamadas HTTP con el formulario vacio');
  });

  it('muestra "Usuario o contraseña incorrectos" cuando el backend rechaza las credenciales', async () => {
    configurarFetch(() => crearRespuesta(403, null));
    const user = userEvent.setup();
    montarLogin();

    await user.type(screen.getByLabelText('Usuario:'), 'recepcion.e2e');
    await user.type(screen.getByLabelText('Contraseña:'), 'clave-mala');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const aviso = await screen.findByRole('alert');
    assert.strictEqual(aviso.textContent, 'Usuario o contraseña incorrectos');
    assert.strictEqual(localStorage.getItem('token'), null, 'no se guarda token con credenciales invalidas');
  });

  it('guarda el token y redirige a la pagina principal tras un login valido (RF-1)', async () => {
    const token = crearJWT({ sub: 'recepcion.e2e', id: 1 });
    configurarFetch((llamada) => {
      assert.ok(llamada.url.startsWith('/api/login'), `URL inesperada: ${llamada.url}`);
      const cuerpo = JSON.parse(llamada.cuerpo);
      assert.strictEqual(cuerpo.login, 'recepcion.e2e');
      assert.strictEqual(cuerpo.clave, 'clave-correcta');
      return crearRespuesta(200, { jwtToken: token });
    });
    const user = userEvent.setup();
    montarLogin();

    await user.type(screen.getByLabelText('Usuario:'), 'recepcion.e2e');
    await user.type(screen.getByLabelText('Contraseña:'), 'clave-correcta');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await screen.findByText('PAGINA PRINCIPAL');
    assert.strictEqual(localStorage.getItem('token'), token);
  });
});
