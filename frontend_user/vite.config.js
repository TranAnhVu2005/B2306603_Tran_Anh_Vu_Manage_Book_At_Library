import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      port: 3001,
      strictPort: true,
      headers: {
        "Content-Security-Policy": "default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http://localhost:3000; connect-src 'self' http://localhost:3000 https:; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Frame-Options": "DENY",
      },
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3000/",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_API_URL || "http://localhost:3000/",
          changeOrigin: true,
        },
      }
    },
    preview: { port: 4173, strictPort: true },
  }
});
