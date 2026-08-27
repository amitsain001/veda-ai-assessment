import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    /*
     * This tells Vite that:
     *
     * @/something
     *
     * means:
     *
     * src/something
     *
     * Example:
     * @/components/ui/button
     * →
     * src/components/ui/button
     */
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
  },
});