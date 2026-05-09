import { defineConfig } from 'tsup'

/**
 * Build the runtime sub-bundle into dist/runtime/. The runtime is shipped
 * as part of @dfosco/storyboard rather than its own npm package; subpath
 * exports (./runtime, ./runtime/client, ./runtime/schema, ./runtime/vite-plugin)
 * give consumers tree-shakeable access without a separate install.
 */
export default defineConfig({
  entry: {
    'index': 'src/runtime/index.ts',
    'client/index': 'src/runtime/client/index.ts',
    'schema/index': 'src/runtime/schema/index.ts',
    'server/main': 'src/runtime/server/main.ts',
    'vite-plugin/index': 'src/runtime/vite-plugin/index.ts',
    'vite-plugin/wrapper': 'src/runtime/vite-plugin/wrapper.ts',
  },
  outDir: 'dist/runtime',
  format: ['esm'],
  target: 'node20',
  dts: { resolve: true, compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler', lib: ['ES2022'], target: 'ES2022' } },
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: false,
})
