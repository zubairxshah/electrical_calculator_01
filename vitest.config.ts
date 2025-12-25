import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000, // 30 seconds for slow integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'playwright.config.ts',
        'vitest.config.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
    include: [
      '__tests__/unit/**/*.test.{ts,tsx}',
      '__tests__/integration/**/*.test.{ts,tsx}',
      '__tests__/session-memory/**/*.test.{ts,tsx}',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
