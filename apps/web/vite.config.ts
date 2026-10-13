import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
      // Live updates: a WebSocket, so the proxy must pass upgrades through (ws)
      "/socket.io": { target: "http://localhost:4000", ws: true },
    },
  },
});
