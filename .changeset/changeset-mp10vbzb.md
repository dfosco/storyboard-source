---
"@dfosco/storyboard": patch
---

fix(build): include dist/runtime/ in published tarball

alpha.21 was published without `dist/runtime/`, so consumers hit
`Cannot find module '.../dist/runtime/client/index.js'` as soon as the
CLI tried to talk to the runtime daemon. `prepublishOnly` now also
runs `build:runtime`.
