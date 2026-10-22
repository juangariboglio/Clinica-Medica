import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Global error handling', () => {
  it('should export a toast function for showing error messages', async () => {
    const module = await import('../frontend/src/utils/toast.js');
    assert.strictEqual(typeof module.toastError, 'function');
  });
});