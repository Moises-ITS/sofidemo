import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Recognition calls go to the local api server (npm run dev:api).
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
