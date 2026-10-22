import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('useAuth hook', () => {
  it('should export a function as the default export', async () => {
    const module = await import('../frontend/src/hooks/useAuth.js');
    const useAuth = module.default;
    assert.strictEqual(typeof useAuth, 'function');
    assert.strictEqual(useAuth.name, 'useAuth');
  });

  it('should have a named export useAuth which is a function', async () => {
    const module = await import('../frontend/src/hooks/useAuth.js');
    assert.strictEqual(typeof module.useAuth, 'function');
  });
});