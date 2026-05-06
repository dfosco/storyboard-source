---
"@dfosco/storyboard": patch
---

Fix all lint errors for CI

- Fix unused variable warnings in cli/run.js, publish.js, pull.js
- Fix `cmdk-overlay` and `cmdk-dialog` unknown property errors (use `data-` prefix)
- Fix "cannot access refs during render" in PrototypeEmbed.jsx
- Add eslint-disable comments for intentionally unused code
