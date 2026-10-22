import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('PrivateRoute component', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/components/PrivateRoute.js');
    const PrivateRoute = module.default;
    assert.strictEqual(typeof PrivateRoute, 'function');
  });

  it('should have a name PrivateRoute', async () => {
    const module = await import('../frontend/src/components/PrivateRoute.js');
    const PrivateRoute = module.default;
    assert.strictEqual(PrivateRoute.name, 'PrivateRoute');
  });
});