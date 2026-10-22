const { describe, it } = require('node:test');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert');

describe('Frontend folder structure', () => {
  it('should create the basic folder structure under frontend/src', () => {
    const frontendSrcDir = join(process.cwd(), 'frontend', 'src');
    const requiredFolders = [
      'components',
      'services',
      'utils',
      'hooks',
      'store',
      'styles',
      'assets'
    ];
    for (const folder of requiredFolders) {
      const folderPath = join(frontendSrcDir, folder);
      assert.strictEqual(existsSync(folderPath), true, `Folder ${folder} should exist in frontend/src`);
    }
  });
});