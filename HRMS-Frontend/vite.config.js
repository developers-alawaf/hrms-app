import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    server: {
      watch: {
        // Fix: CSS/file changes not auto-reloading on Windows or network drives
        usePolling: true,
        interval: 500,
      },
    },
  }
})
