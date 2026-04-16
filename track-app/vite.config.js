import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**']
  },
  server: { 
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true
      },
      '/graphql': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
        ws: true   // ← WebSocket subscriptions (ws://localhost:3000/graphql)
      }
    }
  },
  publicDir: 'public',
  resolve: {
    alias: {
      'track-data': path.resolve(__dirname, '../track-data'),
      'track-utils': path.resolve(__dirname, '../track-utils')
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        includePaths: [
          path.resolve(__dirname, 'node_modules'),
          path.resolve(__dirname, '../node_modules')
        ]
      }
    }
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) return 'vendor-react'
          if (
            id.includes('/@apollo/') ||
            id.includes('/graphql/') ||
            id.includes('/graphql-ws/')
          ) return 'vendor-apollo'
          if (id.includes('/leaflet/')) return 'vendor-map'
          if (
            id.includes('/i18next/') ||
            id.includes('/react-i18next/') ||
            id.includes('/react-toastify/') ||
            id.includes('/iconoir-react/')
          ) return 'vendor-ui'
          return 'vendor-misc'
        }
      }
    }
  }
})
