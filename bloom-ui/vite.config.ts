import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, /api requests are proxied to `wrangler dev` (default port 8787).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
})
