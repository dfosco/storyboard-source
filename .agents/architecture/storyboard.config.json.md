# `storyboard.config.json`

<!--
source: storyboard.config.json
category: config
importance: medium
-->

> [← Architecture Index](./architecture.index.md)

## Goal

[`storyboard.config.json`](./storyboard.config.json.md) is the repo's declarative runtime configuration. It centralizes environment identity (`devDomain`, repo metadata), feature flags, workshop defaults, canvas behavior, hot-pool sizing, and customer-mode toggles so app startup code such as [`src/index.jsx`](./src/index.jsx.md) and server/runtime code can consume one shared config object instead of hard-coding behavior.

## Composition

The file is organized as a nested JSON schema rather than executable code. Top-level sections configure deployment identity, UI features, canvas defaults, and agent pools:

```json
{
  "devDomain": "storyboard-core",
  "repository": {
    "owner": "dfosco",
    "name": "storyboard"
  },
  "featureFlags": {
    "show-banner": true
  }
}
```

The `canvas` block is the most operationally important section. It sets zoom constraints, terminal defaults, and the built-in agent definitions that the canvas runtime can spawn:

```json
"canvas": {
  "zoom": { "min": 10, "max": 250, "step": 5 },
  "terminal": {
    "fontSize": 18,
    "prompt": "❯ ",
    "defaultWidth": 1000,
    "defaultHeight": 800
  },
  "agents": {
    "copilot": {
      "startupCommand": "copilot --agent terminal-agent",
      "readinessSignal": "Environment loaded:"
    }
  }
}
```

Other notable sections are `workshop.features` for creation affordances, `hotPool` for prewarmed terminal/agent capacity, and `customerMode` for kiosk-style UI suppression.

## Dependencies

- [`src/index.jsx`](./src/index.jsx.md) imports this file and passes it to Storyboard core at startup.
- [`vite.config.js`](./vite.config.js.md) reads this file through `node:fs` so edits do not restart the whole Vite config process.
- Runtime and server modules such as `packages/storyboard/src/runtime/devserver/orchestrator.ts`, `packages/storyboard/src/runtime/server/http.ts`, `packages/storyboard/src/runtime/schema/identity.ts`, and `packages/storyboard/src/core/vite/docs-handler.js` rely on values defined here.

## Dependents

- [`src/index.jsx`](./src/index.jsx.md) is the direct application bootstrap consumer.
- [`vite.config.js`](./vite.config.js.md) validates and watches the file indirectly via `fs.readFileSync(...)`.
- `packages/storyboard/src/internals/context.jsx`, `packages/storyboard/src/runtime/devserver/orchestrator.ts`, `packages/storyboard/src/runtime/server/http.ts`, `packages/storyboard/src/runtime/vite-plugin/plugin.ts`, and `packages/storyboard/src/core/vite/docs-handler.js` all document or consume settings from this config.

## Notes

- `startupCommand` values for canvas agents are data, not code in this file's context; the runtime decides when and how to execute them.
- `devDomain` is architecturally important because the runtime uses it to avoid local proxy collisions between multiple Storyboard checkouts.
