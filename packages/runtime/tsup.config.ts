import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client/index': 'src/client/index.ts',
    'schema/index': 'src/schema/index.ts',
    'server/main': 'src/server/main.ts',
    'vite-plugin/index': 'src/vite-plugin/index.ts',
    'vite-plugin/wrapper': 'src/vite-plugin/wrapper.ts',
  },
  format: ['esm'],
  target: 'node20',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: false,
})
