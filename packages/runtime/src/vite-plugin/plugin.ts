import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

/**
 * @dfosco/storyboard-runtime/vite-plugin
 *
 * Auto-injected by the runtime into every spawned Vite child via the
 * vite-config-wrapper. Closes two RCA hypotheses from the server-state
 * branch-mixing investigation:
 *
 * **H1 — base-redirect concatenation.** Vite's default base-redirect
 * middleware blindly prepends `base` to any request whose URL doesn't
 * start with it. When Caddy mis-routes `/branch--B/...` to a server hosting
 * `/branch--A/`, this produces the impossible URL `/branch--A/branch--B/...`.
 *
 * Our middleware *intercepts before Vite's* and refuses to redirect when
 * the path already starts with a `/branch--<other>/` segment. Returns 421
 * (Misdirected Request) with a helpful HTML page instead.
 *
 * **H6 — HMR has no branch prefix.** Vite's default HMR path is `/`, so
 * after laptop sleep the WebSocket reconnects through the catch-all server
 * and one branch's HMR payloads can reach another branch's tabs.
 *
 * The plugin's `config` hook sets `server.hmr.path` to a branch-namespaced
 * value the existing Caddy `/branch--<name>/*` route already proxies.
 *
 * Configuration is via env vars set by the runtime when spawning Vite:
 *   STORYBOARD_RUNTIME_BRANCH    — current worktree name (e.g. "0.5.0")
 *   STORYBOARD_RUNTIME_DOMAIN    — current devDomain (e.g. "storyboard-core")
 *
 * The plugin is a no-op when neither env var is set, so users can include
 * it in vite.config.js without runtime coupling.
 */

export interface StoryboardRuntimePluginOptions {
  /** Override branch name (otherwise reads STORYBOARD_RUNTIME_BRANCH). */
  branch?: string
  /** Override devDomain (otherwise reads STORYBOARD_RUNTIME_DOMAIN). */
  devDomain?: string
}

/** Pure helper exported for tests. Returns the redirect target, or null to refuse. */
export function decideRedirect(
  reqUrl: string,
  ownBase: string,
): { kind: 'pass' } | { kind: 'redirect'; to: string } | { kind: 'refuse'; foreignBranch: string } {
  // Strip query/hash for analysis but keep them on the redirect target.
  if (!reqUrl) return { kind: 'pass' }
  if (reqUrl.startsWith('/@') || reqUrl.startsWith('/node_modules/')) return { kind: 'pass' }

  const baseNoTrail = ownBase.endsWith('/') ? ownBase.slice(0, -1) : ownBase

  // Foreign /branch--X/ check goes FIRST. This prevents the main-server (base="/")
  // from passing requests like /branch--dfosco/foo through to Vite, which would
  // 404 and trigger Vite's own base-redirect into the doubled-URL bug.
  const foreignMatch = reqUrl.match(/^\/branch--([a-z0-9._-]+)(\/|$)/i)
  if (foreignMatch) {
    const foreign = foreignMatch[1]!
    const ownBranchMatch = ownBase.match(/^\/branch--([a-z0-9._-]+)\/?$/i)
    const ownBranch = ownBranchMatch?.[1]
    if (foreign !== ownBranch) {
      return { kind: 'refuse', foreignBranch: foreign }
    }
    return { kind: 'pass' }  // own branch
  }

  // Already on our base (and not a foreign /branch--X/) — let Vite handle.
  if (reqUrl === baseNoTrail || reqUrl.startsWith(baseNoTrail + '/') || reqUrl === baseNoTrail + '/') {
    return { kind: 'pass' }
  }

  // Bare path (no branch prefix) — original Vite convenience: prepend our base.
  return { kind: 'redirect', to: baseNoTrail + reqUrl }
}

function renderForeignBranchPage(foreign: string, ownBranch: string | null, devDomain: string): string {
  const ownLabel = ownBranch ?? 'main'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Misdirected Request</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 540px; margin: 4rem auto; padding: 0 1rem; color: #1f2328; }
  code { background: #eef0f2; padding: 0.1em 0.3em; border-radius: 3px; }
  a { color: #0969da; }
</style></head>
<body>
<h1>Wrong dev server (421 Misdirected)</h1>
<p>This Vite is serving <code>/branch--${escapeHtml(ownLabel)}/</code>, but you requested <code>/branch--${escapeHtml(foreign)}/</code>.</p>
<p>The Storyboard Runtime refused to silently rewrite your URL — that's how the
<code>/branch--A/branch--B/</code> bug used to happen.</p>
<p>To open the right branch:</p>
<pre>npx storyboard dev ${escapeHtml(foreign)}</pre>
<p>Or visit it directly: <a href="http://${escapeHtml(devDomain)}.localhost/branch--${encodeURIComponent(foreign)}/">http://${escapeHtml(devDomain)}.localhost/branch--${escapeHtml(foreign)}/</a></p>
</body></html>`
}

function renderForeignDomainPage(actualHost: string, expectedHost: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Misdirected Request</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 540px; margin: 4rem auto; padding: 0 1rem; color: #1f2328; }
  code { background: #eef0f2; padding: 0.1em 0.3em; border-radius: 3px; }
</style></head>
<body>
<h1>Wrong domain (421 Misdirected)</h1>
<p>This Vite serves <code>${escapeHtml(expectedHost)}</code>, but you requested <code>${escapeHtml(actualHost)}</code>.</p>
<p>Each Storyboard repo has a unique <code>devDomain</code>. If you see this page,
either Caddy misrouted your request or two repos are configured with the same
<code>devDomain</code> in <code>storyboard.config.json</code>.</p>
</body></html>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export function storyboardRuntimePlugin(opts: StoryboardRuntimePluginOptions = {}): Plugin {
  const branch = opts.branch ?? process.env.STORYBOARD_RUNTIME_BRANCH ?? null
  const devDomain = opts.devDomain ?? process.env.STORYBOARD_RUNTIME_DOMAIN ?? null
  const enabled = Boolean(branch || devDomain)

  return {
    name: '@dfosco/storyboard-runtime/vite-plugin',
    enforce: 'pre',

    config() {
      if (!enabled || !branch || branch === 'main') return undefined
      // H6: namespace HMR under the branch prefix so Caddy can route it
      // alongside everything else.
      return {
        server: {
          hmr: { path: `/branch--${branch}/__vite_hmr` },
        },
      }
    },

    configureServer(server: ViteDevServer) {
      if (!enabled) return
      const ownBase = branch && branch !== 'main' ? `/branch--${branch}/` : '/'
      const ownDomain = devDomain ?? 'storyboard'
      const expectedHost = `${ownDomain}.localhost`

      // M5 / H1 defense in depth: refuse requests whose Host header points
      // at a different devDomain. If Caddy somehow misroutes (or a user
      // hand-types the wrong domain into a port-bound URL), we never serve
      // foreign content under a domain Vite isn't supposed to own.
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '/'

        // Strip port from Host before comparing (Caddy strips it anyway,
        // but direct hits to localhost:1240 will include it).
        const rawHost = ((req.headers?.host ?? '').split(':')[0] ?? '').toLowerCase()
        if (rawHost && rawHost.endsWith('.localhost') && rawHost !== expectedHost) {
          res.statusCode = 421
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(renderForeignDomainPage(rawHost, expectedHost))
          return
        }

        const decision = decideRedirect(url, ownBase)
        switch (decision.kind) {
          case 'pass':
            next()
            return
          case 'refuse': {
            res.statusCode = 421
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(renderForeignBranchPage(decision.foreignBranch, branch === 'main' ? null : branch, ownDomain))
            return
          }
          case 'redirect':
            res.statusCode = 302
            res.setHeader('Location', decision.to)
            res.end()
            return
        }
      })
    },
  }
}

export default storyboardRuntimePlugin
