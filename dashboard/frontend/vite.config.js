import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le build atterrit dans backend/static/ : FastAPI sert le front en prod.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../backend/static",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // En dev, on tape le backend lance a part (uvicorn --port 8080).
    proxy: {
      "/api": "http://127.0.0.1:8080",
    },
  },
});
