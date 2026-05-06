---
"@dfosco/storyboard": patch
---

Smart connector anchors + reduced curve bounciness

- Auto-calculate optimal connector anchors in API/CLI — no manual `--start-anchor`/`--end-anchor` needed
- Reduce Bézier curve bounciness when widgets are close together
- Use minimum axis distance for scaling — prevents S-curves on vertically/horizontally aligned widgets
