---
"@dfosco/storyboard": patch
---

Enhanced setup and new `run` command

- Add `sb run` command (combines proxy start + dev in one)
- Setup now installs Git via brew (bypasses Xcode CLT)
- Setup now installs Copilot CLI automatically
- Add `--nuke` flag to output machine cleanup commands
- Wire unified artifact API across all creation surfaces
- Fix durable hub message delivery for unbound agents
