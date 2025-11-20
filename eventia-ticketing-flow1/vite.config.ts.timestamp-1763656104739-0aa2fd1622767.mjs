// vite.config.ts
import react from "file:///Users/lavkushkumar/Desktop/BPL1/eventia-ticketing-flow1/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { componentTagger } from "file:///Users/lavkushkumar/Desktop/BPL1/eventia-ticketing-flow1/node_modules/lovable-tagger/dist/index.js";
import path from "path";
import { visualizer } from "file:///Users/lavkushkumar/Desktop/BPL1/eventia-ticketing-flow1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { defineConfig } from "file:///Users/lavkushkumar/Desktop/BPL1/eventia-ticketing-flow1/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/Users/lavkushkumar/Desktop/BPL1/eventia-ticketing-flow1";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/v1/events": {
        target: "http://localhost:4000",
        changeOrigin: true
      },
      "/api/v1": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "analyze" && visualizer({
      open: true,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    sourcemap: mode !== "production",
    minify: mode === "production",
    rollupOptions: {
      output: {
        // Use content hashing for better cache management
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        // Configure code splitting for better performance
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query"
          ],
          ui: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip"
          ],
          utils: [
            "date-fns",
            "clsx",
            "class-variance-authority",
            "tailwind-merge"
          ]
        }
      }
    },
    target: "es2018",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // Add cache-busting for index.html
    emptyOutDir: true,
    copyPublicDir: true,
    // Add build time metadata to index.html for cache busting
    html: {
      inject: {
        data: {
          buildTime: (/* @__PURE__ */ new Date()).toISOString(),
          version: process.env.VITE_APP_VERSION || "1.0.0",
          buildId: process.env.VITE_RELEASE_ID || (/* @__PURE__ */ new Date()).getTime().toString()
        }
      },
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true
      }
    },
    // Improve compression
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production"
      }
    }
  },
  // Add preview config for testing production builds locally
  preview: {
    port: 4173,
    host: true
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGF2a3VzaGt1bWFyL0Rlc2t0b3AvQlBMMS9ldmVudGlhLXRpY2tldGluZy1mbG93MVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2xhdmt1c2hrdW1hci9EZXNrdG9wL0JQTDEvZXZlbnRpYS10aWNrZXRpbmctZmxvdzEvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xhdmt1c2hrdW1hci9EZXNrdG9wL0JQTDEvZXZlbnRpYS10aWNrZXRpbmctZmxvdzEvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGkvdjEvZXZlbnRzJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjQwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgICAgJy9hcGkvdjEnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBtb2RlID09PSAnYW5hbHl6ZScgJiYgdmlzdWFsaXplcih7XG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxuICAgIH0pLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogbW9kZSAhPT0gJ3Byb2R1Y3Rpb24nLFxuICAgIG1pbmlmeTogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBVc2UgY29udGVudCBoYXNoaW5nIGZvciBiZXR0ZXIgY2FjaGUgbWFuYWdlbWVudFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLltoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5baGFzaF0uW2V4dF0nLFxuICAgICAgICAvLyBDb25maWd1cmUgY29kZSBzcGxpdHRpbmcgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFtcbiAgICAgICAgICAgICdyZWFjdCcsXG4gICAgICAgICAgICAncmVhY3QtZG9tJyxcbiAgICAgICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdWk6IFtcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYXZhdGFyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtbGFiZWwnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtcHJvZ3Jlc3MnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zY3JvbGwtYXJlYScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlcGFyYXRvcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsaWRlcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zd2l0Y2gnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10YWJzJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2dnbGUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2dnbGUtZ3JvdXAnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHV0aWxzOiBbXG4gICAgICAgICAgICAnZGF0ZS1mbnMnLFxuICAgICAgICAgICAgJ2Nsc3gnLFxuICAgICAgICAgICAgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eScsXG4gICAgICAgICAgICAndGFpbHdpbmQtbWVyZ2UnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgdGFyZ2V0OiAnZXMyMDE4JyxcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsXG4gICAgLy8gQWRkIGNhY2hlLWJ1c3RpbmcgZm9yIGluZGV4Lmh0bWxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBjb3B5UHVibGljRGlyOiB0cnVlLFxuICAgIC8vIEFkZCBidWlsZCB0aW1lIG1ldGFkYXRhIHRvIGluZGV4Lmh0bWwgZm9yIGNhY2hlIGJ1c3RpbmdcbiAgICBodG1sOiB7XG4gICAgICBpbmplY3Q6IHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGJ1aWxkVGltZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIHZlcnNpb246IHByb2Nlc3MuZW52LlZJVEVfQVBQX1ZFUlNJT04gfHwgJzEuMC4wJyxcbiAgICAgICAgICBidWlsZElkOiBwcm9jZXNzLmVudi5WSVRFX1JFTEVBU0VfSUQgfHwgbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBtaW5pZnk6IHtcbiAgICAgICAgY29sbGFwc2VXaGl0ZXNwYWNlOiB0cnVlLFxuICAgICAgICByZW1vdmVDb21tZW50czogdHJ1ZSxcbiAgICAgICAgcmVtb3ZlUmVkdW5kYW50QXR0cmlidXRlczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBJbXByb3ZlIGNvbXByZXNzaW9uXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiBtb2RlID09PSAncHJvZHVjdGlvbicsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgLy8gQWRkIHByZXZpZXcgY29uZmlnIGZvciB0ZXN0aW5nIHByb2R1Y3Rpb24gYnVpbGRzIGxvY2FsbHlcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgaG9zdDogdHJ1ZSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFYsT0FBTyxXQUFXO0FBQzVXLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8sVUFBVTtBQUNqQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLG9CQUFvQjtBQUo3QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLGtCQUFrQjtBQUFBLFFBQ2hCLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsV0FBVztBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLElBQzFDLFNBQVMsYUFBYSxXQUFXO0FBQUEsTUFDL0IsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxXQUFXLFNBQVM7QUFBQSxJQUNwQixRQUFRLFNBQVM7QUFBQSxJQUNqQixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBO0FBQUEsUUFFaEIsY0FBYztBQUFBLFVBQ1osUUFBUTtBQUFBLFlBQ047QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxJQUFJO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxPQUFPO0FBQUEsWUFDTDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLG1CQUFtQjtBQUFBO0FBQUEsSUFFbkIsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBO0FBQUEsSUFFZixNQUFNO0FBQUEsTUFDSixRQUFRO0FBQUEsUUFDTixNQUFNO0FBQUEsVUFDSixZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsVUFDbEMsU0FBUyxRQUFRLElBQUksb0JBQW9CO0FBQUEsVUFDekMsU0FBUyxRQUFRLElBQUksb0JBQW1CLG9CQUFJLEtBQUssR0FBRSxRQUFRLEVBQUUsU0FBUztBQUFBLFFBQ3hFO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sb0JBQW9CO0FBQUEsUUFDcEIsZ0JBQWdCO0FBQUEsUUFDaEIsMkJBQTJCO0FBQUEsTUFDN0I7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWMsU0FBUztBQUFBLFFBQ3ZCLGVBQWUsU0FBUztBQUFBLE1BQzFCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
