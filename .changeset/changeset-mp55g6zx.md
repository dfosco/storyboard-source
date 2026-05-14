---
"@dfosco/storyboard": patch
---

Fix prompt widget getting stuck on "pending" when the agent-status WS event is missed (background tab, page navigation, HMR reconnect, page reload). PromptWidget now polls the persisted agent status from `.storyboard/terminals/{id}.json` on mount and every 5s while pending, applying terminal states (done/error/cancelled) as a safety net behind the live WS event.
