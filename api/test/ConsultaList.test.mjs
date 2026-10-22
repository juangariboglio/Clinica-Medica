import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('ConsultaList component', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/components/ConsultaList.js');
    const ConsultaList = module.default;
    assert.strictEqual(typeof ConsultaList, 'function');
  });

  it('should have a name ConsultaList', async () => {
    const module = await import('../frontend/src/components/ConsultaList.js');
    const ConsultaList = module.default;
    assert.strictEqual(ConsultaList.name, 'ConsultaList');
  });
});