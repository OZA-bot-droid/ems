import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
<<<<<<< HEAD
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // API 주소는 .env.development 의 VITE_API_URL 로 지정 (proxy 대신 axios가 Gateway로 직접 요청)
  server: { host: '0.0.0.0' },
=======

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      proxy: env.VITE_API_URL ? { '/api': { target: env.VITE_API_URL, changeOrigin: true } } : {},
    },
  };
>>>>>>> origin/feature/Event-Service
});
