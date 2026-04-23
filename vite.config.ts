import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import path from "path";

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const proxy = {
    '/api/recipes-search': {
      target: 'http://127.0.0.1:3001',
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path.replace(/^\/api\/recipes-search/, '/recipes-search'),
    },
    '/api/recipes-asset': {
      target: 'http://127.0.0.1:3001',
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path.replace(/^\/api\/recipes-asset/, '/recipes-asset'),
    },
    '/api': {
      target: env.VITE_MEALIE_URL,
      changeOrigin: true,
      secure: false,
    },
  }

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "presentation": path.resolve(__dirname, "./src/presentation"),
        "components": path.resolve(__dirname, "./src/presentation/components"),
        "hooks": path.resolve(__dirname, "./src/presentation/hooks"),
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    base: '/',
    server: {
      proxy,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (
              id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('rehype-') ||
              id.includes('micromark') ||
              id.includes('mdast-') ||
              id.includes('hast-') ||
              id.includes('unist-')
            ) {
              return 'markdown-vendor'
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'react-vendor'
            }

            return undefined
          },
        },
      },
    },
  }
})
