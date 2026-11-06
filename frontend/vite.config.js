import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', proxy: { '/api': { target: process.env.VITE_GATEWAY_PROXY_TARGET || 'http://localhost:8088', changeOrigin: true, ws: true }, '/ws': { target: process.env.VITE_GATEWAY_WS_TARGET || 'ws://localhost:8088', ws: true } } },
});
