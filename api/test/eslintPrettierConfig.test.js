const { describe, it } = require('node:test');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { execSync } = require('node:child_process');
const assert = require('node:assert');

describe('ESLint and Prettier configuration', () => {
  it('should have .eslintrc.js and .prettierrc files', () => {
    const frontendDir = join(process.cwd(), 'frontend');
    const eslintPath = join(frontendDir, '.eslintrc.js');
    const prettierPath = join(frontendDir, '.prettierrc');
    assert.strictEqual(existsSync(eslintPath), true, '.eslintrc.js should exist');
    assert.strictEqual(existsSync(prettierPath), true, '.prettierrc should exist');
  });

  it('should lint a sample JavaScript file without errors', () => {
    const frontendDir = join(process.cwd(), 'frontend');
    // Create a temporary test file with correct syntax
    const testFile = join(frontendDir, 'test.lint.js');
    const testContent = `
      // Simple valid JS
      const message = 'Hello, world!';
      console.log(message);
    `;
    // Write the test file
    require('node:fs').writeFileSync(testFile, testContent, 'utf8');
    try {
      // Run eslint on the test file
      // Use npx eslint to use locally installed eslint
      const result = execSync('npx eslint ' + testFile, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      // If eslint outputs anything on stderr, it will throw? We'll capture stdout and stderr.
      // Actually execSync will throw if the command exits with non-zero code.
      // We'll assume that if it doesn't throw, linting passed.
      // We can also check that result contains no error messages.
      // For simplicity, we just ensure no exception.
    } catch (error) {
      // If eslint exits with code 1 (linting errors), error.stdout may contain the output.
      // We'll fail the test and show the output.
      assert.fail(`ESLint found errors:\n${error.stdout}`);
    } finally {
      // Clean up the test file
      if (existsSync(testFile)) {
        require('node:fs').unlinkSync(testFile);
      }
    }
  });
});