import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    {
      name: "validate-env-vars",
      apply: "build",
      enforce: "pre",
      resolveId(id) {
        if (id === "virtual-validate-env") {
          // Validate required environment variables at build time
          if (!process.env.VITE_API_URL) {
            throw new Error(
              "🔴 VITE_API_URL is required but not defined.\n" +
              "Add VITE_API_URL to your .env file (e.g., VITE_API_URL=http://localhost:5001/api)\n" +
              "Build cannot proceed without this variable."
            );
          }
          if (!process.env.VITE_SOCKET_URL) {
            throw new Error(
              "🔴 VITE_SOCKET_URL is required but not defined.\n" +
              "Add VITE_SOCKET_URL to your .env file (e.g., VITE_SOCKET_URL=http://localhost:5001)\n" +
              "Build cannot proceed without this variable."
            );
          }
          return id;
        }
      },
      load(id) {
        if (id === "virtual-validate-env") {
          return "export default {}";
        }
      }
    },
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:5001",
        ws: true,
        changeOrigin: true,
      },
    },
    hmr: {
      host: "localhost",
      port: 5173,
      protocol: "http",
    },
  },
  define: {
    // Ensure environment variables are available at build time
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL),
    __VITE_SOCKET_URL__: JSON.stringify(process.env.VITE_SOCKET_URL)
  }
});
