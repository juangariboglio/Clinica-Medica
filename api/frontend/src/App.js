import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Footer from './components/Footer.js';
import PrivateRoute from './components/PrivateRoute.js';
import Login from './components/Login.js';
import Home from './components/Home.js';
import PacienteList from './components/PacienteList.js';
import PacienteForm from './components/PacienteForm.js';
import MedicoList from './components/MedicoList.js';
import MedicoForm from './components/MedicoForm.js';
import ConsultaList from './components/ConsultaList.js';
import ConsultaForm from './components/ConsultaForm.js';
import { authService } from './services/authService.js';
import { setupAutoLogout } from './utils/autoLogout.js';
import { cerrarWebSocket, conectarWebSocket } from './utils/websocket.js';

// ENVOLTORIO INTERNO QUE PUEDE USAR useNavigate (Router ya instalado)
const AutoLogout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // CASO LIMITE: SESION INACTIVA 30 MINUTOS -> CIERRE AUTOMATICO Y AL LOGIN
    const control = setupAutoLogout(() => {
      authService.logout();
      cerrarWebSocket();
      navigate('/login', { replace: true });
    });
    return () => control.stop();
  }, [navigate]);
  return null;
};

// LEE EL :id DE LA URL (useParams DE REACT-ROUTER, NO DE REACT) Y SE LO PASA AL FORMULARIO DE EDICION
const PacienteFormConId = () => {
  const { id } = useParams();
  return React.createElement(PrivateRoute, null,
    React.createElement(PacienteForm, { pacienteId: id, key: id })
  );
};

const MedicoFormConId = () => {
  const { id } = useParams();
  return React.createElement(PrivateRoute, null,
    React.createElement(MedicoForm, { medicoId: id, key: id })
  );
};

const Rutas = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const quitarListener = () => {
      // EL 401 YA HIZO logout EN fetchWithAuth; SOLO QUEDA REDIRIGIR AL LOGIN
      cerrarWebSocket();
      navigate('/login', { replace: true });
    };
    window.addEventListener('vollmed:sesion-expirada', quitarListener);
    return () => window.removeEventListener('vollmed:sesion-expirada', quitarListener);
  }, [navigate]);
  return React.createElement(React.Fragment, null,
    React.createElement(AutoLogout, null),
    React.createElement('div', { className: 'app-layout' },
      React.createElement(Header, null),
      React.createElement('div', { className: 'app-cuerpo' },
        React.createElement(Sidebar, null),
        React.createElement('main', { id: 'contenido-principal', className: 'app-contenido' },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/login', element: React.createElement(Login, null) }),
            React.createElement(Route, { path: '/', element: React.createElement(PrivateRoute, null, React.createElement(Home, null)) }),
            React.createElement(Route, { path: '/pacientes', element: React.createElement(PrivateRoute, null, React.createElement(PacienteList, null)) }),
            React.createElement(Route, { path: '/pacientes/nuevo', element: React.createElement(PrivateRoute, null, React.createElement(PacienteForm, { key: 'nuevo' })) }),
            React.createElement(Route, { path: '/pacientes/:id/editar', element: React.createElement(PacienteFormConId, null) }),
            React.createElement(Route, { path: '/medicos', element: React.createElement(PrivateRoute, null, React.createElement(MedicoList, null)) }),
            React.createElement(Route, { path: '/medicos/nuevo', element: React.createElement(PrivateRoute, null, React.createElement(MedicoForm, { key: 'nuevo' })) }),
            React.createElement(Route, { path: '/medicos/:id/editar', element: React.createElement(MedicoFormConId, null) }),
            React.createElement(Route, { path: '/consultas', element: React.createElement(PrivateRoute, null, React.createElement(ConsultaList, null)) }),
            React.createElement(Route, { path: '/consultas/nueva', element: React.createElement(PrivateRoute, null, React.createElement(ConsultaForm, null)) }),
            React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/', replace: true }) })
          )
        )
      ),
      React.createElement(Footer, null)
    )
  );
};

// AL CARGAR LA APP: SI HAY SESION GUARDADA, SE CONECTA EL WEBSOCKET DE AVISOS
export const App = () => {
  useEffect(() => {
    if (authService.getToken()) {
      conectarWebSocket();
    }
  }, []);
  return React.createElement(BrowserRouter, null, React.createElement(Rutas, null));
};

export default App;
