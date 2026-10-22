import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Global styles', () => {
  it('should exist globals.css file', async () => {
    try {
      const cssPath = join(__dirname, '..', 'frontend', 'src', 'globals.css');
      const content = readFileSync(cssPath, 'utf8');
      assert.strictEqual(typeof content, 'string');
    } catch (err) {
      throw new Error('globals.css file not found or cannot be read');
    }
  });

  it('should contain CSS variables for theme', async () => {
    const cssPath = join(__dirname, '..', 'frontend', 'src', 'globals.css');
    const content = readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('--primary-color') || content.includes(':root'), 'Should contain CSS variables or :root selector');
  });
});