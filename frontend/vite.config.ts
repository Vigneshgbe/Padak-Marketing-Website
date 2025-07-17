// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // No longer needed if commented out below

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // mode === 'development' && componentTagger(),
  ].filter(Boolean), // .filter(Boolean) is good practice to remove false values from the array
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));