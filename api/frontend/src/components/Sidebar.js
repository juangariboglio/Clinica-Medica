import React from 'react';
import { NavLink } from 'react-router-dom';

// NAVEGACION LATERAL CON LAS RUTAS REALES DE LA APLICACION. NavLink MARCA LA
// RUTA ACTIVA CON aria-current PARA LECTORES DE PANTALLA (RF-12).
export const Sidebar = () => {
  const enlaces = [
    { to: '/', texto: 'Inicio' },
    { to: '/pacientes', texto: 'Pacientes' },
    { to: '/medicos', texto: 'Médicos' },
    { to: '/consultas', texto: 'Agenda' },
    { to: '/consultas/nueva', texto: 'Nueva consulta' }
  ];
  return React.createElement('aside', { className: 'sidebar' },
    React.createElement('nav', { 'aria-label': 'Navegación principal' },
      React.createElement('ul', null,
        enlaces.map((enlace) =>
          React.createElement('li', { key: enlace.to },
            React.createElement(NavLink, {
              to: enlace.to,
              end: enlace.to === '/',
              className: ({ isActive }) => isActive ? 'nav-link nav-link-activo' : 'nav-link'
            }, enlace.texto)
          )
        )
      )
    )
  );
};

export default Sidebar;
