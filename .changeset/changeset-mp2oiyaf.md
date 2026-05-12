---
"@dfosco/storyboard": patch
---

Story/StorySet immersive expand + inspector precision.

- Alt + click the expand button on Story and StorySet widgets to open in immersive fullscreen (no chrome). Plain click still opens the modal variant.
- Inspector now uses the clicked element's `_debugSource` for jump-to-line, so it lands on the exact JSX line you clicked instead of the enclosing component definition. Also fixes a scroll-to-line offset bug in the inspector code panel.
