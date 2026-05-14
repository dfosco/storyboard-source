/**
 * Split-serve spike (Option C): the proto Vite, standalone.
 *
 * IMPORTANT: this config does NOT import vite.config.js. Doing so pulls
 * @dfosco/storyboard's server-plugin into config-load, which transitively
 * imports ~40 source files (canvas/server, messaging/bus, terminal-server,
 * autosync, etc). Every one of those becomes a Vite configFileDependency,
 * which means writes the shell makes during normal use trigger a proto
 * server restart — producing a continuous reload loop in the iframe.
 *
 * Standalone keeps the proto's configFileDependencies list small (just
 * data-plugin + its handful of imports), so shell-side activity is invisible.
 *
 * Spawned by `storyboard dev`. Owns HMR for src/prototypes, src/components,
 * src/templates. PrototypeEmbed iframes http://localhost:<port>/<path> via
 * window.__SB_PROTO_URL__, injected by the shell's transformIndexHtml.
 */
/* global process */
import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import generouted from '@generouted/react-router/plugin'
import storyboardData from './packages/storyboard/src/internals/vite/data-plugin.js'
import postcssGlobalData from '@csstools/postcss-global-data'
import postcssPresetEnv from 'postcss-preset-env'
import browsers from '@github/browserslist-config'
import { globSync } from 'glob'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const PROTO_PORT = Number(process.env.STORYBOARD_PROTO_PORT) || 1235

export default defineConfig(() => ({
    base: '/',
    cacheDir: 'node_modules/.vite-proto',
    resolve: {
        dedupe: ['react', 'react-dom'],
        // Mirror the shell's alias map so src/index.jsx (the shared entry
        // point both Vites bootstrap from index.html) resolves identically.
        // Aliases are inert strings — they don't add to configFileDependencies,
        // unlike importing the shell's plugins did.
        alias: {
            '@': path.resolve(__dirname, './src'),
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
        react(),
        generouted({
            source: {
                routes: './src/prototypes/**/[\\w[-]*.{jsx,tsx,mdx}',
                modals: './src/prototypes/**/[+]*.{jsx,tsx,mdx}',
            },
        }),
    ],
    server: {
        port: PROTO_PORT,
        strictPort: true,
        fs: { allow: ['..'] },
        cors: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        // Watch only the dirs prototypes care about. Anything outside is
        // ignored — most importantly .storyboard/ (selectedwidgets writes),
        // *.canvas.jsonl, and any node_modules write.
        watch: {
            ignored: (filePath) => {
                if (!filePath) return false
                const norm = filePath.replace(/\\/g, '/')
                if (norm.includes('/node_modules/')) return true
                if (norm.includes('/.git/')) return true
                if (norm.includes('/.storyboard/')) return true
                if (norm.includes('/.storyboard-public/')) return true
                if (norm.includes('/terminal-snapshots/')) return true
                if (norm.includes('/dist/') || norm.includes('/build/')) return true
                if (norm.endsWith('.canvas.jsonl')) return true
                if (!norm.includes('/src/')) return false
                return !(
                    norm.includes('/src/prototypes/') ||
                    norm.includes('/src/components/') ||
                    norm.includes('/src/templates/') ||
                    norm.endsWith('/src/prototypes') ||
                    norm.endsWith('/src/components') ||
                    norm.endsWith('/src/templates')
                )
            },
        },
    },
    optimizeDeps: {
        include: [
            '@primer/react',
            '@primer/octicons-react',
            'use-sync-external-store/shim',
            'use-sync-external-store/shim/with-selector',
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
    esbuild: { keepNames: true },
    css: {
        postcss: {
            plugins: [
                postcssGlobalData({
                    files: globSync('node_modules/@primer/primitives/dist/css/**/*.css', { ignore: ['**/themes/**'] }),
                }),
                postcssPresetEnv({
                    stage: 2,
                    browsers,
                    features: {
                        'nesting-rules': { noIsPseudoSelector: true },
                        'focus-visible-pseudo-class': false,
                        'logical-properties-and-values': false,
                    },
                }),
            ],
        },
    },
}))
