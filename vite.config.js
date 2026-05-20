import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Allow access from this hostname when developing behind a custom domain
    // (e.g. tunneling or custom local DNS). Add more hosts as needed.
    allowedHosts: ['manga.brayanalvz.xyz'],
    proxy: {
      // Proxy `/api/*` to the real Mangadex API to avoid CORS in development
      '/api': {
        target: 'https://api.mangadex.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});