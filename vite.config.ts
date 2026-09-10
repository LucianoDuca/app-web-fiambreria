import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-duca.png"],
      manifest: {
        name: "Fiambrería Duca · Precios",
        short_name: "Duca Precios",
        description: "Consulta de precios por escáner",
        lang: "es",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "logo-duca.png",
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        // La app (HTML/JS/CSS) se cachea para abrir sin conexión.
        // Los datos de Supabase usan "red primero": si hay internet trae lo
        // último; si no, muestra la última copia guardada.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith("supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-products",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
});
