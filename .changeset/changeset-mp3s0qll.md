---
"@dfosco/storyboard": patch
---

Preserve runtime daemon when starting a second `sb dev` from a repo with a different installed `@dfosco/storyboard` version.

- Fix: `RuntimeClient.health()` no longer SIGTERMs the shared daemon on version mismatch when other dev servers are active. Multi-repo coexistence is the whole point of the daemon — killing it tore down every Vite child it owned, including unrelated repos.
