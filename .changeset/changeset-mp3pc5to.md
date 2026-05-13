---
"@dfosco/storyboard": patch
---

**feat(data): tilde-prefixed canvases & prototypes are now dev-only, not hidden.** `~name.canvas.jsonl`, `~ProtoName/` folders, and `~name.{flow,object,record,prototype,folder}.json` files are loaded by the dev server (visible in viewfinder, accessible via routes) but excluded from `npm run build`. They're also added to `.gitignore` by `npx storyboard setup` so they don't get committed. Use this for local-only experiments and scratch canvases that you don't want to push.
