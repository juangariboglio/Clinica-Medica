// CONFIGURACION DE JSDOM PARA LOS TESTS DE COMPONENTES (T31).
// ESTE MODULO DEBE SER EL PRIMER IMPORT DE CADA ARCHIVO DE TESTS: SUS EFECTOS A
// NIVEL DE MODULO (LOS GLOBALES DEL NAVEGADOR) SE EJECUTAN ANTES DE QUE SE
// EVALUEN REACT TESTING LIBRARY O CUALQUIER COMPONENTE.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true
});

// NODE 22 YA DEFINE ALGUNOS GLOBALES (p. ej. navigator) COMO PROPIEDADES DE SOLO
// LECTURA: LA ASIGNACION DIRECTA LANZA TypeError. SE USA defineProperty CON
// try/catch PARA QUE EL GLOBAL DE JSDOM PREVALEZCA CUANDO SEA POSIBLE.
const definirGlobal = (nombre, valor) => {
  try {
    Object.defineProperty(globalThis, nombre, { value: valor, writable: true, configurable: true });
  } catch {
    // NODE NO PERMITE REDEFINIR ESTE GLOBAL: SE CONSERDA EL SUYO
  }
};

// GLOBALES QUE REACT, RTL Y USER-EVENT ESPERAN DEL NAVEGADOR
definirGlobal('window', dom.window);
definirGlobal('document', dom.window.document);
definirGlobal('navigator', dom.window.navigator);
definirGlobal('location', dom.window.location);
definirGlobal('HTMLElement', dom.window.HTMLElement);
definirGlobal('Element', dom.window.Element);
definirGlobal('Node', dom.window.Node);
definirGlobal('Event', dom.window.Event);
definirGlobal('CustomEvent', dom.window.CustomEvent);
definirGlobal('MouseEvent', dom.window.MouseEvent);
definirGlobal('KeyboardEvent', dom.window.KeyboardEvent);
// jsdom NO IMPLEMENTA PointerEvent (LO USA user-event PARA LOS CLICS)
definirGlobal('PointerEvent', dom.window.PointerEvent || dom.window.MouseEvent);
definirGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));
definirGlobal('requestAnimationFrame', dom.window.requestAnimationFrame.bind(dom.window));
definirGlobal('cancelAnimationFrame', dom.window.cancelAnimationFrame.bind(dom.window));
definirGlobal('localStorage', dom.window.localStorage);
definirGlobal('scrollTo', () => {});

// jsdom TAMBIEN CARECE DE LA CAPTURA DE PUNTERO QUE USA user-event
if (!dom.window.Element.prototype.hasPointerCapture) {
  dom.window.Element.prototype.hasPointerCapture = () => false;
}
if (!dom.window.Element.prototype.setPointerCapture) {
  dom.window.Element.prototype.setPointerCapture = () => {};
}
if (!dom.window.Element.prototype.releasePointerCapture) {
  dom.window.Element.prototype.releasePointerCapture = () => {};
}

// react-dom 19: act() SOLO FUNCIONA CON ESTE FLAG ACTIVO
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// fetch POR DEFECTO: RECHAZA. CADA TEST CONFIGURA EL SUYO CON configurarFetch
// PARA QUE UNA LLAMADA OLVIDADA HAGA FALLAR EL TEST DE FORMA EVIDENTE.
globalThis.fetch = async () => {
  throw new Error('fetch no configurado para este test');
};

/**
 * Crea una respuesta fetch falsa con el estado y el cuerpo indicados.
 * El cuerpo puede ser un objeto (se serializa a JSON), texto plano o null.
 */
export const crearRespuesta = (estado = 200, cuerpo = null) => {
  const texto =
    cuerpo === null || cuerpo === undefined
      ? ''
      : typeof cuerpo === 'string'
        ? cuerpo
        : JSON.stringify(cuerpo);
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    text: async () => texto,
    json: async () => (texto ? JSON.parse(texto) : null)
  };
};

/**
 * Instala un mock de fetch que delega en el manejador y registra cada llamada
 * ({ url, metodo, cuerpo }) para poder hacer aserciones sobre el trafico HTTP.
 * @param {(llamada: {url: string, metodo: string, cuerpo: string|null}) => object} manejador
 * @returns {Array} La lista de llamadas registradas
 */
export const configurarFetch = (manejador) => {
  const llamadas = [];
  globalThis.fetch = async (entrada, init = {}) => {
    const url =
      typeof entrada === 'string' ? entrada : (entrada && entrada.url) || String(entrada);
    const llamada = {
      url,
      metodo: (init.method || 'GET').toUpperCase(),
      cuerpo: init.body || null
    };
    llamadas.push(llamada);
    return manejador(llamada);
  };
  return llamadas;
};

/** Construye un JWT falso con el payload indicado (lo decodifica authService). */
export const crearJWT = (payload) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.firma-de-prueba`;
