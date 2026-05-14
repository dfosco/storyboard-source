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

    // Drop only the shell-exclusive plugins: storyboard-server (canvas,
    // messaging bus, terminal server — would double-bind sockets and fight
    // for .storyboard/ files), prototypes-watcher (fires full-reload on
    // every prototype add/unlink — the data plugin already handles this
    // softly), and base-redirect (proto serves at root so the redirect is
    // misleading). Keep storyboard-data so prototypes can resolve
    // useFlowData/useObject/useRecord.
    const plugins = (shell.plugins || []).filter((p) => {
        if (!p) return false
        const name = p && p.name
        return (
            name !== 'storyboard-server' &&
            name !== 'storyboard-terminal-snapshots' &&
            name !== 'prototypes-watcher' &&
            name !== 'base-redirect'
        )
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
            // Watch ONLY src/prototypes — chokidar semantics need an explicit
            // ignore-everything + unignore-prototypes pair (a `!` pattern alone
            // doesn't restrict the watch set). Without this, the proto sees
            // shell writes to .storyboard/.selectedwidgets.json and *.canvas.jsonl
            // and full-reloads on every keystroke in the canvas.
            watch: {
                ignored: [
                    '**/.git/**',
                    '**/node_modules/**',
                    '**/.storyboard/**',
                    '**/*.canvas.jsonl',
                    '**/dist/**',
                    '**/build/**',
                ],
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
