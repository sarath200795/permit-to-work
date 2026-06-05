import { defineConfig } from 'vitest/config'

// Unit tests live in src/ and run in the default (node) env.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['node_modules/**', 'dist/**'],
  },
})
