import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('DisponibilidadList component', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/components/DisponibilidadList.js');
    const DisponibilidadList = module.default;
    assert.strictEqual(typeof DisponibilidadList, 'function');
  });

  it('should have a name DisponibilidadList', async () => {
    const module = await import('../frontend/src/components/DisponibilidadList.js');
    const DisponibilidadList = module.default;
    assert.strictEqual(DisponibilidadList.name, 'DisponibilidadList');
  });
});