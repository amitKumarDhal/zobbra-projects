import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Mirror tsconfig "paths" so components using "@/..." imports can be tested.
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // tsconfig uses "jsx": "preserve" for Next.js; tests need an actual transform.
  esbuild: { jsx: 'automatic' },
  test: {
    exclude: ['**/node_modules/**', '**/cypress/**', '**/.next/**'],
  },
});
