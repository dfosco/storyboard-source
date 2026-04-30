---
"@dfosco/storyboard-core": patch
---

Fix dev server startup crash caused by orphaned debug code

- Fix `SyntaxError: Unexpected token ':'` on `npm run dev` caused by an incomplete devlog removal in `buildUnifiedConfig` (data-plugin.js)
- Fix terminal snapshots not being emitted in production builds
