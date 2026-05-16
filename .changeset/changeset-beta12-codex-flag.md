---
"@dfosco/storyboard": patch
---

Codex CLI: switch from removed `--full-auto` flag to `--dangerously-bypass-approvals-and-sandbox` (Codex's equivalent of Claude's `--dangerously-skip-permissions`). If you have an older `terminal.config.json` in your project root with `--full-auto`, update it or delete the file to inherit the new library default.
