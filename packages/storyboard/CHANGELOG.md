# @dfosco/storyboard

## 0.5.0-alpha.1

### Patch Changes

-   fix(vite): pre-bundle CJS-only deps (feather-icons, @primer/octicons, ansi-to-html) for consumer apps

## 0.5.0-alpha.0

### Major Changes

-   Unify all packages into a single `@dfosco/storyboard` package

    -   Merge `@dfosco/storyboard-core`, `@dfosco/storyboard-react`, `@dfosco/tiny-canvas`, and `@dfosco/storyboard-react-primer` into `@dfosco/storyboard`
    -   Adopt epoch semver: `0.X.Y` where `0` is epoch, `X` is major, `Y` is minor/patch
    -   Organize core source into logical subdirectories: `ui/`, `stores/`, `session/`, `data/`, `modes/`, `utils/`, `devtools/`
    -   Fix ui-runtime build externalization for self-referential package imports
