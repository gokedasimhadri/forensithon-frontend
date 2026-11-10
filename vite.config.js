import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_URL;

  return {
    plugins: [react()],
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
        }
      }
    },

    preview: {
      allowedHosts: [
        'events.adityauniversity.in/forensithon', 'https://events.adityauniversity.in/forensithon', 'www.events.adityauniversity.in/forensithon'
      ]
    },
  }
})
