import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Base public path when served in development or production
    base: '/',
    
    // Development server configuration
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: 3000,      // Default port
      strictPort: true, // Exit if port is in use
      open: true,      // Automatically open the app in the browser
      hmr: {
        overlay: true, // Show error overlays in the browser
      },
      // Configure proxy if needed for API requests
      proxy: {
        '/api': {
          target: 'http://localhost:3001', // Your API server
          changeOrigin: true,
          secure: false,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['@tanstack/react-query', 'axios'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
        },
      },
      // Reduce chunk size warning limit (default is 500kb)
      chunkSizeWarningLimit: 1000,
    },

    // Plugins
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      mode === 'development' && componentTagger(),
    ].filter(Boolean) as any,

    // Module resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Add other aliases as needed
      },
    },

    // Environment variables
    define: {
      'process.env': { ...env, NODE_ENV: mode },
      // Add global constants here
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      // Add other dependencies that should be pre-bundled
    },
  };
});
