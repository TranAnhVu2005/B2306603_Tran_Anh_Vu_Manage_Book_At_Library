import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL?.trim()

  // Vercel creates a static bundle: its API origin must be injected at build
  // time instead of silently falling back to a same-origin /api route.
  if (mode === 'production') {
    if (!apiUrl) {
      throw new Error('Thiếu VITE_API_URL. Hãy cấu hình URL HTTPS của backend Render trong Vercel.');
    }
    let parsedApiUrl
    try {
      parsedApiUrl = new URL(apiUrl)
    } catch {
      throw new Error('VITE_API_URL phải là URL HTTPS hợp lệ của backend Render.');
    }
    if (parsedApiUrl.protocol !== 'https:' || !parsedApiUrl.hostname || !['', '/'].includes(parsedApiUrl.pathname) || parsedApiUrl.username || parsedApiUrl.password || parsedApiUrl.search || parsedApiUrl.hash) {
      throw new Error('VITE_API_URL phải là origin HTTPS của backend, không kèm đường dẫn, thông tin đăng nhập hay query.');
    }
  }

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
          target: apiUrl || "http://localhost:3000/",
          changeOrigin: true,
        },
        "/uploads": {
          target: apiUrl || "http://localhost:3000/",
          changeOrigin: true,
        },
      }
    },
    preview: { port: 4173, strictPort: true },
  }
});
