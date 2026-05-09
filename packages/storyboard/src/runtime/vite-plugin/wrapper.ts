/**
 * Vite config wrapper — auto-applied by the runtime via `vite --config`.
 *
 * Loads the user's vite.config.{js,ts,mjs,mts} from the cwd, merges in the
 * storyboard-runtime plugin, and re-exports the result. This is how we
 * inject the H1/H6 guards into every spawned Vite WITHOUT requiring users
 * to edit their config.
 *
 * The runtime sets STORYBOARD_RUNTIME_BRANCH / _DOMAIN env vars before
 * spawning vite, so the plugin self-configures from there.
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { storyboardRuntimePlugin } from './plugin.js'
import type { UserConfig, UserConfigExport } from 'vite'

const USER_CONFIG_CANDIDATES = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']

async function loadUserConfig(cwd: string): Promise<UserConfig | null> {
  for (const name of USER_CONFIG_CANDIDATES) {
    const path = resolve(cwd, name)
    if (!existsSync(path)) continue
    try {
      // Vite handles --config itself when found; this wrapper is only used
      // when the runtime explicitly points vite here. We need to import the
      // user's config dynamically so its plugins still apply.
      const mod = (await import(path)) as { default?: UserConfigExport }
      const exp = mod.default ?? (mod as unknown as UserConfigExport)
      const cfg = typeof exp === 'function' ? await exp({ command: 'serve', mode: 'development' }) : await exp
      return (cfg ?? {}) as UserConfig
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[storyboard-runtime] Could not load ${name}: ${(err as Error).message}`)
    }
  }
  return null
}

export default async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const user = (await loadUserConfig(cwd)) ?? {}
  const userPlugins = Array.isArray(user.plugins) ? user.plugins : (user.plugins ? [user.plugins] : [])

  return {
    ...user,
    plugins: [storyboardRuntimePlugin(), ...userPlugins],
    server: {
      ...user.server,
      // The plugin's config hook sets server.hmr.path; we leave the rest of
      // user.server.hmr (host, clientPort, etc.) untouched.
    },
  }
}
