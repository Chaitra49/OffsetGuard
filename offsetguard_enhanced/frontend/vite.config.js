import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Leaflet is loaded globally via CDN in index.html, so exclude from bundling
  build: {
    rollupOptions: {
      external: [],
    }
  },
  define: {
    // Prevent vite from trying to bundle leaflet (it's global)
    global: 'globalThis',
  }
})
