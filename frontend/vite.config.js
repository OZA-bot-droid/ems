import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // API 주소는 .env.development 의 VITE_API_URL 로 지정 (proxy 대신 axios가 Gateway로 직접 요청)
  server: { host: '0.0.0.0' },
});
