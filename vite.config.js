import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generouted from '@generouted/react-router/plugin'
import storyboardData from './storyboard/vite/data-plugin.js'
import postcssGlobalData from '@csstools/postcss-global-data'
import postcssPresetEnv from 'postcss-preset-env'
import browsers from '@github/browserslist-config'
import { globSync } from 'glob'

export default defineConfig(({ command }) => {
    const base = process.env.VITE_BASE_PATH || '/storyboard/' // eslint-disable-line no-undef

    return {
    base,
    plugins: [
        storyboardData(),
        react(),
        generouted(),
        {
            name: 'base-redirect',
            configureServer(server) {
                const baseNoTrail = base.replace(/\/$/, '')
                server.middlewares.use((req, res, next) => {
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
    server: { port: 1234 },
    optimizeDeps: {
        include: ['reshaped', '@primer/react', '@primer/octicons-react'],
    },
    build: {
        // @primer/react barrel export can't be tree-shaken below ~664 KB.
        // Raised from 500 KB default to suppress the warning for that chunk.
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                // Split heavy vendor deps into separate, long-lived cacheable chunks.
                // Page code stays in small per-route chunks via generouted lazy routes.
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-primer': ['@primer/react'],
                    'vendor-octicons': ['@primer/octicons-react'],
                    'vendor-reshaped': ['reshaped'],
                },
            },
        },
    },
    css: {
        postcss: {
            plugins: [
                postcssGlobalData({
                    files: globSync(
                        'node_modules/@primer/primitives/dist/css/**/*.css'
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
