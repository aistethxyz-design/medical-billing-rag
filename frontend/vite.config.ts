import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { writeFileSync, readFileSync } from 'fs'

// Custom plugin to create 404.html for Cloudflare Pages SPA routing
const cloudflareSpaPatch = () => ({
  name: 'cloudflare-spa-patch',
  closeBundle() {
    // Copy index.html to 404.html for SPA fallback on Cloudflare Pages
    const indexPath = path.resolve(__dirname, 'dist/index.html')
    const notFoundPath = path.resolve(__dirname, 'dist/404.html')
    try {
      const indexContent = readFileSync(indexPath, 'utf-8')
      writeFileSync(notFoundPath, indexContent)
      console.log('✓ Created 404.html for Cloudflare Pages SPA routing')
    } catch (e) {
      console.warn('Could not create 404.html:', e)
    }
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    cloudflareSpaPatch()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflareSpaPatch()],
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}) 