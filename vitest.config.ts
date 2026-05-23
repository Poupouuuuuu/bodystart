import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/lib/loyalty/**/*.ts'],
      exclude: ['src/lib/loyalty/**/*.test.ts', 'src/lib/loyalty/**/*.spec.ts'],
      thresholds: {
        // Cible spec V2 §10 : minimum 80% sur lib/loyalty/
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
})
