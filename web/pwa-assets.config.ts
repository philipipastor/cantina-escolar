import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config"

/**
 * Gera os ícones do PWA a partir de public/pwa-icon.svg (comando: npm run generate-pwa-assets).
 * O ícone "maskable" (Android) e o da tela inicial do iPhone ganham fundo vermelho na margem,
 * para o sistema poder recortar em círculo ou quadrado arredondado sem aparecer borda branca.
 */
export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: "#D92D3B" } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: "#D92D3B" } },
  },
  images: ["public/pwa-icon.svg"],
})
