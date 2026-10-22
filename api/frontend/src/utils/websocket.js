import { authService } from '../services/authService.js';
import { fetchWithAuth } from './api.js';

// CLIENTE WEBSOCKET PARA LOS AVISOS EN TIEMPO REAL DEL BACKEND (RF-7/RNF-3).
// EL BACKEND DIFUNDE {"tipo":"CONSULTA_CREADA"} Y {"tipo":"CONSULTA_CANCELADA"}
// POR /ws; LOS COMPONENTES SE SUSCRIBEN Y SE REFRESCAN AL RECIBIR CUALQUIER EVENTO.
// EL JWT NO VIAJA EN LA URL: SE PIDE UN TICKET EFIMERO A /api/ws/ticket Y SE USA
// UNA SOLA VEZ EN EL HANDSHAKE DEL WEBSOCKET.
let socket = null;
let temporizadorReconexion = null;
let conexionEnCurso = null;
const suscriptores = new Set();

export const estaConectado = () => Boolean(socket && socket.readyState === 1);

/**
 * Suscribe un callback a los eventos que difunda el backend.
 * @param {Function} callback - Recibe el evento parseado (o null si no era JSON)
 * @returns {Function} Funcion para cancelar la suscripcion
 */
export const suscribirActualizaciones = (callback) => {
  suscriptores.add(callback);
  return () => {
    suscriptores.delete(callback);
  };
};

const notificarSuscriptores = (evento) => {
  suscriptores.forEach((callback) => {
    try {
      callback(evento);
    } catch {
      // UN SUSCRIPTOR QUE FALLA NO DEBE ROMPER A LOS DEMAS
    }
  });
};

const programarReconexion = () => {
  if (temporizadorReconexion) {
    return;
  }
  temporizadorReconexion = setTimeout(() => {
    temporizadorReconexion = null;
    if (authService.getToken()) {
      conectarWebSocket();
    }
  }, 5000);
};

const abrirConexion = async () => {
  try {
    const respuesta = await fetchWithAuth('/api/ws/ticket');
    if (!respuesta.ok) {
      programarReconexion();
      return null;
    }
    const datos = await respuesta.json();
    // SI LA SESION TERMINO MIENTRAS SE PEDIA EL TICKET, NO SE ABRE NADA
    if (!authService.getToken() || !datos || !datos.ticket) {
      return null;
    }
    const protocolo = globalThis.location && String(globalThis.location.protocol) === 'https:' ? 'wss' : 'ws';
    const host = globalThis.location ? globalThis.location.host : 'localhost:5173';
    socket = new globalThis.WebSocket(
      `${protocolo}://${host}/ws?ticket=${encodeURIComponent(datos.ticket)}`
    );
    socket.onmessage = (mensaje) => {
      let evento = null;
      try {
        evento = JSON.parse(mensaje.data);
      } catch {
        // MENSAJE SIN JSON UTILIZABLE: SE NOTIFICA IGUAL PARA QUE SE REFRESQUE LA AGENDA
      }
      notificarSuscriptores(evento);
    };
    socket.onclose = () => {
      socket = null;
      programarReconexion();
    };
    socket.onerror = () => {
      try {
        socket.close();
      } catch {
        // LA CONEXION YA ESTABA CERRADA
      }
    };
    return socket;
  } catch {
    // SIN CONEXION O SIN AUTORIZACION: SE REINTENTA SOLO SI SIGUE HABIENDO TOKEN
    if (authService.getToken()) {
      programarReconexion();
    }
    return null;
  }
};

/**
 * Abre (o reutiliza) la conexion WebSocket. Si no hay token, no hace nada.
 * Si la conexion se cierra, se reintenta cada 5 segundos mientras haya sesion.
 */
export const conectarWebSocket = () => {
  const token = authService.getToken();
  if (!token) {
    return Promise.resolve(null);
  }
  // YA HAY UNA CONEXION ABIERTA O EN CURSO: NO SE ABRE OTRA
  if (socket && socket.readyState <= 1) {
    return Promise.resolve(socket);
  }
  // EVITA PEDIR DOS TICKETS SI DOS COMPONENTES CONECTAN A LA VEZ
  if (conexionEnCurso) {
    return conexionEnCurso;
  }
  conexionEnCurso = abrirConexion().finally(() => {
    conexionEnCurso = null;
  });
  return conexionEnCurso;
};

/** Cierra la conexion y cancela la reconexion automatica (al cerrar sesion). */
export const cerrarWebSocket = () => {
  if (temporizadorReconexion) {
    clearTimeout(temporizadorReconexion);
    temporizadorReconexion = null;
  }
  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    try {
      socket.close();
    } catch {
      // YA ESTABA CERRADA
    }
    socket = null;
  }
};
