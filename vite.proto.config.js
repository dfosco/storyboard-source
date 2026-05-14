/**
 * Split-serve spike (Option C): the proto Vite.
 *
 * Spawned by `storyboard dev` as a sibling of the shell Vite. Owns HMR for
 * everything under `src/prototypes/**`. Strips `storyboard/vite/server`
 * (no canvas/messaging/terminal — those are shell-only) and ignores
 * non-prototype source from its watcher.
 *
 * Cross-origin iframe: PrototypeEmbed iframes `http://localhost:<protoPort>/<path>`
 * via `window.__SB_PROTO_URL__`, injected by the shell's transformIndexHtml.
 */
/* global process */
import { defineConfig } from 'vite'
import path from 'path'
import shellConfigFactory from './vite.config.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const PROTO_PORT = Number(process.env.STORYBOARD_PROTO_PORT) || 1235

export default defineConfig(async (env) => {
    const shell = await shellConfigFactory(env)

    // Drop the storyboard server plugin — canvas, messaging bus, terminal
    // server, autosync, hot-pool all live in the shell process. Running them
    // twice would double-bind the messaging bus and fight for the same
    // .storyboard/ files.
    const plugins = (shell.plugins || []).filter((p) => {
        if (!p) return false
        const name = p && p.name
        // server-plugin and the shell-only base-redirect/prototypes-watcher
        // tweaks are irrelevant here.
        return name !== 'storyboard-server' && name !== 'base-redirect'
    })

    return {
        ...shell,
        // Always serve at the root — proto is its own origin.
        base: '/',
        plugins,
        server: {
            ...(shell.server || {}),
            port: PROTO_PORT,
            strictPort: true,
            // Inverse of shell: only watch prototypes. Everything else is
            // owned by the shell process.
            watch: {
                ignored: ['**/node_modules/**', '!**/src/prototypes/**'],
            },
            // Allow the shell origin to embed prototype pages in iframes.
            cors: true,
            headers: {
                // Permit cross-origin embedding from the shell host.
                'Access-Control-Allow-Origin': '*',
            },
        },
    }
})

void __dirname
