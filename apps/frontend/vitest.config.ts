import { defineConfig } from 'vitest/config';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/', '*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next.js membundel `server-only` sendiri; di vitest cukup modul kosong.
      'server-only': path.join(path.dirname(require.resolve('next/package.json')), 'dist/compiled/server-only/empty.js'),
    },
  },
});
