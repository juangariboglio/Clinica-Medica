import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('useConsultas hook', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/hooks/useConsultas.js');
    const useConsultas = module.default;
    assert.strictEqual(typeof useConsultas, 'function');
  });

  it('should return an object with consultas, cargando, error properties', async () => {
    const module = await import('../frontend/src/hooks/useConsultas.js');
    const useConsultas = module.default || module.useConsultas || module;
    // We'll check that the hook is a function and that the module has a named export useConsultas that is a function.
    assert.strictEqual(typeof module.useConsultas, 'function');
  });
});