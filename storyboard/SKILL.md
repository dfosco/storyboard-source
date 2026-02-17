# Storyboard Skill

## Key Rules

### No `useState` in pages or components

All state management must happen through storyboard hooks. Storyboard state lives in the URL hash — not in React component state.

**Use these hooks instead:**

| Hook | Purpose |
|------|---------|
| `useSceneData(path?)` | Read scene data by dot-notation path |
| `useOverride(path)` | Read/write hash-param overrides on scene data |
| `useRecord(name, param?)` | Load a single record entry matched by URL param (defaults to `'id'`) |
| `useRecords(name)` | Load all entries from a record collection |
| `useRecordOverride(name, entryId, field)` | Read/write hash-param overrides on a record entry field |
| `useSceneLoading()` | Returns true while scene is loading |

**Why:** Storyboard is a prototyping framework where all data flows through the URL hash. This makes every state change shareable via URL, inspectable in the address bar, and framework-portable. Using `useState` breaks this contract — the state becomes invisible, unshareable, and tied to React.

### Dynamic routes and records

The filename convention `[field].jsx` determines which record field the route matches against:

- `pages/issues/[id].jsx` → `useRecord('issues')` matches `entry.id`
- `pages/posts/[permalink].jsx` → `useRecord('posts', 'permalink')` matches `entry.permalink`

The second argument to `useRecord` defaults to `'id'`, so `useRecord('issues')` is equivalent to `useRecord('issues', 'id')`.

### Anti-patterns

- **DO NOT** use `useState` — use storyboard hooks for all state
- **DO NOT** use `<Box>` components
- **DO NOT** use `sx` styled-components
- **DO NOT** assume data fields exist — always use optional chaining, fallbacks, or conditional rendering
