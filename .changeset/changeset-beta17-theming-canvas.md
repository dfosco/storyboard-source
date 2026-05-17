---
"@dfosco/storyboard": patch
---

Theming, canvas, terminal, and dev UX fixes:

-   **Theming**: new tailwind ↔ primer adapter; canvas theme propagation across prototype iframes (cross-frame storage sync, pre-paint sets all four Primer attributes); state-driven disabled CTA colors; signup prototype controls are now theme-aware.
-   **ChartSet**: per-entry colors for bar/scatter/bubble using a cycled categorical palette; per-entry colors only on the Bubble selected variant. `component-set.selected` is documented as a hint, not a hard scope.
-   **Canvas**: story/component-set iframes now HMR on source edits; hub fan-out cascades vertically instead of rightward; collision cascade spacing honors `--gap` (not just the initial offset).
-   **Terminal**: frozen overlay fallback when browser WebGL is exhausted; retry Enter after injecting text until the TUI input clears; freshly-spawned widgets are pinned for 5s to bypass the pool cap; pool gating disabled — every terminal is always live.
-   **Dev server**: chokidar hard-ignores runtime-state dirs (no more spurious restarts); reload-guard lets HMR module updates through; `canvas-auto-reload` and `prototype-auto-reload` toggles take effect at runtime.
-   **StartupSignup**: darker success card surface, improved contrast, preserved branding space-between, testimonial stays visible in iframe.
-   **CLI**: `agent signal` tries registry/config/env URLs in order before failing.
-   **Command palette**: checkmark is flush-right on “Hide toolbars”.
