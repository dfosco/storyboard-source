---
"@dfosco/storyboard": patch
---

fix(runtime): correct daemon binary path + drop legacy setup proxy calls

`RuntimeClient.spawnDaemon` was looking for `bin/runtime.js` (which doesn't exist; the real file is `bin/storyboard-runtime.js`) and was off by one `..` in the resolve path. With `stdio: 'ignore'` no error surfaced — health polling just timed out at 5s. `sb setup` was also calling the deprecated `generateCaddyfile`/`reloadCaddy` stubs (visible as "deprecated" warnings in the output). Both fixed.
