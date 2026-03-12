import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {},
    },
  },
  plugins: [],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/wisp': { target: 'ws://localhost:3000', ws: true },
    },
  },
});

