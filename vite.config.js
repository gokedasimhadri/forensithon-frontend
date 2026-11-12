
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BACKEND_URL || env.VITE_API_URL

  return {
    plugins: [react()],

    // IMPORTANT: Production deployment path
    base: '/forensithon/',

    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(target),
      'process.env.VITE_API_URL': JSON.stringify(target)
    },

    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true
        },
        '/uploads': {
          target,
          changeOrigin: true
        },
        '/adityaapi': {
          target: 'https://info.aec.edu.in',
          changeOrigin: true,
          secure: false
        },
        '^/forensithon/adityaapi': {
          target: 'https://info.aec.edu.in',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/forensithon\/adityaapi/, '/adityaapi')
        }
      }
    },

    preview: {
      host: '127.0.0.1',
      port: 2221,
      strictPort: true,
      allowedHosts: [
        'events.adityauniversity.in'
      ],
      proxy: {
        '/api': {
          target,
          changeOrigin: true
        },
        '/adityaapi': {
          target: 'https://info.aec.edu.in',
          changeOrigin: true,
          secure: false
        },
        '^/forensithon/adityaapi': {
          target: 'https://info.aec.edu.in',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/forensithon\/adityaapi/, '/adityaapi')
        }
      }
    }
  }
})
