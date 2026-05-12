---
"@dfosco/storyboard": patch
---

Terminal font-loading fix

- fix(terminal): await `document.fonts.ready` before initializing the ghostty atlas, so glyphs render with correct metrics instead of falling back when web fonts swap in
