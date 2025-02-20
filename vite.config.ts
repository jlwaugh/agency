import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./",
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001", // Redirect API calls to backend
    },
  },
});