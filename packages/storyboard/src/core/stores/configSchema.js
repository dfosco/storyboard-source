/**
 * Config Schema — canonical shape and defaults for storyboard.config.json.
 *
 * Every consumer of storyboard.config.json should import `getConfig()` to get
 * a fully defaulted, validated config object. New keys added here are safe for
 * existing projects — they always have defaults.
 *
 * @module configSchema
 */

/**
 * @typedef {object} PasteRule
 * @property {string} match    — regex string tested against pasted URLs
 * @property {string} widget   — widget type to create (e.g. "figma-embed", "link-preview")
 * @property {Record<string, string>} [propsMap] — static props merged into widget props
 */

/**
 * @typedef {object} CanvasTerminalConfig
 * @property {boolean} [resizable]   — whether terminal widgets can be resized (default false)
 * @property {number}  [defaultWidth]  — default width for new terminal widgets
 * @property {number}  [defaultHeight] — default height for new terminal widgets
 * @property {number}  [fontSize]    — terminal font size
 * @property {string}  [fontFamily]  — terminal font family
 * @property {string}  [prompt]      — shell prompt string
 * @property {string|null} [startupCommand] — skip welcome screen: "copilot", "shell", or a custom command. null shows welcome.
 * @property {object|null} [defaultStartupSequence] — sequence of steps to run after terminal opens
 */

/**
 * @typedef {object} CanvasZoomConfig
 * @property {number} min  — minimum zoom percentage (default 10)
 * @property {number} max  — maximum zoom percentage (default 250)
 * @property {number} step — zoom increment/decrement step (default 10)
 */

/**
 * @typedef {object} CanvasConfig
 * @property {PasteRule[]} pasteRules       — URL→widget conversion rules (evaluated in order, first match wins)
 * @property {{ embedBehavior: string, ghGuard: string }} github — GitHub-specific embed settings
 * @property {CanvasTerminalConfig} [terminal] — terminal widget settings
 * @property {Record<string, CanvasAgentConfig>} [agents] — per-agent overrides
 * @property {CanvasZoomConfig} [zoom] — zoom min/max/step settings
 */

/**
 * @typedef {object} CanvasAgentConfig
 * @property {string}  [label]         — display label
 * @property {string}  [icon]          — icon name
 * @property {string}  [startupCommand] — command to run on startup
 * @property {string}  [resumeCommand]  — command to browse/resume existing sessions (e.g. "copilot --resume")
 * @property {string}  [postStartup]   — command sent after agent readiness (e.g. "/allow-all on")
 * @property {string}  [readinessSignal] — tmux pane text that signals the agent is ready (fragile, prefer readinessFile)
 * @property {boolean} [readinessFile]  — use a file-based SessionStart hook for readiness (writes --settings with hook, polls for signal file)
 * @property {boolean} [resizable]     — override terminal resizability for this agent
 * @property {number}  [defaultWidth]  — override default width
 * @property {number}  [defaultHeight] — override default height
 */

/**
 * @typedef {object} HotPoolConfig
 * @property {boolean} [enabled]       — enable/disable all pools (default: true)
 * @property {boolean} [verbose]       — log to Vite terminal (default: false)
 * @property {number}  [default_pool_size]     — default baseline per pool (default: 1)
 * @property {number}  [default_max_pool_size] — default surge cap per pool (default: 3)
 * @property {boolean} [load_balancer] — enable auto-scaling (default: true)
 * @property {number}  [load_balancer_cooldown_mins] — minutes idle before scale-down (default: 10)
 * @property {Record<string, { pool_size?: number, max_pool_size?: number, webgl_ready_slots?: number }>} [pools] — per-pool overrides (terminal, prompt, copilot, claude, codex). webgl_ready_slots: how many front-of-queue sessions should start with PINNED WebGL priority (default: 0)
 */

/**
 * @typedef {object} CommandPaletteConfig
 * @property {string[]} providers — provider IDs to enable
 * @property {string}   ranking   — result ranking strategy
 * @property {CommandPaletteSection[]} [sections] — declarative palette sections
 */

/**
 * @typedef {object} CommandPaletteSection
 * @property {string}  id       — unique section identifier
 * @property {string}  [title]  — section heading in the palette
 * @property {string}  [type]   — "tool-menu" for sub-page entries
 * @property {string}  [label]  — display label (for tool-menu entries)
 * @property {string[]} [keywords] — search keywords
 * @property {CommandPaletteSectionItem[]} [items]   — static entries
 * @property {string}  [source] — dynamic data source: "canvases" | "prototypes" | "stories"
 * @property {string}  [order]  — ordering: "recent" | "alphabetical" | "recent-changes"
 * @property {number}  [limit]  — max items from dynamic source
 * @property {CommandPaletteOption[]} [options] — sub-page options (for tool-menu type)
 */

/**
 * @typedef {object} CommandPaletteSectionItem
 * @property {string} type     — "link" | "action"
 * @property {string} label    — display text
 * @property {string} [url]    — navigation URL (for links)
 * @property {string} [action] — command action ID (for actions)
 * @property {string[]} [keywords] — search keywords
 */

/**
 * @typedef {object} CommandPaletteOption
 * @property {string} label   — display text
 * @property {string} action  — command action ID
 * @property {*}      [value] — action payload
 */

/**
 * @typedef {object} CustomerModeConfig
 * @property {boolean} enabled       — master toggle for customer mode
 * @property {boolean} hideChrome    — hides all toolbars (except canvas tools), branchbar, cmd+k, cmd+.
 * @property {boolean} hideHomepage  — removes the storyboard homepage (leaves empty page)
 * @property {string}  protoHomepage — internal /path that replaces homepage; redirects from / and /workspace
 */

/**
 * @typedef {object} StoryboardConfig
 * @property {string}   [customDomain]
 * @property {string}   [devDomain]
 * @property {string}   [devDomainColor] — CSS color for the BranchBar in local dev (default: blue)
 * @property {{ owner: string, name: string }} [repository]
 * @property {{ enabled: boolean }} [modes]
 * @property {{ discussions: { category: string } }} [comments]
 * @property {Record<string, boolean>} [plugins]
 * @property {{ enabled?: boolean, features?: Record<string, boolean>, partials?: Array }} [workshop]
 * @property {Record<string, boolean>} [featureFlags]
 * @property {{ hide?: string[] }} [ui]
 * @property {object}   [toolbar]
 * @property {CanvasConfig} [canvas]
 * @property {HotPoolConfig} [hotPool]
 * @property {CommandPaletteConfig} [commandPalette]
 * @property {CustomerModeConfig} [customerMode]
 */

/** Built-in paste rules shipped with storyboard. */
export const builtinPasteRules = [
  {
    id: 'figma',
    match: 'https?://(?:www\\.)?figma\\.com/',
    widget: 'figma-embed',
    propsMap: { width: 800, height: 450 },
  },
]

/** Default config values. Every key here is safe to access without null checks. */
export const configDefaults = {
  customDomain: '',
  devDomain: '',
  devDomainColor: '',
  repository: { owner: '', name: '' },
  modes: { enabled: false },
  comments: { discussions: { category: 'Comments' } },
  plugins: {},
  workshop: {
    enabled: false,
    features: { createPrototype: true, createFlow: true, createCanvas: true },
  },
  featureFlags: {},
  ui: {},
  toolbar: {},
  canvas: {
    pasteRules: builtinPasteRules,
    github: {
      embedBehavior: 'link-preview', // "link-preview" | "rich-embed"
      ghGuard: 'copy',               // "copy" | "link" | "off"
    },
    zoom: {
      min: 10,
      max: 250,
      step: 10,
    },
    terminal: {
      resizable: false,
      defaultWidth: 800,
      defaultHeight: 450,
    },
  },
  commandPalette: {
    providers: ['prototypes', 'flows', 'canvases', 'pages'],
    ranking: 'frecency',
    sections: [],
  },
  customerMode: {
    enabled: false,
    hideChrome: false,
    hideHomepage: false,
    protoHomepage: '',
  },
}

/**
 * Deep-merge helper that replaces arrays instead of concatenating.
 * Objects are recursively merged; all other values are overwritten.
 */
function mergeConfig(defaults, overrides) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return overrides ?? defaults
  }
  const result = { ...defaults }
  for (const key of Object.keys(overrides)) {
    const val = overrides[key]
    if (val === undefined) continue
    if (Array.isArray(val)) {
      // Arrays replace (e.g. pasteRules, providers) — no concat
      result[key] = val
    } else if (val && typeof val === 'object' && !Array.isArray(val) && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = mergeConfig(defaults[key], val)
    } else {
      result[key] = val
    }
  }
  return result
}

/**
 * Return a fully defaulted config by merging user-provided values over defaults.
 * Safe to call with an empty object or undefined — returns full defaults.
 *
 * @param {Partial<StoryboardConfig>} [raw={}]
 * @returns {StoryboardConfig}
 */
export function getConfig(raw = {}) {
  return mergeConfig(configDefaults, raw)
}

/**
 * Return a copy of the bare defaults (no user overrides).
 * @returns {StoryboardConfig}
 */
export function getConfigDefaults() {
  return JSON.parse(JSON.stringify(configDefaults))
}
