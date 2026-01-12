import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Proxy /api/n8n/* to n8n webhooks
        // Example: /api/n8n/get-blog-data -> https://n8n.myn8napp.online/webhook/get-blog-data
        '/api/n8n': {
          target: 'https://n8n.myn8napp.online/webhook',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/n8n/, '')
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
