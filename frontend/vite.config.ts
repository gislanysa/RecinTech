import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // A API em Gleam roda na porta 8000 (ver server.gleam). O proxy evita CORS no dev.
    // Não usar `changeOrigin: true`: o wisp (csrf_known_header_protection) compara
    // o header Origin com o Host, e reescrever o Host causaria "Invalid origin".
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
      },
    },
  },
})
