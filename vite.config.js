import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import generouted from '@generouted/react-router/plugin'
// In worktrees, npm workspace links point at the main worktree. Import
// Vite plugins via relative paths so each worktree runs its own source.
import storyboardData from './packages/react/src/vite/data-plugin.js'
import storyboardServer from './packages/core/src/vite/server-plugin.js'
import postcssGlobalData from '@csstools/postcss-global-data'
import postcssPresetEnv from 'postcss-preset-env'
import browsers from '@github/browserslist-config'
import fs from 'node:fs'
import { globSync } from 'glob'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Read config with fs instead of a static import so Vite doesn't treat
// storyboard.config.json as a config dependency (which would restart the
// entire server on every edit instead of just hot-reloading).
JSON.parse(fs.readFileSync(path.resolve(__dirname, 'storyboard.config.json'), 'utf-8'))

export default defineConfig(() => {
    const base = process.env.VITE_BASE_PATH || '/'

    return {
    base,
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': path.resolve(__dirname, './src'),
            // In git worktrees, npm resolves workspace packages to the main
            // worktree. Force local resolution so edits here take effect.
            // NOTE: Sub-path aliases must come BEFORE base package aliases.
            // In source repo, ui-runtime resolves to source for HMR.
            // In consumer repos, it resolves to dist/storyboard-ui.js (pre-compiled).
            '@dfosco/storyboard-core/ui-runtime/style.css': path.resolve(__dirname, 'packages/core/src/styles/tailwind.css'),
            '@dfosco/storyboard-core/ui-runtime': path.resolve(__dirname, 'packages/core/src/ui-entry.js'),
            '@dfosco/storyboard-core/svelte-plugin-ui/design-modes': path.resolve(__dirname, 'packages/core/src/ui/design-modes.ts'),
            '@dfosco/storyboard-core/svelte-plugin-ui/viewfinder': path.resolve(__dirname, 'packages/core/src/ui/viewfinder.ts'),
            '@dfosco/storyboard-core/ui/design-modes': path.resolve(__dirname, 'packages/core/src/ui/design-modes.ts'),
            '@dfosco/storyboard-core/ui/viewfinder': path.resolve(__dirname, 'packages/core/src/ui/viewfinder.ts'),
            '@dfosco/storyboard-core/svelte-plugin-ui/styles/base.css': path.resolve(__dirname, 'packages/core/src/svelte-plugin-ui/styles/base.css'),
            '@dfosco/storyboard-core/svelte-plugin-ui': path.resolve(__dirname, 'packages/core/src/svelte-plugin-ui/index.ts'),
            '@dfosco/storyboard-core/vite/server': path.resolve(__dirname, 'packages/core/src/vite/server-plugin.js'),
            '@dfosco/storyboard-core/workshop/ui/mount.js': path.resolve(__dirname, 'packages/core/src/workshop/ui/mount.js'),
            '@dfosco/storyboard-core/comments/ui/comments.css': path.resolve(__dirname, 'packages/core/src/comments/ui/comment-layout.css'),
            '@dfosco/storyboard-core/comments/ui/comment-layout.css': path.resolve(__dirname, 'packages/core/src/comments/ui/comment-layout.css'),
            '@dfosco/storyboard-core/comments/svelte': path.resolve(__dirname, 'packages/core/src/comments/ui/index.js'),
            '@dfosco/storyboard-core/widgets.config.json': path.resolve(__dirname, 'packages/core/widgets.config.json'),
            '@dfosco/storyboard-core/paste.config.json': path.resolve(__dirname, 'packages/core/paste.config.json'),
            '@dfosco/storyboard-core/canvas/materializer': path.resolve(__dirname, 'packages/core/src/canvas/materializer.js'),
            '@dfosco/storyboard-core/canvas/identity': path.resolve(__dirname, 'packages/core/src/canvas/identity.js'),
            '@dfosco/storyboard-core/canvas/collision': path.resolve(__dirname, 'packages/core/src/canvas/collision.js'),
            '@dfosco/storyboard-core/canvas/writeGuard': path.resolve(__dirname, 'packages/core/src/canvas/writeGuard.js'),
            '@dfosco/storyboard-core/worktree/serverRegistry': path.resolve(__dirname, 'packages/core/src/worktree/serverRegistry.js'),
            '@dfosco/storyboard-core/config': path.resolve(__dirname, 'packages/core/src/configSchema.js'),
            '@dfosco/storyboard-core/modes.css': path.resolve(__dirname, 'packages/core/src/modes.css'),
            '@dfosco/storyboard-core/inspector/highlighter': path.resolve(__dirname, 'packages/core/src/inspector/highlighter.js'),
            '@dfosco/storyboard-core/smooth-corners': path.resolve(__dirname, 'packages/core/src/smoothCorners.js'),
            '@dfosco/storyboard-core/comments': path.resolve(__dirname, 'packages/core/src/comments/index.js'),
            '@dfosco/storyboard-core': path.resolve(__dirname, 'packages/core/src/index.js'),
            '@dfosco/storyboard-react/Icon': path.resolve(__dirname, 'packages/react/src/Icon.jsx'),
            '@dfosco/storyboard-react/Viewfinder': path.resolve(__dirname, 'packages/react/src/Viewfinder.jsx'),
            '@dfosco/storyboard-react/vite': path.resolve(__dirname, 'packages/react/src/vite/data-plugin.js'),
            '@dfosco/storyboard-react/hash-preserver': path.resolve(__dirname, 'packages/react/src/hashPreserver.js'),
            '@dfosco/storyboard-react/canvas/CanvasPage': path.resolve(__dirname, 'packages/react/src/canvas/CanvasPage.jsx'),
            '@dfosco/storyboard-react/context': path.resolve(__dirname, 'packages/react/src/context.jsx'),
            '@dfosco/storyboard-react/hooks/useFeatureFlag': path.resolve(__dirname, 'packages/react/src/hooks/useFeatureFlag.js'),
            '@dfosco/storyboard-react': path.resolve(__dirname, 'packages/react/src/index.js'),
            '@dfosco/storyboard-react-primer': path.resolve(__dirname, 'packages/react-primer/src/index.js'),

            '@dfosco/tiny-canvas/style.css': path.resolve(__dirname, 'packages/tiny-canvas/src/style.css'),
            '@dfosco/tiny-canvas': path.resolve(__dirname, 'packages/tiny-canvas/src/index.js'),
        },
    },
    plugins: [
        tailwindcss(),
        storyboardData(),
        storyboardServer(),
        react(),
        generouted({
            source: {
                routes: './src/prototypes/**/[\\w[-]*.{jsx,tsx,mdx}',
                modals: './src/prototypes/**/[+]*.{jsx,tsx,mdx}',
            },
        }),
        // generouted's built-in watcher only listens for /src/pages/ changes.
        // This plugin triggers a full reload when prototypes are added/removed.
        {
            name: 'prototypes-watcher',
            configureServer(server) {
                const listener = (file = '') => {
                    if (file.includes(path.normalize('/src/prototypes/'))) {
                        server.ws.send({ type: 'full-reload' })
                    }
                }
                server.watcher.on('add', listener)
                server.watcher.on('unlink', listener)
            },
        },
        {
            name: 'base-redirect',
            configureServer(server) {
                const baseNoTrail = base.replace(/\/$/, '')
                server.middlewares.use((req, res, next) => {
                    if (req.url === baseNoTrail) {
                        res.writeHead(302, { Location: base })
                        res.end()
                        return
                    }
                    if (req.url && req.url !== baseNoTrail && !req.url.startsWith(base) && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules/')) {
                        const newUrl = baseNoTrail + req.url
                        res.writeHead(302, { Location: newUrl })
                        res.end()
                        return
                    }
                    next()
                })
            },
        },
    ],
    server: {
        port: 1234,
        fs: { allow: ['..'] },
        watch: {
            // Don't ignore .worktrees — this project may run inside one
        },
        warmup: {
            clientFiles: [
                'src/index.jsx',
                'src/prototypes/**/*.jsx',
                'src/components/**/*.jsx',
                'src/templates/**/*.jsx',
                'packages/react/src/**/*.{js,jsx}',
                'packages/react-primer/src/**/*.{js,jsx}',
                'packages/core/src/**/*.js',
                '!packages/core/src/cli/**',
            ],
        },
    },
    optimizeDeps: {
        include: ['@primer/react', '@primer/octicons-react', 'use-sync-external-store/shim', 'use-sync-external-store/shim/with-selector'],
    },
    esbuild: {
        // Preserve function names so the storyboard inspector shows
        // real component names instead of minified identifiers
        keepNames: true,
    },
    build: {
        // @primer/react barrel export can't be tree-shaken below ~664 KB.
        // Raised from 500 KB default to suppress the warning for that chunk.
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            // Core UI modules (loader.js, ui components) are dynamically imported for the
            // externalized UI bundle build but also statically imported by core
            // exports. This is intentional — suppress the "won't move to another
            // chunk" noise that only appears in the source-repo build.
            onwarn(warning, warn) {
                if (warning.code === 'IMPORT_IS_DEFINED' ||
                    (warning.message && warning.message.includes('dynamic import will not move module'))) return
                warn(warning)
            },
            output: {
                // Split heavy vendor deps into separate, long-lived cacheable chunks.
                // Page code stays in small per-route chunks via generouted lazy routes.
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-primer': ['@primer/react'],
                    'vendor-octicons': ['@primer/octicons-react'],

                },
            },
        },
    },
    css: {
        postcss: {
            plugins: [
                postcssGlobalData({
                    files: globSync(
                        'node_modules/@primer/primitives/dist/css/**/*.css',
                        { ignore: ['**/themes/**'] }
                    ),
                }),
                postcssPresetEnv({
                    stage: 2,
                    browsers,
                    // https://preset-env.cssdb.org/features/#stage-2
                    features: {
                        'nesting-rules': {
                            noIsPseudoSelector: true,
                        },
                        'focus-visible-pseudo-class': false,
                        'logical-properties-and-values': false,
                    },
                }),
            ],
        },
    },
}})
