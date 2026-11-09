import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // As telas chamam /api e o Vite repassa para a API. Assim, telas e API ficam na mesma origem
    // e o cookie de sessão funciona sem configurar CORS. Em produção, o servidor faz o mesmo papel.
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:3333",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
