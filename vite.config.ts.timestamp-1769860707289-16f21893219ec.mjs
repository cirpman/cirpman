// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/hp/Desktop/cirpman-homes-fixed/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/hp/Desktop/cirpman-homes-fixed/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/hp/Desktop/cirpman-homes-fixed/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\hp\\Desktop\\cirpman-homes-fixed";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // This makes the base URL available in the app: import.meta.env.BASE_URL
    base: "/",
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      open: true,
      // Automatically open the app in the browser
      hmr: {
        overlay: true
        // Show error overlays in the browser
      }
    },
    plugins: [
      react({
        // Enable React Refresh
        jsxImportSource: "@emotion/react",
        // Add this for better error handling in development
        devTools: mode === "development"
      }),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    // Better build configuration
    build: {
      sourcemap: mode === "development",
      minify: mode === "production" ? "esbuild" : false,
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            vendor: ["@tanstack/react-query", "axios"]
          }
        }
      }
    },
    // Environment variables
    define: {
      "process.env": { ...env, NODE_ENV: mode }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEZXNrdG9wXFxcXGNpcnBtYW4taG9tZXMtZml4ZWRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERlc2t0b3BcXFxcY2lycG1hbi1ob21lcy1maXhlZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRGVza3RvcC9jaXJwbWFuLWhvbWVzLWZpeGVkL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSAnbG92YWJsZS10YWdnZXInO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIC8vIExvYWQgZW52IGZpbGUgYmFzZWQgb24gYG1vZGVgIGluIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlxyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICAvLyBUaGlzIG1ha2VzIHRoZSBiYXNlIFVSTCBhdmFpbGFibGUgaW4gdGhlIGFwcDogaW1wb3J0Lm1ldGEuZW52LkJBU0VfVVJMXHJcbiAgICBiYXNlOiAnLycsXHJcbiAgICBcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiAnOjonLFxyXG4gICAgICBwb3J0OiA4MDgwLFxyXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxyXG4gICAgICBvcGVuOiB0cnVlLCAvLyBBdXRvbWF0aWNhbGx5IG9wZW4gdGhlIGFwcCBpbiB0aGUgYnJvd3NlclxyXG4gICAgICBobXI6IHtcclxuICAgICAgICBvdmVybGF5OiB0cnVlLCAvLyBTaG93IGVycm9yIG92ZXJsYXlzIGluIHRoZSBicm93c2VyXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KHtcclxuICAgICAgICAvLyBFbmFibGUgUmVhY3QgUmVmcmVzaFxyXG4gICAgICAgIGpzeEltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcclxuICAgICAgICAvLyBBZGQgdGhpcyBmb3IgYmV0dGVyIGVycm9yIGhhbmRsaW5nIGluIGRldmVsb3BtZW50XHJcbiAgICAgICAgZGV2VG9vbHM6IG1vZGUgPT09ICdkZXZlbG9wbWVudCcsXHJcbiAgICAgIH0pLFxyXG4gICAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgICBcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8gQmV0dGVyIGJ1aWxkIGNvbmZpZ3VyYXRpb25cclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcclxuICAgICAgbWluaWZ5OiBtb2RlID09PSAncHJvZHVjdGlvbicgPyAnZXNidWlsZCcgOiBmYWxzZSxcclxuICAgICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICByZWFjdDogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxyXG4gICAgICAgICAgICB2ZW5kb3I6IFsnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JywgJ2F4aW9zJ10sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcclxuICAgIGRlZmluZToge1xyXG4gICAgICAncHJvY2Vzcy5lbnYnOiB7IC4uLmVudiwgTk9ERV9FTlY6IG1vZGUgfSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVQsU0FBUyxjQUFjLGVBQWU7QUFDdlYsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsU0FBTztBQUFBO0FBQUEsSUFFTCxNQUFNO0FBQUEsSUFFTixRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixNQUFNO0FBQUE7QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQTtBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUE7QUFBQSxRQUVKLGlCQUFpQjtBQUFBO0FBQUEsUUFFakIsVUFBVSxTQUFTO0FBQUEsTUFDckIsQ0FBQztBQUFBLE1BQ0QsU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDNUMsRUFBRSxPQUFPLE9BQU87QUFBQSxJQUVoQixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLE9BQU87QUFBQSxNQUNMLFdBQVcsU0FBUztBQUFBLE1BQ3BCLFFBQVEsU0FBUyxlQUFlLFlBQVk7QUFBQSxNQUM1QyxRQUFRO0FBQUEsTUFDUixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixPQUFPLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFlBQ2hELFFBQVEsQ0FBQyx5QkFBeUIsT0FBTztBQUFBLFVBQzNDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLFFBQVE7QUFBQSxNQUNOLGVBQWUsRUFBRSxHQUFHLEtBQUssVUFBVSxLQUFLO0FBQUEsSUFDMUM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
