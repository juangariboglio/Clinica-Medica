import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('dateUtils module', () => {
  it('should export esFechaPasada function', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    assert.strictEqual(typeof module.esFechaPasada, 'function');
  });

  it('should export esHorarioLaboral function', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    assert.strictEqual(typeof module.esHorarioLaboral, 'function');
  });

  it('should export formatearFechaParaMostrar function', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    assert.strictEqual(typeof module.formatearFechaParaMostrar, 'function');
  });

  it('should export obtenerDiaSemanaNombre function', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    assert.strictEqual(typeof module.obtenerDiaSemanaNombre, 'function');
  });
});

describe('Casos límite de fecha y horario (alineados con el backend)', () => {
  it('esHorarioLaboral: lunes a sábado de 7:00 a 18:59 (el backend rechaza hora > 18)', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    const lunes9 = new Date(2026, 10, 2, 9, 0); // LUNES 9:00
    const lunes7 = new Date(2026, 10, 2, 7, 0); // LUNES 7:00 (APERTURA)
    const lunes6 = new Date(2026, 10, 2, 6, 30); // LUNES 6:30 (ANTES DE ABRIR)
    const lunes18 = new Date(2026, 10, 2, 18, 30); // LUNES 18:30 (ULTIMA HORA VALIDA)
    const lunes19 = new Date(2026, 10, 2, 19, 0); // LUNES 19:00 (CIERRE, INVALIDO)
    const domingo9 = new Date(2026, 10, 1, 9, 0); // DOMINGO 9:00 (CERRADO)
    const sabado9 = new Date(2026, 10, 7, 9, 0); // SABADO 9:00 (ABIERTO)
    assert.strictEqual(module.esHorarioLaboral(lunes9), true);
    assert.strictEqual(module.esHorarioLaboral(lunes7), true);
    assert.strictEqual(module.esHorarioLaboral(lunes6), false);
    assert.strictEqual(module.esHorarioLaboral(lunes18), true);
    assert.strictEqual(module.esHorarioLaboral(lunes19), false);
    assert.strictEqual(module.esHorarioLaboral(domingo9), false);
    assert.strictEqual(module.esHorarioLaboral(sabado9), true);
  });

  it('esFechaPasada: ayer es pasada, hoy y mañana no', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    assert.strictEqual(module.esFechaPasada(ayer), true);
    assert.strictEqual(module.esFechaPasada(hoy), false);
    assert.strictEqual(module.esFechaPasada(manana), false);
    // UN VALOR INVALIDO NO DEBE MARCARSE COMO PASADO (EVITA FALSOS POSITIVOS EN LA UI)
    assert.strictEqual(module.esFechaPasada('no-fecha'), false);
  });

  it('formatearFechaParaMostrar y obtenerDiaSemanaNombre', async () => {
    const module = await import('../frontend/src/utils/dateUtils.js');
    assert.strictEqual(module.formatearFechaParaMostrar(new Date(2026, 9, 5)), '05/10/2026');
    assert.strictEqual(module.obtenerDiaSemanaNombre(new Date(2026, 9, 4)), 'Domingo');
    assert.strictEqual(module.obtenerDiaSemanaNombre(new Date(2026, 9, 5)), 'Lunes');
  });
});