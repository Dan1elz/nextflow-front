import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Aceitar conexões de fora do container
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Necessário para funcionar no Docker (detecta mudanças em volumes)
    },
    hmr: {
      // Configuração do HMR para funcionar através do Docker
      // Se estiver rodando em container, o HMR será relativo ao host
      clientPort: process.env.VITE_HMR_PORT
        ? parseInt(process.env.VITE_HMR_PORT)
        : 5173,
    },
  },
});
