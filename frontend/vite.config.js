// vite.config.js
import { defineConfig } from 'vite'
import react    from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // “whenever the front end does a GET/POST to /api/…,
      // forward it to your Express server”
      '/api': {
        target: process.env.VITE_BACKEND_URL || "http://backend:4000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
