import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/v1/events': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode !== 'production',
    minify: mode === 'production',
    rollupOptions: {
      output: {
        // Use content hashing for better cache management
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Configure code splitting for better performance
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
          ],
          ui: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          utils: [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
          ],
        },
      },
    },
    target: 'es2018',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // Add cache-busting for index.html
    emptyOutDir: true,
    copyPublicDir: true,
    // Add build time metadata to index.html for cache busting
    html: {
      inject: {
        data: {
          buildTime: new Date().toISOString(),
          version: process.env.VITE_APP_VERSION || '1.0.0',
          buildId: process.env.VITE_RELEASE_ID || new Date().getTime().toString(),
        },
      },
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
      },
    },
    // Improve compression
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
  // Add preview config for testing production builds locally
  preview: {
    port: 4173,
    host: true,
  },
}));
