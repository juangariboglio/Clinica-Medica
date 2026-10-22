import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Auto logout functionality', () => {
  it('should export a function for setting up auto logout', async () => {
    const module = await import('../frontend/src/utils/autoLogout.js');
    assert.strictEqual(typeof module.setupAutoLogout, 'function');
  });
});