# storyboard

## 1.1.0

### Minor Changes

-   8fe71a2: Performance improvements and major code splitting
-   a7e3049: Add record overrides from URL hash params

    Records can now be overridden and created via URL hash parameters using the `record.{name}.{entryId}.{field}=value` convention. Existing record entries get fields merged on top; unknown entry ids create new entries appended to the collection.

    New exports:

    -   `useRecordOverride(recordName, entryId, field)` — read/write hook for record hash overrides

    Also extracted shared utilities (`setByPath`, `deepClone`, `subscribeToHash`) into reusable modules.

-   Separate storyboard into core/ and internals/ layers

    Split the storyboard system into framework-agnostic and framework-specific layers, moved outside of `src/` to the repo root:

    -   **`storyboard/core/`** — Pure JavaScript data layer with zero framework dependencies. Exports `init()`, scene/record loaders, URL hash session state, dot-notation utilities, and hash change subscription. Can be consumed by any frontend framework.
    -   **`storyboard/internals/`** — React-specific plumbing: context providers, hooks (`useSceneData`, `useOverride`, `useRecord`, etc.), Primer React form components, DevTools, and React Router hash preservation. Replaceable when building non-React frontends.
    -   **`storyboard/vite/`** — Framework-agnostic Vite data plugin. Now calls `core.init()` to seed the data index instead of relying on a direct virtual module import in the loader.

    The `src/` directory now contains only user-facing prototype code (pages, components, templates, data files). All existing import paths updated; barrel `storyboard/index.js` re-exports from both layers for backwards compatibility.

-   4968cc5: Bundle optimizations: pre-parse data at build time, split vendor chunks (react, primer, octicons, reshaped), remove unused Primer theme CSS variants (714KB to 244KB), add changesets for versioning
