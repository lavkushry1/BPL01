import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isAnalyze = mode === 'analyze';
  const isCdn = mode === 'cdn';
  
  // CDN base URL from environment variable
  const cdnUrl = env.VITE_CDN_URL || 'https://cdn.eventia.app';
  
  return {
    plugins: [
      react(),
      isAnalyze && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Enable source maps for production build when not in CDN mode
      sourcemap: !isCdn,
      // Optimize for CDN deployment
      ...(isCdn && {
        // Generate separate chunks for better caching
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor chunks
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-ui': [
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
              'vendor-charts': ['recharts'],
              'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
              'vendor-utils': ['date-fns', 'axios', 'i18next', 'zustand'],
            },
            // Use content hashing for better caching
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]',
          },
        },
        // Minify for production
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        // Reduce chunk size warnings threshold
        chunkSizeWarningLimit: 1000,
      }),
    },
    // Configure base URL for CDN deployment
    base: isCdn ? cdnUrl : '/',
    // Configure server for development
    server: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    // Configure preview server
    preview: {
      port: 3000,
      strictPort: true,
      host: true,
    },
  };
});