// PUNTO DE ENTRADA DE LA APLICACION VOLLmed: MONTA EL COMPONENTE App (ROUTER,
// LAYOUT Y RUTAS) EN #app. ANTES ESTE ARCHIVO ERA LA PLANTILLA POR DEFECTO DE VITE.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './globals.css';

const contenedor = document.getElementById('app');
if (!contenedor) {
  throw new Error('No se encontró el elemento #app en index.html');
}

createRoot(contenedor).render(React.createElement(App));
