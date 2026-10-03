import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        // "/api/auth/me" becomes "/auth/me" before reaching the API
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
