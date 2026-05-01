/**
 * mountStoryboardCore — single entry point for consumer apps.
 *
 * Initializes all storyboard systems (URL state, history, comments, devtools)
 * Consumers call this once at app startup.
 *
 * Usage:
 *   import { mountStoryboardCore } from '@dfosco/storyboard-core'
 *   import storyboardConfig from '../storyboard.config.json'
 *   mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
 */

import { installHideParamListener } from './interceptHideParams.js'
import { installHistorySync } from './hideMode.js'
import { installBodyClassSync } from './bodyClasses.js'
import {
  initCommentsConfig, isCommentsEnabled,
  initFeatureFlags,
  initPlugins,
  initUIConfig,
  initCanvasConfig,
  initCommandPaletteConfig,
  initToolbarConfig, consumeClientToolbarOverrides,
  initCustomerModeConfig,
  getConfig,
} from '@dfosco/storyboard-core'

let _mounted = false

const CHROME_HIDDEN_KEY = 'sb-chrome-hidden'
const CHROME_COMPLETELY_HIDDEN_KEY = 'sb-chrome-completely-hidden'

/**
 * Migrate localStorage keys renamed in 4.3.0.
 * Runs once at startup, idempotent: only copies if new key doesn't exist yet.
 */
function migrateLocalStorageKeys() {
  if (typeof localStorage === 'undefined') return
  const renames = [
    ['sb-viewfinder-starred', 'sb-workspace-starred'],
    ['sb-viewfinder-recent', 'sb-workspace-recent'],
    ['sb-viewfinder-group-folders', 'sb-workspace-group-folders'],
  ]
  for (const [oldKey, newKey] of renames) {
    if (localStorage.getItem(newKey) === null && localStorage.getItem(oldKey) !== null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey))
    }
  }
}

/**
 * Restore the saved chrome-hidden state immediately, before React mounts.
 * Prevents a flash of toolbars appearing then disappearing.
 */
function applyEarlyChromeState() {
  if (typeof document === 'undefined' || typeof localStorage === 'undefined') return
  const hidden = localStorage.getItem(CHROME_HIDDEN_KEY) === '1'
  const completelyHidden = localStorage.getItem(CHROME_COMPLETELY_HIDDEN_KEY) === '1'
  if (hidden) {
    document.documentElement.classList.add('storyboard-chrome-hidden')
  }
  if (completelyHidden) {
    document.documentElement.classList.add('storyboard-chrome-completely-hidden')
  }
}

/**
 * Watch for changes to chrome-hidden / chrome-completely-hidden classes
 * and persist to localStorage. Works regardless of which code path toggles them.
 */
function installChromeStatePersistence() {
  if (typeof document === 'undefined' || typeof localStorage === 'undefined') return
  const observer = new MutationObserver(() => {
    const hidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
    const completelyHidden = document.documentElement.classList.contains('storyboard-chrome-completely-hidden')
    localStorage.setItem(CHROME_HIDDEN_KEY, hidden ? '1' : '0')
    localStorage.setItem(CHROME_COMPLETELY_HIDDEN_KEY, completelyHidden ? '1' : '0')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/**
 * Apply the saved theme to Primer CSS attributes immediately, before
 * React mount. This prevents a flash of wrong-theme content.
 * Reads the same `sb-color-scheme` localStorage key used by themeStore.
 */
function applyEarlyTheme() {
  if (typeof document === 'undefined') return

  const stored =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('sb-color-scheme')
      : null
  const storedSync =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('sb-theme-sync')
      : null
  let syncTargets = { prototype: true, toolbar: false, codeBoxes: true, canvas: true }
  if (storedSync) {
    try {
      syncTargets = { ...syncTargets, ...JSON.parse(storedSync) }
    } catch {
      // Ignore malformed persisted sync settings and use defaults.
    }
  }
  const theme = stored || 'system'
  const el = document.documentElement
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const forcedTarget = searchParams?.get('_sb_theme_target')

  // Resolve "system" to an actual theme for data-sb-theme
  let resolved = theme
  if (theme === 'system') {
    resolved =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  }

  const forcePrototype = forcedTarget === 'prototype'
  const forceToolbar = forcedTarget === 'toolbar'

  const prototypeTheme = forcePrototype
    ? resolved
    : (syncTargets.prototype ? resolved : 'light')
  const toolbarTheme = forceToolbar
    ? resolved
    : (syncTargets.toolbar ? resolved : 'light')
  const codeTheme = syncTargets.codeBoxes ? resolved : 'light'
  const canvasTheme = syncTargets.canvas ? resolved : 'light'

  el.setAttribute('data-sb-theme', prototypeTheme)
  el.setAttribute('data-sb-toolbar-theme', toolbarTheme)
  el.setAttribute('data-sb-code-theme', codeTheme)
  el.setAttribute('data-sb-canvas-theme', canvasTheme)

  if (theme === 'system' && syncTargets.prototype) {
    el.setAttribute('data-color-mode', 'auto')
    el.setAttribute('data-light-theme', 'light')
    el.setAttribute('data-dark-theme', 'dark')
  } else if (prototypeTheme.startsWith('dark')) {
    el.setAttribute('data-color-mode', 'dark')
    el.setAttribute('data-dark-theme', prototypeTheme)
    el.setAttribute('data-light-theme', 'light')
  } else {
    el.setAttribute('data-color-mode', 'light')
    el.setAttribute('data-light-theme', prototypeTheme)
    el.setAttribute('data-dark-theme', 'dark')
  }
}

/**
 * Inject the compiled UI stylesheet if not already present.
 * In the source repo, Vite bundles this CSS into the ui-entry chunk
 * automatically, so this is a no-op. In consumer repos it loads the
 * pre-compiled dist/storyboard-ui.css.
 */
async function injectUIStyles() {
  if (document.querySelector('[data-storyboard-ui-css]')) return

  // If the styles are already present from Vite's CSS code-splitting,
  // skip the redundant import.
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--sb--bg')
    if (val && val.trim()) return
  } catch { /* fall through */ }

  try {
    // Dynamic import of CSS — Vite handles this as a side-effect import.
    // In consumer repos: loads dist/storyboard-ui.css
    // In source repo: Vite injects component styles via HMR
    await import('@dfosco/storyboard-core/ui-runtime/style.css')
  } catch {
    // Graceful fallback — CSS may already be loaded by other means
  }
}

/**
 * Mount the full storyboard core system.
 *
 * @param {object} [config={}] - Contents of storyboard.config.json
 * @param {object} [options={}]
 * @param {string} [options.basePath='/'] - Base URL path (e.g. import.meta.env.BASE_URL)
 * @param {HTMLElement} [options.container=document.body] - Where to mount devtools
 * @param {Record<string, () => Promise<any>>} [options.handlers={}] - Custom tool handlers (key → lazy loader)
 */
export async function mountStoryboardCore(config = {}, options = {}) {
  if (_mounted) return
  _mounted = true

  const basePath = options.basePath || '/'
  const customHandlers = options.handlers || {}

  // Migrate renamed localStorage keys (4.3.0: viewfinder → workspace)
  migrateLocalStorageKeys()

  // Apply saved chrome-hidden state immediately — before React mount
  applyEarlyChromeState()

  // Apply saved theme to DOM immediately — before React mount
  applyEarlyTheme()

  // Initialize framework-agnostic systems
  installHideParamListener()
  installHistorySync()
  installBodyClassSync()
  installChromeStatePersistence()

  // Initialize config-driven systems.
  // The unified config store is already seeded by the virtual module's initConfig().
  // Individual stores are initialized here for backward compatibility — consumers
  // that import directly from these stores still work.
  const uc = getConfig()

  if (uc.featureFlags && Object.keys(uc.featureFlags).length > 0) {
    initFeatureFlags(uc.featureFlags)
  } else if (config.featureFlags) {
    initFeatureFlags(config.featureFlags)
  }

  if (uc.plugins && Object.keys(uc.plugins).length > 0) {
    initPlugins(uc.plugins)
  } else if (config.plugins) {
    initPlugins(config.plugins)
  }

  if (uc.ui && Object.keys(uc.ui).length > 0) {
    initUIConfig(uc.ui)
  } else if (config.ui) {
    initUIConfig(config.ui)
  }

  if (uc.canvas && Object.keys(uc.canvas).length > 0) {
    initCanvasConfig(uc.canvas)
  } else if (config.canvas) {
    initCanvasConfig(config.canvas)
  }

  // Load and merge command palette config.
  // If the unified store has commandPalette data, use it directly.
  // Otherwise fall back to legacy merging with bundled defaults.
  const ucCmdPalette = uc.commandPalette
  if (ucCmdPalette && Object.keys(ucCmdPalette).length > 0) {
    initCommandPaletteConfig(ucCmdPalette)
  } else {
    const defaultCmdPaletteConfig = (await import('../commandpalette.config.json')).default
    if (config.commandPalette) {
      const merged = { ...defaultCmdPaletteConfig, ...config.commandPalette }
      if (config.commandPalette.sections && defaultCmdPaletteConfig.sections) {
        const clientIds = new Set(config.commandPalette.sections.map(s => s.id))
        const preserved = defaultCmdPaletteConfig.sections.filter(s => !clientIds.has(s.id))
        merged.sections = [...config.commandPalette.sections, ...preserved]
      }
      initCommandPaletteConfig(merged)
    } else {
      initCommandPaletteConfig({ ...defaultCmdPaletteConfig })
    }
  }

  // Initialize customer mode config
  if (uc.customerMode && Object.keys(uc.customerMode).length > 0) {
    initCustomerModeConfig(uc.customerMode)
  } else if (config.customerMode) {
    initCustomerModeConfig(config.customerMode)
  }

  // Initialize comments config (framework-agnostic)
  const commentsConfig = uc.comments && Object.keys(uc.comments).length > 0 ? uc.comments : config.comments
  if (commentsConfig) {
    initCommentsConfig({ ...config, comments: commentsConfig }, { basePath })
  }

  // Inject compiled UI styles (await to prevent late restyle / FOUC)
  await injectUIStyles()

  // Load toolbar config from the unified store.
  // The unified store already has core defaults merged with client overrides.
  // Fall back to legacy merging if unified store wasn't seeded.
  const { deepMerge } = await import('@dfosco/storyboard-core')
  let toolbarConfig = uc.toolbar && Object.keys(uc.toolbar).length > 0
    ? { ...uc.toolbar }
    : null

  if (!toolbarConfig) {
    // Legacy path: unified store not seeded, merge manually
    const defaultConfig = (await import('../toolbar.config.json')).default
    const clientOverrides = consumeClientToolbarOverrides()
    const explicitToolbar = config.toolbar

    if (explicitToolbar && clientOverrides) {
      toolbarConfig = deepMerge(deepMerge(defaultConfig, clientOverrides), explicitToolbar)
    } else if (explicitToolbar) {
      toolbarConfig = deepMerge(defaultConfig, explicitToolbar)
    } else if (clientOverrides) {
      toolbarConfig = deepMerge(defaultConfig, clientOverrides)
    } else {
      toolbarConfig = { ...defaultConfig }
    }
  }

  // Inject repository URL into the toolbar config
  const repo = uc.repository || config.repository
  if (repo?.owner && repo?.name) {
    const repoUrl = `https://github.com/${repo.owner}/${repo.name}`

    // New tools schema
    if (toolbarConfig.tools?.repository) {
      toolbarConfig.tools.repository.url = repoUrl
    }

    // Legacy menus schema
    const commandMenu = toolbarConfig.menus?.command
    if (commandMenu?.actions) {
      const repoAction = commandMenu.actions.find(a => a.id === 'core/repository')
      if (repoAction) repoAction.url = repoUrl
    }
  }

  // Seed the reactive toolbar config store (core → custom merge)
  initToolbarConfig(toolbarConfig)

  // Skip all UI mounting when loaded inside a prototype embed iframe
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('_sb_embed')
  if (isEmbed) {
    // Broadcast route and hash changes to the parent canvas via postMessage
    if (window.parent !== window) {
      let lastHref = window.location.pathname + window.location.hash
      function broadcastNavigation() {
        const currentHref = window.location.pathname + window.location.hash
        if (currentHref !== lastHref) {
          lastHref = currentHref
          const basePath = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
          const pathname = window.location.pathname
          const hash = window.location.hash
          const stripped = basePath && pathname.startsWith(basePath)
            ? pathname.slice(basePath.length) || '/'
            : pathname.replace(/^\/branch--[^/]+/, '') || '/'
          const src = stripped + hash
          window.parent.postMessage({ type: 'storyboard:embed:navigate', src }, '*')
        }
      }
      // Intercept pushState/replaceState, popstate, and hashchange
      const origPush = history.pushState.bind(history)
      const origReplace = history.replaceState.bind(history)
      history.pushState = (...args) => { origPush(...args); broadcastNavigation() }
      history.replaceState = (...args) => { origReplace(...args); broadcastNavigation() }
      window.addEventListener('popstate', broadcastNavigation)
      window.addEventListener('hashchange', broadcastNavigation)
    }

    // Forward cmd+wheel events to parent so canvas zoom works while
    // an iframe is focused. The parent's wheel handler on `document`
    // can't see events fired inside the iframe's document.
    if (window.parent !== window) {
      document.addEventListener('wheel', (e) => {
        if (!e.metaKey && !e.ctrlKey) return
        e.preventDefault()
        window.parent.postMessage({
          type: 'storyboard:embed:wheel',
          deltaY: e.deltaY,
          clientX: e.clientX,
          clientY: e.clientY,
        }, '*')
      }, { passive: false })
    }

    return
  }

  // Dynamically import the compiled UI bundle.
  // Uses the package self-reference so resolution differs by context:
  //   Source repo: Vite alias overrides to src/ui-entry.js (source, HMR)
  //   Consumer repos: package.json exports resolve to dist/storyboard-ui.js (compiled)
  const ui = await import('@dfosco/storyboard-core/ui-runtime')

  // Mount devtools (CoreUIBar)
  await ui.mountDevTools({
    container: options.container,
    basePath,
    toolbarConfig,
    customHandlers,
  })

  // Mount comments system if configured
  if (isCommentsEnabled()) {
    ui.mountComments()
  }

  // Show pending workshop notifications (e.g. canvas created before Vite reload)
  showPendingNotification(basePath)

  // Handle pending navigation (e.g. after PageSelector created a new canvas page)
  handlePendingNavigation()
}

/**
 * Check sessionStorage for a pending navigation target.
 * Used by PageSelector when creating a new canvas page — Vite does a full-reload
 * after detecting the new file, so we stash the target URL and navigate after reload.
 */
function handlePendingNavigation() {
  try {
    const target = sessionStorage.getItem('sb-pending-navigate')
    if (!target) return
    sessionStorage.removeItem('sb-pending-navigate')
    window.location.href = target
  } catch { /* ignore */ }
}

/**
 * Check sessionStorage for a pending workshop creation notification.
 * Vite does a full-reload when new files are created, so the create form's
 * success message is lost. This shows a temporary toast with the link.
 */
function showPendingNotification(basePath) {
  const KEYS = ['sb-canvas-created', 'sb-prototype-created', 'sb-flow-created', 'sb-story-created']
  for (const key of KEYS) {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      sessionStorage.removeItem(key)
      const { success: message, route, path: filePath } = JSON.parse(raw)
      if (!message) continue
      // Skip toast if we're already on the created page
      if (route) {
        const currentPath = window.location.pathname
        const fullRoute = route.startsWith('/') ? (basePath.replace(/\/$/, '') + route) : route
        if (currentPath === fullRoute || currentPath === fullRoute + '/') continue
      }
      showToast(message, route, basePath, filePath)
      return
    } catch { /* ignore malformed session entry */ }
  }
}

function showToast(message, route, basePath, filePath) {
  const toast = document.createElement('div')
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '7rem',
    right: '1.5rem',
    zIndex: '10000',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: 'var(--sb--color-popover, #fff)',
    color: 'var(--sb--color-foreground, #1e293b)',
    fontSize: '0.8125rem',
    fontFamily: "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    border: '1px solid var(--sb--color-border, #cbd5e1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    opacity: '0',
    transition: 'opacity 0.15s ease',
    maxWidth: '320px',
  })

  const href = route?.startsWith('/') ? (basePath.replace(/\/$/, '') + route) : route
  let html = `<span style="font-weight:500">✓ ${message.replace(/</g, '&lt;')}</span>`
  if (href) {
    html += `<a href="${href}" style="color:var(--sb--color-primary, #0969da);text-decoration:underline;font-size:0.8125rem">Open canvas</a>`
  }
  if (filePath) {
    html += `<span style="font-size:0.75rem;color:var(--sb--color-muted, #64748b)">To edit your component, go to <code style="background:var(--sb--color-muted-bg, #f1f5f9);padding:1px 4px;border-radius:3px;font-size:0.75rem">${filePath.replace(/</g, '&lt;')}</code></span>`
  }
  toast.innerHTML = html

  document.body.appendChild(toast)
  requestAnimationFrame(() => { toast.style.opacity = '1' })

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 8000)
}
