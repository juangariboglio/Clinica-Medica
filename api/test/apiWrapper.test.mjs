import { describe, it, beforeEach } from 'node:test';
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

describe('API wrapper with 401 handling', () => {
  it('should export a fetch wrapper function', async () => {
    const module = await import('../frontend/src/utils/api.js');
    assert.strictEqual(typeof module.fetchWithAuth, 'function');
  });
});

describe('RF-9: monitor de conexión', () => {
  // Nota: el estado del monitor vive en el módulo, por lo que estos tests
  // son secuenciales y cada uno deja el estado esperado para el siguiente.
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    localStorageMock.clear();
    localStorage.setItem('token', 'dummy-token');
  });

  it('una respuesta exitosa reinicia el contador de fallos', async () => {
    const module = await import('../frontend/src/utils/api.js');
    let llamadas = 0;
    global.fetch = async () => {
      llamadas++;
      return { ok: true, status: 200, json: async () => [] };
    };
    try {
      await module.fetchWithAuth('/api/pacientes');
      assert.strictEqual(module.estaConexionPerdida(), false);
      assert.strictEqual(llamadas, 1);
    } finally {
      global.fetch = fetchOriginal;
    }
  });

  it('bloquea las escrituras tras 3 fallos consecutivos', async () => {
    const module = await import('../frontend/src/utils/api.js');
    let llamadas = 0;
    global.fetch = async () => {
      llamadas++;
      throw new TypeError('Failed to fetch');
    };

    // Tres lecturas fallidas consecutivas (conexión perdida)
    for (let i = 0; i < 3; i++) {
      await assert.rejects(
        module.fetchWithAuth('/api/pacientes'),
        /Error de conexión/
      );
    }
    assert.strictEqual(module.estaConexionPerdida(), true);
    assert.strictEqual(llamadas, 3);

    // La escritura queda bloqueada y ni siquiera llega a llamar a fetch
    const llamadasAntes = llamadas;
    await assert.rejects(
      module.fetchWithAuth('/api/pacientes', { method: 'POST', body: '{}' }),
      /Sin conexión: no se pueden realizar operaciones de escritura/
    );
    assert.strictEqual(llamadas, llamadasAntes);

    global.fetch = async () => {
      llamadas++;
      return { ok: true, status: 200, json: async () => [] };
    };
    // Las lecturas siguen permitidas con la conexión perdida...
    await module.fetchWithAuth('/api/pacientes');
    assert.strictEqual(llamadas, llamadasAntes + 1);
    // ...y una respuesta exitosa restablece la conexión
    assert.strictEqual(module.estaConexionPerdida(), false);

    global.fetch = fetchOriginal;
  });

  it('cuenta como fallo una petición que excede el timeout de 5 s', async (t) => {
    const module = await import('../frontend/src/utils/api.js');
    t.mock.timers.enable({ apis: ['setTimeout'] });
    try {
      global.fetch = (input, init) =>
        new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('The operation was aborted')));
        });

      const promesa = assert.rejects(
        module.fetchWithAuth('/api/pacientes'),
        /Error de conexión/
      );
      // Avanza el reloj más allá del timeout de 5 s
      t.mock.timers.tick(5100);
      await promesa;
    } finally {
      t.mock.timers.reset();
      global.fetch = fetchOriginal;
      // Deja el monitor en estado estable para los siguientes tests
      global.fetch = async () => ({ ok: true, status: 200, json: async () => [] });
      await module.fetchWithAuth('/api/pacientes');
      global.fetch = fetchOriginal;
    }
  });

  it('notifica los cambios de estado a los suscriptores', async () => {
    const module = await import('../frontend/src/utils/api.js');
    const estados = [];
    const cancelar = module.suscribirEstadoConexion((perdida) => estados.push(perdida));
    try {
      assert.deepStrictEqual(estados, [false]);

      global.fetch = async () => {
        throw new TypeError('Failed to fetch');
      };
      for (let i = 0; i < 3; i++) {
        await assert.rejects(module.fetchWithAuth('/api/pacientes'), /Error de conexión/);
      }
      assert.strictEqual(module.estaConexionPerdida(), true);
      assert.deepStrictEqual(estados, [false, true]);

      // Una respuesta exitosa restablece la conexión y notifica de nuevo
      global.fetch = async () => ({ ok: true, status: 200, json: async () => [] });
      await module.fetchWithAuth('/api/pacientes');
      assert.strictEqual(module.estaConexionPerdida(), false);
      assert.deepStrictEqual(estados, [false, true, false]);
    } finally {
      cancelar();
      global.fetch = fetchOriginal;
    }
  });
});
