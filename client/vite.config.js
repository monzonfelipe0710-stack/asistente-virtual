import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function apiCspOriginPlugin(apiUrl) {
  let apiOrigin = ''

  if (apiUrl) {
    try {
      apiOrigin = new URL(apiUrl).origin
    } catch {
      throw new Error('VITE_API_URL debe ser una URL absoluta válida, por ejemplo https://api.ejemplo.gob.ar')
    }
  }

  return {
    name: 'chatap-api-csp-origin',
    transformIndexHtml(html) {
      return html.replaceAll('__CHATAP_API_CSP_ORIGIN__', apiOrigin)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiCspOriginPlugin(env.VITE_API_URL),
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  }
})
