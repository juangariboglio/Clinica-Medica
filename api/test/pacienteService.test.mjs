import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage para que authService.getToken funcione en Node
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
global.localStorage = localStorageMock;

// Mock fetch
let mockFetchImpl;
const originalFetch = global.fetch;

// FABRICA DE RESPUESTAS CON CUERPO (text/json como fetch real)
const respuesta = (estado, cuerpo) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
  json: async () => cuerpo
});

function setupFetchMock(mockImpl) {
  mockFetchImpl = mockImpl;
  global.fetch = async (input, init) => {
    return mockFetchImpl(input, init);
  };
}

function teardownFetchMock() {
  global.fetch = originalFetch;
  localStorageMock.clear();
}

describe('pacienteService module (contrato del backend real)', () => {
  afterEach(() => {
    teardownFetchMock();
  });

  it('debería exponer getAll, getById, create, update y remove', async () => {
    const module = await import('../frontend/src/services/pacienteService.js');
    assert.strictEqual(typeof module.getAll, 'function');
    assert.strictEqual(typeof module.getById, 'function');
    assert.strictEqual(typeof module.create, 'function');
    assert.strictEqual(typeof module.update, 'function');
    assert.strictEqual(typeof module.remove, 'function');
  });

  it('getAll debería desenvolver el content de la página y enviar el token', async () => {
    localStorage.setItem('token', 'dummy-token');
    const module = await import('../frontend/src/services/pacienteService.js');
    let llamadoCon = null;
    setupFetchMock(async (input, init) => {
      llamadoCon = { input, init };
      return respuesta(200, { content: [{ id: 1, nombre: 'Juan', email: 'j@e.com', dni: '12.345.678' }] });
    });
    const datos = await module.getAll();
    assert.strictEqual(llamadoCon.input, '/api/pacientes?size=50');
    assert.strictEqual(llamadoCon.init.method, undefined);
    assert.strictEqual(llamadoCon.init.headers.get('Content-Type'), 'application/json');
    assert.strictEqual(llamadoCon.init.headers.get('Authorization'), 'Bearer dummy-token');
    assert.deepStrictEqual(datos, [{ id: 1, nombre: 'Juan', email: 'j@e.com', dni: '12.345.678' }]);
  });

  it('create debería enviar la dirección anidada', async () => {
    localStorage.setItem('token', 'dummy-token');
    const module = await import('../frontend/src/services/pacienteService.js');
    const datosPaciente = {
      nombre: 'Juan',
      email: 'juan@ejemplo.com',
      telefono: '123456789',
      dni: '12.345.678',
      calle: 'Calle 1',
      distrito: 'Centro',
      ciudad: 'Madrid',
      numero: '10',
      complemento: 'A'
    };
    let cuerpoEnviado = null;
    setupFetchMock(async (input, init) => {
      cuerpoEnviado = JSON.parse(init.body);
      return respuesta(200, undefined);
    });
    const creado = await module.create(datosPaciente);
    assert.strictEqual(creado, null);
    assert.strictEqual(cuerpoEnviado.nombre, 'Juan');
    assert.strictEqual(cuerpoEnviado.direccion.calle, 'Calle 1');
    assert.strictEqual(cuerpoEnviado.calle, undefined);
  });

  it('getById debería consultar /api/pacientes/{id} y devolver el detalle', async () => {
    localStorage.setItem('token', 'dummy-token');
    const module = await import('../frontend/src/services/pacienteService.js');
    let urlConsultada = '';
    setupFetchMock(async (input) => {
      urlConsultada = input;
      return respuesta(200, { id: 5, nombre: 'Juan', direccion: { calle: 'Calle 1' } });
    });
    const datos = await module.getById(5);
    assert.strictEqual(urlConsultada, '/api/pacientes/5');
    assert.deepStrictEqual(datos, { id: 5, nombre: 'Juan', direccion: { calle: 'Calle 1' } });
  });

  it('update debería enviar {id, nombre, telefono, direccion} al PUT', async () => {
    localStorage.setItem('token', 'dummy-token');
    const module = await import('../frontend/src/services/pacienteService.js');
    let metodoVisto = '';
    let cuerpoEnviado = null;
    setupFetchMock(async (input, init) => {
      metodoVisto = init.method;
      cuerpoEnviado = JSON.parse(init.body);
      return respuesta(200, undefined);
    });
    const actualizado = await module.update(1, {
      nombre: 'Juan Act',
      telefono: '987654321',
      calle: 'Calle 2',
      distrito: 'Norte',
      ciudad: 'Madrid',
      numero: '20',
      complemento: 'B'
    });
    assert.strictEqual(actualizado, null);
    assert.strictEqual(metodoVisto, 'PUT');
    assert.strictEqual(cuerpoEnviado.id, 1);
    assert.strictEqual(cuerpoEnviado.nombre, 'Juan Act');
    assert.strictEqual(cuerpoEnviado.direccion.calle, 'Calle 2');
    assert.strictEqual(cuerpoEnviado.dni, undefined);
  });

  it('delete (remove) debería llamar a DELETE /api/pacientes/{id} y tolerar 204', async () => {
    localStorage.setItem('token', 'dummy-token');
    const module = await import('../frontend/src/services/pacienteService.js');
    let urlConsultada = '';
    let metodoVisto = '';
    setupFetchMock(async (input, init) => {
      urlConsultada = input;
      metodoVisto = init.method;
      return { ok: true, status: 204, text: async () => '' };
    });
    const resultado = await module.delete(1);
    assert.strictEqual(resultado, null);
    assert.strictEqual(urlConsultada, '/api/pacientes/1');
    assert.strictEqual(metodoVisto, 'DELETE');
  });
});
