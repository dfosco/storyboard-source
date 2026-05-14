import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import generouted from '@generouted/react-router/plugin'
// In worktrees, npm workspace links point at the main worktree. Import
// Vite plugins via relative paths so each worktree runs its own source.
import storyboardData from './packages/storyboard/src/internals/vite/data-plugin.js'
import storyboardServer from './packages/storyboard/src/core/vite/server-plugin.js'
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
            '@dfosco/storyboard/ui-runtime/style.css': path.resolve(__dirname, 'packages/storyboard/src/core/styles/tailwind.css'),
            '@dfosco/storyboard/ui-runtime': path.resolve(__dirname, 'packages/storyboard/src/core/ui-entry.js'),
            '@dfosco/storyboard/ui/design-modes': path.resolve(__dirname, 'packages/storyboard/src/core/ui/design-modes.ts'),
            '@dfosco/storyboard/ui/viewfinder': path.resolve(__dirname, 'packages/storyboard/src/core/ui/viewfinder.ts'),
            '@dfosco/storyboard/vite/server': path.resolve(__dirname, 'packages/storyboard/src/core/vite/server-plugin.js'),
            '@dfosco/storyboard/workshop/ui/mount.js': path.resolve(__dirname, 'packages/storyboard/src/core/workshop/ui/mount.js'),
            '@dfosco/storyboard/comments/ui/comments.css': path.resolve(__dirname, 'packages/storyboard/src/core/comments/ui/comment-layout.css'),
            '@dfosco/storyboard/comments/ui/comment-layout.css': path.resolve(__dirname, 'packages/storyboard/src/core/comments/ui/comment-layout.css'),
            '@dfosco/storyboard/comments': path.resolve(__dirname, 'packages/storyboard/src/core/comments/index.js'),
            '@dfosco/storyboard/widgets.config.json': path.resolve(__dirname, 'packages/storyboard/widgets.config.json'),
            '@dfosco/storyboard/paste.config.json': path.resolve(__dirname, 'packages/storyboard/paste.config.json'),
            '@dfosco/storyboard/canvas/materializer': path.resolve(__dirname, 'packages/storyboard/src/core/canvas/materializer.js'),
            '@dfosco/storyboard/canvas/identity': path.resolve(__dirname, 'packages/storyboard/src/core/canvas/identity.js'),
            '@dfosco/storyboard/canvas/collision': path.resolve(__dirname, 'packages/storyboard/src/core/canvas/collision.js'),
            '@dfosco/storyboard/canvas/writeGuard': path.resolve(__dirname, 'packages/storyboard/src/core/canvas/writeGuard.js'),
            '@dfosco/storyboard/worktree/serverRegistry': path.resolve(__dirname, 'packages/storyboard/src/core/worktree/serverRegistry.js'),
            '@dfosco/storyboard/config': path.resolve(__dirname, 'packages/storyboard/src/core/stores/configSchema.js'),
            '@dfosco/storyboard/modes.css': path.resolve(__dirname, 'packages/storyboard/src/core/modes/modes.css'),
            '@dfosco/storyboard/inspector/highlighter': path.resolve(__dirname, 'packages/storyboard/src/core/inspector/highlighter.js'),
            '@dfosco/storyboard/smooth-corners': path.resolve(__dirname, 'packages/storyboard/src/core/utils/smoothCorners.js'),
            '@dfosco/storyboard/core': path.resolve(__dirname, 'packages/storyboard/src/core/index.js'),
            '@dfosco/storyboard/hash-preserver': path.resolve(__dirname, 'packages/storyboard/src/internals/hashPreserver.js'),
            '@dfosco/storyboard/error-boundary': path.resolve(__dirname, 'packages/storyboard/src/internals/PrototypeErrorBoundary.jsx'),
            '@dfosco/storyboard/canvas/CanvasPage': path.resolve(__dirname, 'packages/storyboard/src/internals/canvas/CanvasPage.jsx'),
            '@dfosco/storyboard/workspace': path.resolve(__dirname, 'packages/storyboard/src/internals/Workspace.jsx'),
            '@dfosco/storyboard/context': path.resolve(__dirname, 'packages/storyboard/src/internals/context.jsx'),
            '@dfosco/storyboard/hooks/useFeatureFlag': path.resolve(__dirname, 'packages/storyboard/src/internals/hooks/useFeatureFlag.js'),
            '@dfosco/storyboard/vite': path.resolve(__dirname, 'packages/storyboard/src/internals/vite/data-plugin.js'),
            '@dfosco/storyboard/canvas/style.css': path.resolve(__dirname, 'packages/storyboard/src/canvas/style.css'),
            '@dfosco/storyboard/canvas': path.resolve(__dirname, 'packages/storyboard/src/canvas/index.js'),
            '@dfosco/storyboard': path.resolve(__dirname, 'packages/storyboard/src/internals/index.js'),
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
            // Don't ignore .worktrees — this project may run inside one.
            // Split-serve spike: ignore prototype edits in the shell so HMR
            // and module invalidation don't ripple into the canvas. The
            // proto Vite (vite.proto.config.js) owns prototype HMR.
            ignored: ['**/src/prototypes/**'],
        },
        warmup: {
            clientFiles: [
                'src/index.jsx',
                'src/prototypes/**/*.jsx',
                'src/components/**/*.jsx',
                'src/templates/**/*.jsx',
                'packages/storyboard/src/internals/**/*.{js,jsx}',
                'packages/storyboard/src/core/**/*.js',
                '!packages/storyboard/src/core/cli/**',
            ],
        },
    },
    optimizeDeps: {
        include: [
            '@primer/react',
            '@primer/octicons-react',
            'use-sync-external-store/shim',
            'use-sync-external-store/shim/with-selector',
            // Prototype-side deps — pre-bundle so the first prototype load
            // doesn't discover them on the fly and trigger a chain of
            // "optimized dependencies changed. reloading" cycles. Each entry
            // here came from a real reload-loop log line.
            '@base-ui/react/dialog',
            '@base-ui/react/menu',
            '@primer/react/experimental',
            '@neodrag/react',
            'ghostty-web',
            'highlight.js/lib/core',
            'highlight.js/lib/languages/javascript',
            'highlight.js/lib/languages/typescript',
            'highlight.js/lib/languages/xml',
            'clsx',
            'tailwind-merge',
            'tailwind-variants',
            '@radix-ui/react-separator',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            'lucide-react',
        ],
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
