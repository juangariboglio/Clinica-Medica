import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// CABECERA CON EL NOMBRE DE LA CLINICA, EL USUARIO ACTUAL Y EL BOTON DE CERRAR
// SESION (RF-13): ELIMINA EL TOKEN, CIERRA EL WEBSOCKET Y REDIRIGE AL LOGIN.
export const Header = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return React.createElement('header', { className: 'header' },
    React.createElement('div', { className: 'header-contenido' },
      React.createElement('h1', null, 'Vollmed'),
      React.createElement('div', { className: 'header-acciones' },
        usuario && usuario.login
          ? React.createElement('span', {
              className: 'user-role',
              'aria-label': `Usuario conectado: ${usuario.login}`
            }, `${usuario.login}`)
          : null,
        React.createElement('button', {
          type: 'button',
          className: 'button button-secundario',
          onClick: handleLogout,
          'aria-label': 'Cerrar sesión'
        }, 'Cerrar sesión')
      )
    )
  );
};

export default Header;
