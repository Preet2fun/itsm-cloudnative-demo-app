import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev-only: proxy /api to the real cluster so the dev server can hit the
  // live customer-app backend without a CORS dance. Set VITE_API_TARGET in
  // .env.local (see .env.local.example) — e.g. http://<node-ip>:30080.
  // Leave VITE_API_HOST unset for auth calls (changeOrigin already sends
  // the bare node IP as Host, which is what /api/v1/auth/* needs — see
  // phase-03-istio-ingress-guide.md's routing note); set it once a later
  // phase needs customer-app.dev.local's own VirtualService instead.
  const apiTarget = env.VITE_API_TARGET

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': decodeURIComponent(new URL('./src', import.meta.url).pathname),
      },
    },
    server: {
      port: 5174,
      host: true,
      proxy: apiTarget
        ? {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              headers: env.VITE_API_HOST ? { Host: env.VITE_API_HOST } : undefined,
            },
          }
        : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
