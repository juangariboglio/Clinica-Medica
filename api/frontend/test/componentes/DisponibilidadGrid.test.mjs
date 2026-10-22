// TESTS DEL COMPONENTE DisponibilidadGrid (T31). CUBREN RF-5 (CUADRICULA DE
// HORARIOS), RF-10/RF-11 (TABLA RESPONSIVE) Y RF-12 (ARIA-LABEL POR FRANJA).
import '../helpers/dom.mjs';
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DisponibilidadGrid } from '../../src/components/DisponibilidadGrid.js';

describe('Componente DisponibilidadGrid', () => {
  afterEach(() => cleanup());

  it('genera las 24 franjas de 30 minutos del horario de atencion (7:00-19:00)', () => {
    const { container } = render(
      React.createElement(DisponibilidadGrid, {
        disponibilidad: [{ inicio: '07:00', fin: '19:00' }],
        onSelectSlot: () => {}
      })
    );
    assert.strictEqual(container.querySelectorAll('tbody tr').length, 24);
    assert.ok(screen.getByText('07:00 - 07:30'), 'la primera franja es 07:00 - 07:30');
    assert.ok(screen.getByText('18:30 - 19:00'), 'la ultima franja es 18:30 - 19:00');
  });

  it('habilita solo las franjas dentro de la disponibilidad recibida (RF-5)', () => {
    const { container } = render(
      React.createElement(DisponibilidadGrid, {
        disponibilidad: [{ inicio: '08:00', fin: '09:00' }],
        onSelectSlot: () => {}
      })
    );
    // SOLO 08:00-08:30 Y 08:30-09:00 ESTAN LIBRES: 2 BOTONES Y 22 "No disponible"
    assert.strictEqual(container.querySelectorAll('button').length, 2);
    assert.strictEqual(container.querySelectorAll('[aria-label*="no disponible"]').length, 22);
  });

  it('anuncia por aria-label el estado y el rango de cada franja (RF-12)', () => {
    const { container } = render(
      React.createElement(DisponibilidadGrid, {
        disponibilidad: [{ inicio: '07:00', fin: '08:00' }],
        onSelectSlot: () => {}
      })
    );
    assert.ok(
      container.querySelector('[aria-label="Seleccionar horario de 07:00 a 07:30, disponible"]'),
      'la franja libre se anuncia como disponible'
    );
    assert.ok(
      container.querySelector('[aria-label="Horario de 08:00 a 08:30, no disponible"]'),
      'la franja ocupada se anuncia como no disponible'
    );
  });

  it('selecciona la franja al pulsarla (RF-5/RF-6)', () => {
    const selecciones = [];
    render(
      React.createElement(DisponibilidadGrid, {
        disponibilidad: [{ inicio: '07:00', fin: '19:00' }],
        onSelectSlot: (slot) => selecciones.push(slot)
      })
    );

    fireEvent.click(screen.getByLabelText('Seleccionar horario de 07:00 a 07:30, disponible'));

    assert.deepStrictEqual(selecciones, [{ inicio: '07:00', fin: '07:30' }]);
  });
});
