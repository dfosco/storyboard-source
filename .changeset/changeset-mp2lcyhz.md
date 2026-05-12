---
"@dfosco/storyboard": patch
---

Fix deletion rollbacks on canvas

- fix(canvas): don't re-add locally deleted widgets via HMR merge — pending deletions are tracked and skipped during reconcile, eliminating the visible rollback when deleting multiple widgets in quick succession
