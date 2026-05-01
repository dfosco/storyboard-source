# 08 — Migrate Viewfinder Page to React

**Clips:** `#g087` (UI migration)

**Goal:** Move the Viewfinder (prototype index/listing page) from Svelte to React. Only the CoreUI overlay bar and its tools remain in Svelte — they interact with prototype React code at the DOM level and must stay isolated.

---

## Rationale

The Viewfinder page lists all prototypes, canvases, and external prototypes. It currently lives in the Svelte layer alongside CoreUI, but it doesn't need to interact with prototype DOM or storyboard core internals. Moving it to React:

- Aligns it with the rest of the app pages (canvas, prototype pages are already React)
- Enables use of Primer React components and CSS Modules consistently
- Removes a Svelte↔React boundary that adds complexity without benefit
- Keeps the Svelte boundary clean: **CoreUI bar + tools only** (inspector, comments, devtools, mode switcher — things that must overlay and introspect prototype DOM)

---

## Scope

### Migrate to React
- Viewfinder page layout (grid/list of prototypes)
- Prototype cards (title, author, description, tags, external badge)
- Search/filter UI
- Grouping by `.folder` directories
- "New prototype" / workshop actions (if present in Viewfinder)

### Keep in Svelte (no changes)
- CoreUIBar and all toolbar buttons/menus
- Inspector panel, side panel, docs panel
- Mode switcher, comment overlay
- Any tool handler that touches prototype DOM




---

## Implementation Notes

- Viewfinder should use BaseUI components in place of custom CSS implementation
- Keep features and design the same for now, I will re-design later
- The Viewfinder data (prototype list, metadata) is already available via the Vite data plugin virtual module — React can import it directly
- Route should remain at the same URL (root `/` or viewfinder path)
- Must handle null/undefined gracefully for all prototype metadata fields
- Branch URL support: respect `VITE_BASE_PATH` in any prototype links

---

## Dependencies

- No hard dependency on other 4.0 features
- Can run in parallel with paste rules, sticky markdown, widget mode system
