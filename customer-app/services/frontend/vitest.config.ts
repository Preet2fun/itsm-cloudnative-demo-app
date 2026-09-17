import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Standalone rather than merged from vite.config.ts: that file's default
// export is a function (env-dependent dev proxy), and mergeConfig needs a
// resolved config object. Keep resolve.alias in sync with vite.config.ts by
// hand if it ever changes.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': decodeURIComponent(new URL('./src', import.meta.url).pathname),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
  },
})
