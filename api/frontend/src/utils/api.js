import { authService } from '../services/authService.js';

// RF-9: monitor de conexión. Una conexión se considera perdida tras 3 peticiones
// consecutivas sin respuesta (timeout de 5 s cada una). Mientras esté perdida, se
// bloquean las operaciones de escritura (POST, PUT, PATCH, DELETE).
const TIMEOUT_MS = 5000;
const UMBRAL_FALLOS = 3;
const METODOS_ESCRITURA = ['POST', 'PUT', 'PATCH', 'DELETE'];

let fallosConsecutivos = 0;
let conexionPerdida = false;
const suscriptores = [];

/** Suscribe un callback a los cambios de estado de la conexión. Devuelve una función para cancelar. */
export const suscribirEstadoConexion = (callback) => {
  suscriptores.push(callback);
  callback(conexionPerdida);
  return () => {
    const indice = suscriptores.indexOf(callback);
    if (indice !== -1) {
      suscriptores.splice(indice, 1);
    }
  };
};

/** Indica si la conexión se considera perdida (RF-9). */
export const estaConexionPerdida = () => conexionPerdida;

const notificarCambioEstado = () => {
  suscriptores.forEach((callback) => callback(conexionPerdida));
};

const registrarExito = () => {
  fallosConsecutivos = 0;
  if (conexionPerdida) {
    conexionPerdida = false;
    notificarCambioEstado();
  }
};

const registrarFallo = () => {
  fallosConsecutivos++;
  if (fallosConsecutivos >= UMBRAL_FALLOS && !conexionPerdida) {
    conexionPerdida = true;
    notificarCambioEstado();
  }
};

const esOperacionEscritura = (metodo) => METODOS_ESCRITURA.includes(metodo.toUpperCase());

/**
 * Interpreta el cuerpo de una respuesta de error del backend (RF-15/RF-16). El
 * backend puede responder con: texto plano (ValidacionException), un array de
 * {campo, error} (errores 400 de Bean Validation) o un objeto {mensaje} (409 de
 * duplicados). Devuelve el mensaje más informativo disponible.
 */
const extraerMensajeDeError = (datos) => {
  if (typeof datos === 'string' && datos.trim() !== '') {
    return datos;
  }
  if (Array.isArray(datos) && datos.length > 0) {
    return datos
      .filter((e) => e && (e.campo || e.error))
      .map((e) => (e.campo ? `${e.campo}: ${e.error}` : e.error))
      .join('; ');
  }
  if (datos && typeof datos === 'object') {
    return datos.message || datos.mensaje || datos.error || '';
  }
  return '';
};

/**
 * Procesa una respuesta de error HTTP y lanza un Error con:
 *  - message: el mensaje del servidor si trae uno, si no el mensaje por defecto
 *  - estado: el código HTTP (409 permite detectar duplicados en el frontend)
 *  - cuerpo: el cuerpo parseado (array de {campo, error} del 400, para errores inline)
 */
export const lanzarErrorDeRespuesta = async (response, mensajePorDefecto) => {
  let datos = null;
  try {
    const texto = await response.text();
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch {
        // El backend devuelve texto plano (p. ej. los mensajes de ValidacionException)
        datos = texto;
      }
    }
  } catch {
    // Respuesta sin cuerpo legible: se usa el mensaje por defecto
  }
  const mensajeServidor = extraerMensajeDeError(datos);
  const error = new Error(mensajeServidor || mensajePorDefecto);
  error.estado = response.status;
  error.cuerpo = datos;
  throw error;
};

export const fetchWithAuth = async (input, init = {}) => {
  const metodo = (init.method || 'GET').toUpperCase();

  // RF-9: con la conexión perdida se bloquean las operaciones de escritura
  if (conexionPerdida && esOperacionEscritura(metodo)) {
    throw new Error('Sin conexión: no se pueden realizar operaciones de escritura');
  }

  // Get token
  const token = authService.getToken();

  // Clone init headers to avoid mutating original
  const headers = new Headers(init.headers || {});

  // Set authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure content-type header for POST/PUT/PATCH if body is present and not FormData
  if (init.body && !(init.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  // RF-9: timeout de 5 s por petición mediante AbortController
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(input, { ...init, headers, signal: controlador.signal });
  } catch {
    registrarFallo();
    throw new Error('Error de conexión: no se pudo contactar con el servidor');
  } finally {
    clearTimeout(temporizador);
  }

  // El servidor respondió: la conexión vuelve a considerarse estable
  registrarExito();

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Logout and redirect to login. SE USA UN EVENTO PARA QUE LA APP REDIRIJA SIN
    // RECARGAR LA PAGINA (window.location NO ESTA DISPONIBLE EN LOS TESTS DE NODE)
    authService.logout();
    if (typeof globalThis.dispatchEvent === 'function') {
      globalThis.dispatchEvent(new Event('vollmed:sesion-expirada'));
    }
    throw new Error('Unauthorized: Session expired');
  }

  return response;
};
