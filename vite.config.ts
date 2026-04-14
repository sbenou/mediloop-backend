
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    // Add these settings to ensure proper serving of the React app
    open: true, // Opens the browser automatically
    strictPort: true, // Ensures the specified port is used
    /** SPA dev server: forward /api to Deno (default PORT 8000). Start backend separately. */
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  /** Easier on Windows: less parallel resolve work during dep pre-bundle (reduces esbuild "service was stopped"). */
  optimizeDeps: {
    holdUntilCrawlEnd: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure proper MIME types for chunks
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  }
}));
