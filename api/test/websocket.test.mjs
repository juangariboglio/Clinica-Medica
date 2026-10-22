import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage
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
globalThis.localStorage = localStorageMock;

// WEBSOCKET FALSO: REGISTRA LAS CONEXIONES Y PERMITE SIMULAR MENSAJES Y CIERRES
class WebSocketFake {
  static instancias = [];
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.cerrada = false;
    WebSocketFake.instancias.push(this);
  }
  abrir() {
    this.readyState = 1; // OPEN
  }
  recibirMensaje(datos) {
    if (this.onmessage) {
      this.onmessage({ data: datos });
    }
  }
  cerrar() {
    if (this.cerrada) {
      return;
    }
    this.cerrada = true;
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose();
    }
  }
}

// location FALSA (EL CLIENTE USA location.protocol/host PARA LA URL DEL WS)
globalThis.location = { protocol: 'http:', host: 'localhost:5173' };

let websocket;
let cerrarTodo;

beforeEach(async () => {
  WebSocketFake.instancias = [];
  globalThis.WebSocket = WebSocketFake;
  localStorageMock.clear();
  // OJO: EL MODULO MANTIENE ESTADO (socket, SUSCRIPTORES) PORQUE EL IMPORT SE
  // CACHEA; CADA TEST LO LIMPIA CON cerrarWebSocket EN EL afterEach
  const modulo = await import('../frontend/src/utils/websocket.js');
  websocket = modulo;
  cerrarTodo = () => modulo.cerrarWebSocket();
});

afterEach(() => {
  cerrarTodo();
});

describe('RF-7/RNF-3: cliente WebSocket', () => {
  it('debería exponer conectarWebSocket, suscribirActualizaciones y cerrarWebSocket', () => {
    assert.strictEqual(typeof websocket.conectarWebSocket, 'function');
    assert.strictEqual(typeof websocket.suscribirActualizaciones, 'function');
    assert.strictEqual(typeof websocket.cerrarWebSocket, 'function');
  });

  it('sin token no abre ninguna conexión', () => {
    const socket = websocket.conectarWebSocket();
    assert.strictEqual(socket, null);
    assert.strictEqual(WebSocketFake.instancias.length, 0);
  });

  it('con token abre la conexión a /ws con el token en el query param', () => {
    localStorage.setItem('token', 'jwt-de-prueba');
    const socket = websocket.conectarWebSocket();
    assert.ok(socket instanceof WebSocketFake);
    assert.strictEqual(
      socket.url,
      'ws://localhost:5173/ws?token=jwt-de-prueba'
    );
  });

  it('no abre una segunda conexión si ya hay una en curso', () => {
    localStorage.setItem('token', 'jwt-de-prueba');
    websocket.conectarWebSocket();
    websocket.conectarWebSocket();
    assert.strictEqual(WebSocketFake.instancias.length, 1);
  });

  it('notifica a los suscriptores cuando llega un evento de consulta creada', () => {
    localStorage.setItem('token', 'jwt-de-prueba');
    const eventos = [];
    const cancelar = websocket.suscribirActualizaciones((evento) => eventos.push(evento));
    const socket = websocket.conectarWebSocket();
    socket.recibirMensaje('{"tipo":"CONSULTA_CREADA"}');
    assert.deepStrictEqual(eventos, [{ tipo: 'CONSULTA_CREADA' }]);
    // AL CANCELAR LA SUSCRIPCION NO SE RECIBEN MAS EVENTOS
    cancelar();
    socket.recibirMensaje('{"tipo":"CONSULTA_CANCELADA"}');
    assert.strictEqual(eventos.length, 1);
  });

  it('un mensaje sin JSON también refresca (evento null) y un suscriptor que falla no rompe el resto', () => {
    localStorage.setItem('token', 'jwt-de-prueba');
    const eventos = [];
    websocket.suscribirActualizaciones(() => {
      throw new Error('suscriptor roto');
    });
    websocket.suscribirActualizaciones((evento) => eventos.push(evento));
    const socket = websocket.conectarWebSocket();
    socket.recibirMensaje('no-es-json');
    assert.deepStrictEqual(eventos, [null]);
  });

  it('al cerrarse la conexión se puede reconectar y estaConectado refleja el estado', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    try {
      localStorage.setItem('token', 'jwt-de-prueba');
      const primerSocket = websocket.conectarWebSocket();
      primerSocket.abrir();
      assert.strictEqual(websocket.estaConectado(), true);
      // SE SIMULA EL CIERRE POR PARTE DEL SERVIDOR
      primerSocket.cerrar();
      assert.strictEqual(websocket.estaConectado(), false);
      // LA RECONEXION SE PROGRAMA A LOS 5 SEGUNDOS
      assert.strictEqual(WebSocketFake.instancias.length, 1);
      t.mock.timers.tick(5100);
      await new Promise((resolver) => setImmediate(resolver));
      assert.strictEqual(WebSocketFake.instancias.length, 2);
    } finally {
      t.mock.timers.reset();
    }
  });

  it('cerrarWebSocket cancela la reconexión pendiente', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    try {
      localStorage.setItem('token', 'jwt-de-prueba');
      const socket = websocket.conectarWebSocket();
      socket.cerrar();
      websocket.cerrarWebSocket();
      t.mock.timers.tick(6000);
      await new Promise((resolver) => setImmediate(resolver));
      // NO SE REINTENTO NINGUNA CONEXION
      assert.strictEqual(WebSocketFake.instancias.length, 1);
    } finally {
      t.mock.timers.reset();
    }
  });
});
