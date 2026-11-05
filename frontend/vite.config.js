import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// API 주소는 .env.development 의 VITE_API_URL 로 지정 (팀 공지: proxy 없이 axios가 Gateway로 직접 요청)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0' },
});
