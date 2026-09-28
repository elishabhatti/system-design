import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:3001", // backend ka wahi port jo tum chala rahe ho
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            if (err.code === "ECONNRESET" || err.code === "EPIPE") return; // restart par normal
            console.error("[proxy error]", err);
          });
        },
      },
    },
  },
});