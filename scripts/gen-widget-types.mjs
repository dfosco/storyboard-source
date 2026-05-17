#!/usr/bin/env node
// Regenerate .agents/data/widget-types.json from the canvas widget registry.
// Run after adding/removing/renaming widget types.
import fs from 'node:fs'
import path from 'node:path'

const REGISTRY_PATH = 'packages/storyboard/src/internals/canvas/widgets/index.js'

const src = fs.readFileSync(REGISTRY_PATH, 'utf8')

// Parse the `widgetRegistry` object literal — entries look like:
//   'sticky-note': StickyNote,
const registryMatch = src.match(/export const widgetRegistry = \{([\s\S]*?)\}/m)
if (!registryMatch) {
  console.error(`Could not parse widgetRegistry from ${REGISTRY_PATH}`)
  process.exit(1)
}

const entries = []
for (const line of registryMatch[1].split('\n')) {
  const m = line.match(/^\s*['"]?([\w-]+)['"]?\s*:\s*(\w+)\s*,?/)
  if (m) entries.push({ type: m[1], component: m[2] })
}

// Hand-curated metadata (props + when-to-use) keyed by widget type.
// Update this map when adding new types or props.
const META = {
  'sticky-note': {
    contentProp: 'text',
    otherProps: ['color', 'width', 'height'],
    defaultSize: '270×170',
    description: 'Short note or label. Use for instructions, todos, or ideation.',
  },
  'markdown': {
    contentProp: 'content',
    otherProps: ['width'],
    defaultSize: '530×240',
    description: 'Rich text block. Use for prose, specs, documentation, or summaries.',
  },
  'prototype': {
    contentProp: 'src',
    otherProps: ['label', 'zoom', 'width', 'height'],
    defaultSize: '800×600',
    description: 'Embeds a prototype page from src/prototypes via iframe.',
  },
  'figma-embed': {
    contentProp: 'url',
    otherProps: ['width', 'height'],
    defaultSize: '800×450',
    description: 'Embeds a Figma file/frame URL.',
  },
  'codepen-embed': {
    contentProp: 'url',
    otherProps: ['width', 'height'],
    defaultSize: '800×450',
    description: 'Embeds a CodePen URL.',
  },
  'story': {
    contentProp: 'storyId + exportName',
    otherProps: ['width', 'height', 'showCode'],
    defaultSize: '780×420',
    description:
      'Renders ONE named export from a .story.jsx file. Use for showing a single component variant.',
    preferOver: null,
    avoidWhen:
      'You want to show MULTIPLE variants/exports of the same story file — use `component-set` instead to render all exports in a single grid iframe.',
  },
  'component-set': {
    contentProp: 'storyId',
    otherProps: ['layout (auto|wide|tall)', 'selected', 'density', 'width', 'height'],
    defaultSize: '780×420 (auto-sized from content)',
    description:
      'Renders ALL named exports of a .story.jsx file in a single grid iframe. The user can select a cell to inspect it. ONE widget shows N variants.',
    preferOver:
      'PREFER this over N `story` widgets when the user asks for "variants", "a component set", "all variants of X", "a showcase", or anything implying multiple exports of the same story file. Faster (one iframe vs N), tidier on canvas, and supports selection.',
  },
  'image': {
    contentProp: 'src (filename)',
    otherProps: ['width', 'height', 'private'],
    defaultSize: '400×300',
    description:
      'Renders an image from /assets/canvas/images/{src}. Use for screenshots, references, mockups.',
  },
  'link-preview': {
    contentProp: 'url',
    otherProps: ['title'],
    defaultSize: '320×200',
    description: 'OG-style preview card for an external URL.',
  },
  'terminal': {
    contentProp: '—',
    otherProps: ['prettyName', 'alias'],
    defaultSize: '650×500',
    description: 'Live terminal session (xterm). Created by user via canvas UI.',
  },
  'terminal-read': {
    contentProp: '—',
    otherProps: ['width', 'height'],
    defaultSize: '650×500',
    description: 'Read-only view of another terminal\'s buffer.',
  },
  'agent': {
    contentProp: '—',
    otherProps: ['prettyName', 'alias', 'agentId'],
    defaultSize: '650×500',
    description: 'Agent session (Copilot/Codex/etc.) — same widget as terminal, configured as an agent.',
  },
  'prompt': {
    contentProp: 'text',
    otherProps: ['agentId', 'autoRun'],
    defaultSize: '400×200',
    description:
      'A reusable prompt that can spawn an agent session. Use for canned actions or task templates.',
  },
  'tiles': {
    contentProp: '—',
    otherProps: ['tiles[]', 'columns', 'width', 'height'],
    defaultSize: '600×400',
    description: 'Grid of small content tiles. Use for dashboards or option grids.',
  },
}

const widgets = entries.map(({ type, component }) => ({
  type,
  component,
  ...(META[type] || {
    contentProp: '?',
    otherProps: [],
    defaultSize: '?',
    description: 'No metadata — update scripts/gen-widget-types.mjs META map.',
  }),
}))

// Decision rules — surfaced verbatim to agents.
const decisionRules = [
  'If you are about to create 2+ `story` widgets that share the same `storyId`, STOP and use a single `component-set` widget instead.',
  'If the user says "variants", "component set", "showcase", "all exports of X", or "every variant" → use `component-set`, NOT multiple `story` widgets.',
  'If the user wants to show a single specific component variant → use `story` with both `storyId` and `exportName`.',
  'If you do not know the exact `type` string for what you are creating, look it up in this file. Never invent type strings.',
  'Always pass props matching `contentProp` (and any required props) when creating a widget — empty widgets are useless on the canvas.',
]

const out = {
  source: REGISTRY_PATH,
  generatedAt: new Date().toISOString(),
  count: widgets.length,
  note:
    'Authoritative list of canvas widget types. ONLY use type strings present in this list. Regenerate via: node scripts/gen-widget-types.mjs',
  decisionRules,
  widgets,
}

fs.mkdirSync('.agents/data', { recursive: true })
fs.writeFileSync('.agents/data/widget-types.json', JSON.stringify(out, null, 2) + '\n')
console.log(`wrote ${widgets.length} widget types`)

// Warn if registry has types missing from META
const missing = widgets.filter((w) => !META[w.type])
if (missing.length) {
  console.warn(`\n⚠️  Missing META entries for: ${missing.map((m) => m.type).join(', ')}`)
  console.warn('   Add them to META in scripts/gen-widget-types.mjs')
  process.exitCode = 1
}
