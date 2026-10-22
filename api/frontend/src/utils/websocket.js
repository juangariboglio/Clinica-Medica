import { authService } from '../services/authService.js';

// CLIENTE WEBSOCKET PARA LOS AVISOS EN TIEMPO REAL DEL BACKEND (RF-7/RNF-3).
// EL BACKEND DIFUNDE {"tipo":"CONSULTA_CREADA"} Y {"tipo":"CONSULTA_CANCELADA"}
// POR /ws; LOS COMPONENTES SE SUSCRIBEN Y SE REFRESCAN AL RECIBIR CUALQUIER EVENTO.
// LOS NAVEGADORES NO PERMITEN ENCABEZADOS EN UN WEBSOCKET, ASI QUE EL TOKEN VIAJA
// EN ?token=... Y LO VALIDA InterceptorHandshake EN EL BACKEND.
let socket = null;
let temporizadorReconexion = null;
const suscriptores = new Set();

export const estaConectado = () => Boolean(socket && socket.readyState === 1);

/**
 * Suscribe un callback a los eventos que difunda el backend.
 * @param {Function} callback - Recibe el evento parseado (o null si no era JSON)
 * @returns {Function} Función para cancelar la suscripción
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

/**
 * Abre (o reutiliza) la conexión WebSocket. Si no hay token, no hace nada.
 * Si la conexión se cierra, se reintenta cada 5 segundos mientras haya sesión.
 */
export const conectarWebSocket = () => {
  const token = authService.getToken();
  if (!token) {
    return null;
  }
  // YA HAY UNA CONEXION ABIERTA O EN CURSO: NO SE ABRE OTRA
  if (socket && socket.readyState <= 1) {
    return socket;
  }
  const protocolo = globalThis.location && String(globalThis.location.protocol) === 'https:' ? 'wss' : 'ws';
  const host = globalThis.location ? globalThis.location.host : 'localhost:5173';
  socket = new globalThis.WebSocket(
    `${protocolo}://${host}/ws?token=${encodeURIComponent(token)}`
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
};

/** Cierra la conexión y cancela la reconexión automática (al cerrar sesión). */
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
