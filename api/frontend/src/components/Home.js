import React from 'react';
import { useAuth } from '../hooks/useAuth.js';

// PAGINA PRINCIPAL TRAS EL LOGIN (RF-1). EL BACKEND SOLO TIENE UN ROL (ROLE_USER),
// ASI QUE LA PAGINA ES LA MISMA PARA TODOS Y SALUDA AL USUARIO CONECTADO.
export const Home = () => {
  const { usuario } = useAuth();
  return React.createElement('main', { className: 'home' },
    React.createElement('h2', null, `Bienvenido${usuario && usuario.login ? `, ${usuario.login}` : ''}`),
    React.createElement('p', null, 'Sistema de gestión de la clínica Vollmed.'),
    React.createElement('ul', { className: 'home-acciones' },
      React.createElement('li', null, 'Registre y edite pacientes desde la sección Pacientes.'),
      React.createElement('li', null, 'Consulte la agenda del día y cree citas desde Nueva consulta.')
    )
  );
};

export default Home;
