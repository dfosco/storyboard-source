import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:storyboard-data-index': new URL(
        './packages/storyboard/src/internals/__mocks__/virtual-storyboard-data-index.js',
        import.meta.url,
      ).pathname,
      '@dfosco/storyboard/ui-runtime/style.css': path.resolve(__dirname, 'packages/storyboard/src/core/styles/tailwind.css'),
      '@dfosco/storyboard/ui-runtime': path.resolve(__dirname, 'packages/storyboard/src/core/ui-entry.js'),
      '@dfosco/storyboard/canvas/style.css': path.resolve(__dirname, 'packages/storyboard/src/canvas/style.css'),
      '@dfosco/storyboard/canvas': path.resolve(__dirname, 'packages/storyboard/src/canvas/index.js'),
      '@dfosco/storyboard/core': path.resolve(__dirname, 'packages/storyboard/src/core/index.js'),
      '@dfosco/storyboard': path.resolve(__dirname, 'packages/storyboard/src/internals/index.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['packages/storyboard/src/**/*.test.{js,jsx}', 'packages/storyboard/test/**/*.test.ts'],
    server: {
      deps: {
        inline: [/@primer\//],
      },
    },
    exclude: [
      'packages/storyboard/src/core/comments/ui/authModal.test.js',
      'packages/storyboard/src/core/devtools.test.js',
      'packages/storyboard/src/core/canvas/__tests__/*-integration.test.js',
    ],
  },
})
