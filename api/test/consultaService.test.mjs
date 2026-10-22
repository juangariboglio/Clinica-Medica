import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('consultaService module', () => {
  it('should export getDisponibilidad function', async () => {
    const module = await import('../frontend/src/services/consultaService.js');
    assert.strictEqual(typeof module.getDisponibilidad, 'function');
  });

  it('should export create function', async () => {
    const module = await import('../frontend/src/services/consultaService.js');
    assert.strictEqual(typeof module.create, 'function');
  });

  it('should export getByFechaMedico function', async () => {
    const module = await import('../frontend/src/services/consultaService.js');
    assert.strictEqual(typeof module.getByFechaMedico, 'function');
  });

  it('should export updateEstado function', async () => {
    const module = await import('../frontend/src/services/consultaService.js');
    assert.strictEqual(typeof module.updateEstado, 'function');
  });

  it('should export getById function', async () => {
    const module = await import('../frontend/src/services/consultaService.js');
    assert.strictEqual(typeof module.getById, 'function');
  });
});