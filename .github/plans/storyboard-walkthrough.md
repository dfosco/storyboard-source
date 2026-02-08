# The Storyboard System — Conceptual → Technical

## The Problem It Solves

You're building a UI prototype. You want the **same React components** to render with **different data** — different users, different project lists, different settings — without touching component code. You also want designers/collaborators to change that data without writing JS. The storyboard system solves this by putting all prototype data in JSON files, and swapping them via URL (`?scene=other-scene`).

## Three Layers (bottom-up)

```
┌─────────────────────────────────────────────┐
│  Layer 3: React Context + Hooks             │  ← Components consume data here
│  (context.jsx, useSceneData.js)             │
├─────────────────────────────────────────────┤
│  Layer 2: Loader                            │  ← Resolves $ref/$global, produces
│  (loader.js)                                │     one flat JS object
├─────────────────────────────────────────────┤
│  Layer 1: Data Files                        │  ← Raw JSON: objects + scenes
│  (src/data/objects/, src/data/scenes/)       │
└─────────────────────────────────────────────┘
```

## Layer 1 — Data Files

Two directories:

- **`objects/`** — Small reusable JSON fragments (a user, a nav config). These are like "variables."
- **`scenes/`** — Compose objects into a complete data set for a prototype. These are like "configurations."

A scene can reference objects two ways:
- **`$ref`**: `{ "$ref": "../objects/jane-doe" }` → gets replaced inline with that file's contents
- **`$global`**: `["../objects/navigation"]` → merges that file's contents into the scene root (scene wins on conflict)

**If you were building this from scratch**, you'd start here. Just create a few JSON files. No code yet.

## Layer 2 — The Loader (`loader.js`)

This is the most complex file. Here's what it does, step by step:

1. **Bulk-imports all JSON** at build time using `import.meta.glob`. This is a Vite feature — it reads every `.json`/`.jsonc` file under `src/data/` and bundles them as raw strings into a dictionary keyed by path.

2. **`loadScene("default")`** is called → it looks up `scenes/default.json` in that dictionary and parses it with a JSONC parser (allows comments).

3. **Processes `$global`** first — iterates the array, loads each referenced file, deep-merges them together, then merges the scene on top (so scene values win).

4. **Recursively resolves `$ref`** — walks the entire object tree. When it finds `{ "$ref": "..." }`, it loads that file and replaces the object. It tracks which files it's already visited in a `Set` to catch circular references.

5. Returns a flat JS object — no `$ref` or `$global` keys left.

**Key helper functions:**
- `resolveRefPath(ref, baseDir)` — resolves `../objects/foo` relative to the current file's directory (pure string manipulation, like a mini path resolver)
- `loadDataFile(dataPath)` — looks up a path in the `import.meta.glob` dictionary and parses it
- `deepMerge(target, source)` — recursive object merge where source wins; arrays are replaced, not concatenated

**If building from scratch**, write it in this order:
1. `getByPath()` (10-line utility, easy win)
2. `loadDataFile()` + the `import.meta.glob` setup
3. `resolveRefPath()`
4. `resolveRefs()` (the recursive walker)
5. `loadScene()` (ties it all together)

## Layer 3 — React Context + Hooks

Three files that are individually simple:

- **`StoryboardContext.js`** — Literally one line: `createContext(null)`. Exists as a separate file to prevent circular imports.

- **`context.jsx` (StoryboardProvider)** — A standard React provider pattern:
  - Reads scene name from URL param, prop, or defaults to `"default"`
  - Calls `loadScene()` in a `useEffect`
  - Stores `data`, `loading`, `error` in state
  - **Blocks rendering** until loaded (returns a loading/error fallback instead of `children`)
  - Wraps children in `<StoryboardContext.Provider>`

- **`useSceneData.js`** — Two hooks:
  - `useSceneData(path?)` — calls `useContext`, then optionally runs `getByPath` on the data. Warns if path not found.
  - `useSceneLoading()` — just returns `context.loading`

**If building from scratch**, this is the easiest layer. Standard React context pattern — you could write it in 15 minutes if you've done context before.

## Wiring It Up

In `_app.jsx` (the root layout), the provider wraps the entire app:
```jsx
<StoryboardProvider>
  <Outlet />   // all routes render here
</StoryboardProvider>
```

Any page component can then do:
```jsx
const user = useSceneData('user')
const bio = useSceneData('user.profile.bio')
```

## The Barrel (`index.js`)

Just re-exports everything public: `StoryboardProvider`, `useSceneData`, `useSceneLoading`, `getByPath`, `loadScene`. This is what components import from.

---

## Deep Dive: Writing the Loader From Scratch

### Docs to Have Open

1. **[Vite — `import.meta.glob`](https://vite.dev/guide/features.html#glob-import)** — The most "magical" part. Vite-specific (not standard JS). The docs explain `eager`, `query`, and `import` options.
2. **[MDN — `Array.prototype` methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** — `.map()`, `.filter()`, `Promise.all()`.
3. **[`jsonc-parser` npm page](https://www.npmjs.com/package/jsonc-parser)** — Tiny library. You only need its `parse()` function. Like `JSON.parse()` but allows comments.
4. **[MDN — `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)** — Used for circular reference detection.

### Step 1: `deepMerge(target, source)` — Pure logic, no dependencies

Standalone utility. Mental model: "copy `target`, then overwrite with `source`, but if both sides have a plain object at the same key, recurse instead of replacing."

The tricky part is the type-checking: distinguish plain objects from arrays and `null` (both have `typeof === 'object'`). Check `!Array.isArray()` and `!== null` on both sides.

**Exercise**: Write it, then test in your browser console:
```js
deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } })
// → { a: { b: 1, c: 3, d: 4 } }

deepMerge({ a: [1, 2] }, { a: [3] })
// → { a: [3] }  (arrays replace, not concat)
```

### Step 2: The `import.meta.glob` setup — Vite-specific magic

```js
const dataModules = import.meta.glob('../../data/**/*.{json,jsonc}', {
  eager: true,
  query: '?raw',
  import: 'default',
})
```

At build time, Vite finds every matching file and creates a JS object like:
```js
{
  '../../data/objects/jane-doe.json': '{"name": "Jane Doe", ...}',
  '../../data/scenes/default.json': '{"user": {"$ref": ...}, ...}',
}
```

- `eager: true` — load them all immediately (not lazy)
- `query: '?raw'` — import as raw text strings (because we want JSONC parsing)
- `import: 'default'` — grab the default export (the string itself)

**Key insight**: Dictionary keys are *relative paths from this file's location*, not from the project root. That's why they start with `../../data/`.

### Step 3: `loadDataFile(dataPath)` — Dictionary lookup + parse

Takes a path like `"objects/jane-doe"` (no extension), constructs the dictionary key by prepending `../../data/` and appending `.jsonc` then `.json`, looks it up, and parses with `jsonc-parser`. Bridge between "nice clean path" and "Vite's ugly relative key."

### Step 4: `resolveRefPath(ref, baseDir)` — Mini path resolver

Pure string manipulation simulating how `../` works in file paths. Given `ref = "../objects/navigation"` and `baseDir = "scenes"`:

1. Split `baseDir` into segments: `["scenes"]`
2. Walk through `ref` parts: `..` pops `"scenes"` → `[]`, then `objects` pushes → `["objects"]`, then `navigation` pushes → `["objects", "navigation"]`
3. Join: `"objects/navigation"`

**Exercise**: Trace through with `ref = "../../objects/foo"` and `baseDir = "scenes/nested"`. Should get `"objects/foo"`.

### Step 5: `resolveRefs(node, baseDir, seen)` — The recursive heart

A **tree walker** that transforms a data tree. The pattern:

1. **Base case**: if `node` is primitive (string, number, null), return unchanged
2. **Array case**: map each item through `resolveRefs` recursively (using `Promise.all`)
3. **$ref case**: if object has a `$ref` key, load the referenced file, check for circular refs via `seen` Set, recursively resolve *that* file's contents too
4. **Plain object case**: recurse into each value

The `seen` Set catches circular refs — if file A refs B which refs A, the second time A is encountered it's already in `seen` and throws.

**Exercise**: Trace with `default.json`. Start with `{ "user": { "$ref": "../objects/jane-doe" } }`. Watch it hit the `$ref` branch, load `jane-doe.json`, and return the plain user object.

### Step 6: `loadScene(sceneName)` — The orchestrator

Ties everything together:
1. Load the scene file
2. Process `$global` (if present): load each global file, deep-merge them, merge scene on top
3. Run `resolveRefs` on the whole tree
4. Return the flat result

Important ordering: `$global` is processed first and *removed* (`delete sceneData.$global`) before `$ref` resolution. This means `$global` files can themselves contain `$ref` values — they get resolved in step 3.

**The function to spend the most time understanding is `resolveRefs`** — it's a recursive tree walk with cycle detection, a pattern that shows up everywhere in CS (compilers, dependency resolution, graph traversal). Once you grok that one, the rest is plumbing.
