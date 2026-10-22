import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Layout components', () => {
  it('should export Header component as a function', async () => {
    const module = await import('../frontend/src/components/Header.js');
    const Header = module.default || module.Header;
    assert.strictEqual(typeof Header, 'function');
  });

  it('should export Sidebar component as a function', async () => {
    const module = await import('../frontend/src/components/Sidebar.js');
    const Sidebar = module.default || module.Sidebar;
    assert.strictEqual(typeof Sidebar, 'function');
  });

  it('should export Footer component as a function', async () => {
    const module = await import('../frontend/src/components/Footer.js');
    const Footer = module.default || module.Footer;
    assert.strictEqual(typeof Footer, 'function');
  });

  it('should export Home component as a function', async () => {
    const module = await import('../frontend/src/components/Home.js');
    const Home = module.default || module.Home;
    assert.strictEqual(typeof Home, 'function');
  });
});