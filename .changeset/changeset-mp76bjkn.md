---
"@dfosco/storyboard": patch
---

Scaffold now includes `canvas.agents` defaults so freshly-scaffolded projects get Copilot/Claude/Codex auto-resume wiring out of the box (with `resumeCommand` + `{id}`, `sessionIdEnv`, `sessionStateGlob`). Existing projects still migrate via the migrate skill.
