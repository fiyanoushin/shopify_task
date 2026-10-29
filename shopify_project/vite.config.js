import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/product-api": {
        target: "https://b2cqa.bufferbytes.in",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/product-api/, ""),
      },
    },
  },
});

