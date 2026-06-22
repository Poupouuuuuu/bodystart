import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Runtime JSX automatique (comme Next) → pas besoin d'importer React dans les .tsx
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/lib/loyalty/**/*.ts'],
      exclude: [
        'src/lib/loyalty/**/*.test.ts',
        'src/lib/loyalty/**/*.spec.ts',
        // Wrapper d'init Supabase sans logique metier — testable
        // seulement via E2E (Sprint L5 avec supabase local).
        'src/lib/loyalty/supabase-admin.ts',
      ],
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
