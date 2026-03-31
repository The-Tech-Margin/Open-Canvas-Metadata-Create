import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'core'),
      '@shapes': path.resolve(__dirname, 'shapes'),
      '@media': path.resolve(__dirname, 'media'),
      '@mobile': path.resolve(__dirname, 'mobile'),
      '@theme': path.resolve(__dirname, 'theme'),
      '@interactions': path.resolve(__dirname, 'interactions'),
      '@react': path.resolve(__dirname, 'react'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts'],
  },
});
