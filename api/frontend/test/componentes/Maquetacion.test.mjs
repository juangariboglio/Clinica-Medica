// TESTS DE MAQUETACION A PANTALLA COMPLETA.
// EL LAYOUT NO DEBE TENER UN ANCHO MAXIMO FIJO: EN PANTALLAS GRANDES (1920 PX)
// LA CABECERA Y EL CUERPO TIENEN QUE OCUPAR TODO EL ANCHO DE LA VENTANA.
// SE CARGA EL CSS REAL EN JSDOM PARA COMPROBAR LAS REGLAS COMPUTADAS.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const CSS = fs.readFileSync(new URL('../../src/globals.css', import.meta.url), 'utf8');

// MONTA UN DOM MINIMO CON LAS CLASES DEL LAYOUT REAL Y EL CSS DE LA APLICACION
const montarLayout = () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'http://localhost:5173/'
  });
  const documento = dom.window.document;
  const estilo = documento.createElement('style');
  estilo.textContent = CSS;
  documento.head.appendChild(estilo);
  documento.body.innerHTML = `
    <div class="app-layout">
      <header class="header"><div class="header-contenido"></div></header>
      <div class="app-cuerpo">
        <aside class="sidebar"></aside>
        <main class="app-contenido"></main>
      </div>
    </div>
  `;
  return dom.window;
};

describe('Maquetacion a pantalla completa', () => {
  it('el cuerpo de la app ocupa el 100% y no tiene ancho maximo', () => {
    const ventana = montarLayout();
    const estilo = ventana.getComputedStyle(ventana.document.querySelector('.app-cuerpo'));

    assert.strictEqual(estilo.maxWidth, 'none', 'sin tope fijo de ancho');
    assert.strictEqual(estilo.width, '100%', 'ocupa todo el ancho disponible');
    assert.strictEqual(estilo.display, 'flex', 'mantiene el layout de sidebar + contenido');
  });

  it('la cabecera tampoco limita su ancho', () => {
    const ventana = montarLayout();
    const estilo = ventana.getComputedStyle(ventana.document.querySelector('.header-contenido'));

    assert.strictEqual(estilo.maxWidth, 'none');
    assert.strictEqual(estilo.width, '100%');
  });

  it('el layout cubre al menos toda la altura de la ventana', () => {
    const ventana = montarLayout();
    const estilo = ventana.getComputedStyle(ventana.document.querySelector('.app-layout'));

    assert.strictEqual(estilo.minHeight, '100vh');
  });

  it('los formularios conservan una medida de lectura comoda aunque la pantalla sea ancha', () => {
    const ventana = montarLayout();
    const formulario = ventana.document.createElement('div');
    formulario.className = 'paciente-form';
    ventana.document.body.appendChild(formulario);
    const estilo = ventana.getComputedStyle(formulario);

    assert.strictEqual(estilo.maxWidth, '760px', 'el formulario no se estira sin limite');
  });
});
