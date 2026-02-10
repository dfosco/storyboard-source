import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generouted from '@generouted/react-router/plugin'
import postcssGlobalData from '@csstools/postcss-global-data'
import postcssPresetEnv from 'postcss-preset-env'
import browsers from '@github/browserslist-config'
import { globSync } from 'glob'

export default defineConfig({
    base: '/storyboard/',
    plugins: [
        react(),
        generouted(),
        {
            name: 'base-redirect',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url && !req.url.startsWith('/storyboard/') && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules/')) {
                        const newUrl = '/storyboard' + req.url
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
})
