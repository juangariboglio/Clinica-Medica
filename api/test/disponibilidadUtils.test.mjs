import { describe, it } from 'node:test';
import assert from 'node:assert';

// LUNES 2026-11-02 Y DOMINGO 2026-11-01 (FECHAS FIJAS PARA LOS CALCULOS)
const lunes = new Date(2026, 10, 2, 12, 0);
const domingo = new Date(2026, 10, 1, 12, 0);
const sabado = new Date(2026, 10, 7, 12, 0);

describe('disponibilidadUtils module', () => {
  it('should export calcularHorariosDisponibles function', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    assert.strictEqual(typeof module.calcularHorariosDisponibles, 'function');
  });
});

describe('RF-5: cálculo de horarios (horario de la clínica 7:00–19:00, L–S)', () => {
  it('sin consultas ocupadas, el día completo queda libre (7:00 a 19:00)', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    assert.deepStrictEqual(module.calcularHorariosDisponibles([], lunes), [
      { inicio: '07:00', fin: '19:00' }
    ]);
  });

  it('los domingos la clínica está cerrada', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    assert.deepStrictEqual(module.calcularHorariosDisponibles([], domingo), []);
  });

  it('los sábados la clínica abre (alineado con el backend, antes se cerraba)', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    assert.deepStrictEqual(module.calcularHorariosDisponibles([], sabado), [
      { inicio: '07:00', fin: '19:00' }
    ]);
  });

  it('calcula los huecos alrededor de las consultas ocupadas', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    const ocupadas = [
      { inicio: '09:00', fin: '09:30' },
      { inicio: '09:30', fin: '10:00' }
    ];
    assert.deepStrictEqual(module.calcularHorariosDisponibles(ocupadas, lunes), [
      { inicio: '07:00', fin: '09:00' },
      { inicio: '10:00', fin: '19:00' }
    ]);
  });

  it('fusiona huecos adyacentes y descarta slots fuera del horario', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    // UNA CONSULTA FUERA DEL HORARIO (22:00) NO AFECTA LA DISPONIBILIDAD
    const ocupadas = [
      { inicio: '06:00', fin: '06:30' },
      { inicio: '22:00', fin: '22:30' }
    ];
    assert.deepStrictEqual(module.calcularHorariosDisponibles(ocupadas, lunes), [
      { inicio: '07:00', fin: '19:00' }
    ]);
  });

  it('con el médico totalmente ocupado no quedan huecos', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    const ocupadas = [{ inicio: '07:00', fin: '19:00' }];
    assert.deepStrictEqual(module.calcularHorariosDisponibles(ocupadas, lunes), []);
  });

  it('fecha inválida devuelve lista vacía (no rompe la UI)', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    assert.deepStrictEqual(module.calcularHorariosDisponibles([], 'no-fecha'), []);
    assert.deepStrictEqual(module.calcularHorariosDisponibles([], null), []);
  });
});

describe('filtrarHorariosPasados: no se ofrecen franjas ya pasadas (caso límite fecha futura)', () => {
  it('para una fecha futura se devuelven todos los horarios', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    const libres = [{ inicio: '07:00', fin: '19:00' }];
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 7);
    assert.deepStrictEqual(module.filtrarHorariosPasados(libres, futuro), libres);
  });

  it('para hoy se eliminan las franjas sin anticipación suficiente', async () => {
    const module = await import('../frontend/src/utils/disponibilidadUtils.js');
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const formatear = (minutos) =>
      `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
    // UNA FRANJA QUE EMPIEZA 10 MIN ADELANTE (SIN LOS 30 DE ANTICIPACION) Y OTRA
    // QUE EMPIEZA DENTRO DE 2 HORAS (VALIDA)
    const franjaSinAnticipacion = { inicio: formatear(horaActual + 10), fin: formatear(horaActual + 40) };
    const franjaValida = { inicio: formatear(horaActual + 120), fin: formatear(horaActual + 150) };
    const libres = [franjaSinAnticipacion, franjaValida];
    const resultado = module.filtrarHorariosPasados(libres, new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()), 30);
    // SI LA FRANJA SIN ANTICIPACION CAE EN OTRO DIA (CRUCE DE MEDIANOCHE), SOLO SE
    // COMPRUEBA QUE LA FRANJA VALIDA SE CONSERVA SIEMPRE
    assert.ok(
      resultado.some((slot) => slot.inicio === franjaValida.inicio),
      'la franja con anticipación suficiente debe conservarse'
    );
    assert.ok(
      !resultado.some((slot) => slot.inicio === franjaSinAnticipacion.inicio && franjaSinAnticipacion.inicio > '00:30'),
      'la franja sin anticipación debe eliminarse (salvo cruce de medianoche)'
    );
  });
});
