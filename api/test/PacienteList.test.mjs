import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('PacienteList component', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/components/PacienteList.js');
    const PacienteList = module.default;
    assert.strictEqual(typeof PacienteList, 'function');
  });

  it('should have a name PacienteList', async () => {
    const module = await import('../frontend/src/components/PacienteList.js');
    const PacienteList = module.default;
    assert.strictEqual(PacienteList.name, 'PacienteList');
  });
});