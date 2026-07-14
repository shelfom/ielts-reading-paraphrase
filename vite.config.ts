import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: parseInt(process.env.DEPLOY_RUN_PORT || '5000', 10),
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      overlay: true,
      path: '/hot/vite-hmr',
      port: 6000,
      clientPort: 443,
      timeout: 30000,
    },
    watch: {
      usePolling: true,
      interval: 100,
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
