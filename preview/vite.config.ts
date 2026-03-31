import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      '@core': resolve(__dirname, '..', 'core'),
      '@shapes': resolve(__dirname, '..', 'shapes'),
      '@media': resolve(__dirname, '..', 'media'),
      '@mobile': resolve(__dirname, '..', 'mobile'),
      '@theme': resolve(__dirname, '..', 'theme'),
      '@interactions': resolve(__dirname, '..', 'interactions'),
      '@react': resolve(__dirname, '..', 'react'),
    },
  },
  server: {
    port: 4173,
  },
});
