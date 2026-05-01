# Plan: Replace react-cmdk with cmdk

## Goals

1. Replace `react-cmdk` with `cmdk` (by Vercel/pacocoursey) so keyboard navigation works natively with React 19
2. Preserve all existing command palette functionality: search, groups, separators, sub-pages, author search, theme checkmarks, toggle items, create actions

## Approach

- Install `cmdk` package, remove `react-cmdk`
- Rewrite `CommandPalette.jsx` render to use `<Command.Dialog>`, `<Command.Input>`, `<Command.List>`, `<Command.Group>`, `<Command.Item>`, `<Command.Separator>`
- `cmdk` handles filtering natively via `value` prop — remove `filterItems`/`getItemIndex`
- `cmdk` handles keyboard nav natively — no custom handlers needed
- Keep all business logic (buildPaletteItems, event listeners, etc.) unchanged
- Update CSS to style cmdk components instead of react-cmdk classes
- Sub-pages (tool menus) use state-based page switching with conditional rendering

## Files to change

- `packages/react/package.json` — swap dep
- `package.json` — swap dep  
- `packages/react/src/CommandPalette/CommandPalette.jsx` — rewrite render
- `packages/react/src/CommandPalette/command-palette.css` — restyle for cmdk

## Steps

1. Install cmdk, remove react-cmdk from both package.json files
2. Rewrite the JSX render section to use cmdk components
3. Remove filterItems/getItemIndex — cmdk filters internally
4. Map item `keywords` + `children` text to cmdk `value` prop for search
5. Rewrite CSS for cmdk's class structure
6. Build and test
