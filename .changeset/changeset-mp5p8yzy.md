---
"@dfosco/storyboard": patch
---

- data-plugin: ignore nested `worktrees/**` directories (in addition to `.worktrees/**`) so git worktrees inside the project root no longer cause "Duplicate object" build errors
- dev CLI: surface vite stderr when the dev server exits before becoming ready, instead of swallowing it behind a generic "exited (code 1)" message
