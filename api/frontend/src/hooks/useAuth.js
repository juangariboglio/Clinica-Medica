import { useState } from 'react';
import { authService } from '../services/authService.js';
import { cerrarWebSocket } from '../utils/websocket.js';

// HOOK DE AUTENTICACION. LA SESION SE DERIVA DEL TOKEN GUARDADO (UNICA FUENTE DE
// VERDAD) PARA QUE TODAS LAS INSTANCIAS DEL HOOK ESTEN DE ACUERDO Y LA PAGINA NO
// EXPULSE AL USUARIO AL RECARGAR CON UN TOKEN VALIDO (bug del useAuth original).
export const useAuth = () => {
  const [usuario, setUsuario] = useState(() => authService.obtenerUsuarioActual());

  const login = async (credenciales) => {
    await authService.login(credenciales);
    setUsuario(authService.obtenerUsuarioActual());
  };

  const logout = () => {
    cerrarWebSocket();
    authService.logout();
    setUsuario(null);
  };

  // SE CONSULTA EL TOKEN DIRECTAMENTE (NO SOLO EL ESTADO) PARA QUE EL PrivateRoute
  // NO DEPENDA DE QUE ESTA INSTANCIA DEL HOOK HAYA VISTO EL LOGIN
  const isAuthenticated = () => Boolean(authService.getToken());

  return { usuario, login, logout, isAuthenticated };
};

export default useAuth;
