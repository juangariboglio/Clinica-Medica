import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage
const createLocalStorageMock = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
};

let llamadasFetch;
let authService;

beforeEach(async () => {
  llamadasFetch = [];
  const localStorageMock = createLocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true
  });
  // EL BACKEND REAL RESPONDE {"jwtToken": "..."} (DTOJWTtoken)
  globalThis.fetch = async (url, opciones = {}) => {
    llamadasFetch.push({ url, opciones });
    return {
      ok: true,
      json: async () => ({ jwtToken: 'token-de-prueba' })
    };
  };
  const modulo = await import('../frontend/src/services/authService.js');
  authService = modulo.default;
});

describe('authService', () => {
  it('debería exponer login, logout, getToken y setToken', () => {
    assert.strictEqual(typeof authService.login, 'function');
    assert.strictEqual(typeof authService.logout, 'function');
    assert.strictEqual(typeof authService.getToken, 'function');
    assert.strictEqual(typeof authService.setToken, 'function');
  });

  it('getToken debería devolver null cuando no hay token', () => {
    assert.strictEqual(authService.getToken(), null);
  });

  it('setToken debería guardar el token y getToken recuperarlo', () => {
    authService.setToken('test-token-123');
    assert.strictEqual(authService.getToken(), 'test-token-123');
  });

  it('logout debería eliminar el token', () => {
    authService.setToken('algun-token');
    authService.logout();
    assert.strictEqual(authService.getToken(), null);
  });

  it('login debería enviar {login, clave} a /api/login y guardar el jwtToken', async () => {
    await authService.login({ login: 'usuario.prueba', clave: 'secreta123' });
    assert.strictEqual(llamadasFetch.length, 1);
    const llamada = llamadasFetch[0];
    assert.strictEqual(llamada.url, '/api/login');
    assert.strictEqual(llamada.opciones.method, 'POST');
    const cuerpo = JSON.parse(llamada.opciones.body);
    // EL BACKEND ESPERA login/clave, NO username/password
    assert.strictEqual(cuerpo.login, 'usuario.prueba');
    assert.strictEqual(cuerpo.clave, 'secreta123');
    assert.strictEqual(cuerpo.username, undefined);
    // EL TOKEN VIENE EN EL CAMPO jwtToken DE LA RESPUESTA
    assert.strictEqual(authService.getToken(), 'token-de-prueba');
  });

  it('login debería lanzar error cuando el backend rechaza las credenciales (403)', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      json: async () => ({})
    });
    await assert.rejects(
      authService.login({ login: 'mal', clave: 'mal' }),
      /incorrectos/
    );
    assert.strictEqual(authService.getToken(), null);
  });

  it('obtenerUsuarioActual debería decodificar el subject del JWT guardado', () => {
    // JWT con payload {"sub":"ana.martinez","id":7} en base64url
    const payload = Buffer.from(JSON.stringify({ sub: 'ana.martinez', id: 7 })).toString('base64url');
    authService.setToken(`header.${payload}.firma`);
    const usuario = authService.obtenerUsuarioActual();
    assert.strictEqual(usuario.login, 'ana.martinez');
    assert.strictEqual(usuario.id, 7);
  });

  it('obtenerUsuarioActual debería devolver null sin token o con token corrupto', () => {
    assert.strictEqual(authService.obtenerUsuarioActual(), null);
    authService.setToken('no-es-un-jwt');
    assert.strictEqual(authService.obtenerUsuarioActual(), null);
  });
});
