---
"@dfosco/storyboard": patch
---

Polish across CLI, canvas, and widgets.

- Every fullscreen/split-screen widget view now persists to the URL hash (deep-linkable)
- AgentsReadyTrigger uses the agents icon and swaps to a spinner while agents are working
- Canvas: new "refresh frame" action; component menu simplified; canvas-add labels stories as "Component" and auto-picks component-set for multi-export stories
- BranchBar: shows the actual project devDomain in worktrees (not the branch name twice) with a stable font-size
- CLI: `sb run` reliably starts the runtime daemon; agent-signal retries transient 404/5xx; spinner messages no longer render double ellipsis
- Workshop: ArtifactForm flash for unknown types is now a warning, not danger; prototype form sends 'partial' instead of 'recipe'
- Component sets: cells fill the widget and respect user resize / cell content size
