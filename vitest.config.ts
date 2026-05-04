import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.simple.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
