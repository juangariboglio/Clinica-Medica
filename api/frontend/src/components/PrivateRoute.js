import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// ENVOLTORIO DE RUTAS PRIVADAS: SI NO HAY SESION, REDIRIGE A /LOGIN PRESERVANDO
// LA URL ACTUAL (caso límite de la spec) PARA VOLVER TRAS EL LOGIN EXITOSO.
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated()) {
    return React.createElement(Navigate, { to: '/login', replace: true, state: { desde: location.pathname } });
  }
  return children;
};

export default PrivateRoute;
