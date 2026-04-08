import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true
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
  optimizeDeps: {
    include: ['track-utils', 'track-data'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  esbuild: {
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  }
})
