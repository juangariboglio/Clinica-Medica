import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// PANTALLA DE INICIO DE SESION (RF-1). AL AUTENTICARSE CORRECTAMENTE SE GUARDA EL
// TOKEN Y SE VUELVE A LA PAGINA QUE SE PEDIA ANTES DEL LOGIN (state.desde).
export const Login = () => {
  const [login, setLogin] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login: iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!login.trim() || !clave) {
      setError('Debe completar el usuario y la contraseña');
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion({ login: login.trim(), clave });
      const destino = location.state && location.state.desde ? location.state.desde : '/';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return React.createElement('main', { className: 'login-container' },
    React.createElement('div', { className: 'login-card' },
      React.createElement('h2', null, 'Iniciar sesión'),
      React.createElement('p', { className: 'login-subtitulo' }, 'Acceda con su usuario de Vollmed'),
      React.createElement('form', { onSubmit: handleSubmit, noValidate: true },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'login' }, 'Usuario:'),
          React.createElement('input', {
            id: 'login',
            type: 'text',
            className: 'input',
            value: login,
            onChange: (e) => setLogin(e.target.value),
            autoComplete: 'username',
            required: true,
            'aria-required': true,
            'aria-invalid': Boolean(error),
            'aria-describedby': error ? 'login-error' : undefined
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'clave' }, 'Contraseña:'),
          React.createElement('input', {
            id: 'clave',
            type: 'password',
            className: 'input',
            value: clave,
            onChange: (e) => setClave(e.target.value),
            autoComplete: 'current-password',
            required: true,
            'aria-required': true,
            'aria-invalid': Boolean(error),
            'aria-describedby': error ? 'login-error' : undefined
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('button', {
            type: 'submit',
            className: 'button',
            disabled: cargando,
            'aria-label': 'Iniciar sesión'
          }, cargando ? 'Ingresando...' : 'Entrar')
        ),
        error
          ? React.createElement('p', {
              id: 'login-error',
              className: 'error',
              role: 'alert',
              'aria-live': 'polite'
            }, error)
          : null
      )
    )
  );
};

export default Login;
