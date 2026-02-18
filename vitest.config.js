import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:storyboard-data-index': new URL(
        './packages/react/src/__mocks__/virtual-storyboard-data-index.js',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['packages/*/src/**/*.test.{js,jsx}'],
  },
})
