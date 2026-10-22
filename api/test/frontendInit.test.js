const { describe, it } = require('node:test');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert');

describe('Frontend project initialization', () => {
  it('should create a frontend Vite React project', () => {
    const frontendDir = join(process.cwd(), 'frontend');
    const packageJsonExists = existsSync(join(frontendDir, 'package.json'));
    const indexHtmlExists = existsSync(join(frontendDir, 'index.html'));
    const publicDirExists = existsSync(join(frontendDir, 'public'));
    // Check for main entry point: could be .js, .jsx, .ts, .tsx
    const srcDir = join(frontendDir, 'src');
    const mainJs = existsSync(join(srcDir, 'main.js'));
    const mainJsx = existsSync(join(srcDir, 'main.jsx'));
    const mainTs = existsSync(join(srcDir, 'main.ts'));
    const mainTsx = existsSync(join(srcDir, 'main.tsx'));
    const mainExists = mainJs || mainJsx || mainTs || mainTsx;
    assert.strictEqual(packageJsonExists, true, 'frontend/package.json should exist');
    assert.strictEqual(indexHtmlExists, true, 'frontend/index.html should exist');
    assert.strictEqual(publicDirExists, true, 'frontend/public directory should exist');
    assert.strictEqual(mainExists, true, 'frontend/src should contain a main entry point (.js, .jsx, .ts, .tsx)');
  });
});