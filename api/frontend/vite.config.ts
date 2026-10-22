import { defineConfig } from 'vite'

// PROXY DE DESARROLLO: EL FRONTEND CORRE EN 5173 Y LA API SPRING BOOT EN 8080.
// /api/xxx SE REENVIA A http://localhost:8080/xxx (SE QUITA EL PREFIJO /api), Y
// /ws SE PROXYA CON SOPORTE DE WEBSOCKET PARA LOS AVISOS EN TIEMPO REAL.
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
})
