import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// As telas chamam /api e o Vite repassa para a API. Assim, telas e API ficam na mesma origem
// e o cookie de sessão funciona sem configurar CORS. Em produção, o servidor faz o mesmo papel.
const apiProxy = {
  "/api": {
    target: process.env.API_PROXY_TARGET ?? "http://localhost:3333",
    rewrite: (path: string) => path.replace(/^\/api/, ""),
  },
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    /**
     * PWA: o app pode ser instalado no celular e abre em tela cheia, como um aplicativo.
     * Ele só funciona com internet. O service worker guarda apenas o "esqueleto" (HTML, JS, CSS,
     * fonte e ícones), para que, sem conexão, o app abra na tela "Sem conexão" em vez do erro do
     * navegador. Nada da API é guardado: saldos e lançamentos vêm sempre do servidor.
     */
    VitePWA({
      // A versão nova é baixada em segundo plano e vale na próxima abertura do app, sem recarregar
      // a tela no meio de uma venda.
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png", "pwa-icon.svg"],
      manifest: {
        name: "Cantina",
        short_name: "Cantina",
        description: "Vendas no fiado, recebimentos e contas dos clientes da cantina.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f7f8fa",
        theme_color: "#ffffff",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Qualquer tela do app abre o index.html guardado; as chamadas à API ficam de fora.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { proxy: apiProxy },
  // O preview serve o build final, onde o service worker funciona; usa o mesmo repasse da API.
  preview: { proxy: apiProxy },
})
