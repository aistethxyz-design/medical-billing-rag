import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/medical-billing-rag/chatbot/',
  server: {
    port: 3002,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 