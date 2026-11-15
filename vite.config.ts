import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // In development, send Detective questions to server.mjs (npm run server)
  server: { proxy: { '/api': 'http://localhost:3000' } },
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
