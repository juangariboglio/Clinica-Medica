import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('medicoService module', () => {
  it('should export getAll function', async () => {
    const module = await import('../frontend/src/services/medicoService.js');
    assert.strictEqual(typeof module.getAll, 'function');
  });

  it('should export getById function', async () => {
    const module = await import('../frontend/src/services/medicoService.js');
    assert.strictEqual(typeof module.getById, 'function');
  });
});