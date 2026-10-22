import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Disponibilidad component', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/components/Disponibilidad.js');
    const Disponibilidad = module.default;
    assert.strictEqual(typeof Disponibilidad, 'function');
  });

  it('should have a name Disponibilidad', async () => {
    const module = await import('../frontend/src/components/Disponibilidad.js');
    const Disponibilidad = module.default;
    assert.strictEqual(Disponibilidad.name, 'Disponibilidad');
  });
});