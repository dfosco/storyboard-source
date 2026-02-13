# `src/storyboard/components/SceneDataDemo.jsx`

<!--
source: src/storyboard/components/SceneDataDemo.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A demo component that showcases the storyboard system. It demonstrates `useOverride()` for button-based overrides, `useScene()` for scene switching, and `StoryboardForm` with wrapped Primer inputs for form-based editing. URL hash params serve as overrides over scene defaults — they persist across refreshes and can be shared via URL.

## Composition

The component has three sections:

1. **Scene** — Displays current scene name with a button to switch scenes via `useScene().switchScene()`
2. **User** — Shows user data from override state with buttons that call `setName()` / `setUsername()` directly via `useOverride()`
3. **Edit User** — A `StoryboardForm` with wrapped `TextInput` and `Textarea` components that buffer values locally and flush to URL hash on submit

```jsx
export default function SceneDataDemo() {
  const [name, setName, clearName] = useOverride('user.name')
  const [username, setUsername, clearUsername] = useOverride('user.username')
  const { sceneName, switchScene } = useScene()

  return (
    <div>
      {/* Scene switcher, user display, button overrides */}

      <StoryboardForm data="user" className={styles.form}>
        <FormControl>
          <FormControl.Label>Name</FormControl.Label>
          <TextInput name="name" placeholder="Name" size="small" />
        </FormControl>
        {/* ... more fields ... */}
        <Button type="submit" size="small">Save</Button>
      </StoryboardForm>
    </div>
  )
}
```

The form uses `data="user"` so each input's `name` maps to `user.{name}` in the URL hash (e.g., `name="profile.bio"` → `#user.profile.bio=...`). Values are buffered locally while typing and only written to the URL hash on form submit.

## Dependencies

- `@primer/react` — `Text`, `Button`, `ButtonGroup`, `FormControl`
- [`src/storyboard/hooks/useOverride.js`](../hooks/useOverride.js.md) — `useOverride`
- [`src/storyboard/hooks/useScene.js`](../hooks/useScene.js.md) — `useScene`
- [`src/storyboard/components/StoryboardForm.jsx`](./StoryboardForm.jsx.md) — `StoryboardForm`
- [`src/storyboard/components/TextInput.jsx`](./TextInput.jsx.md) — wrapped `TextInput`
- [`src/storyboard/components/Textarea.jsx`](./Textarea.jsx.md) — wrapped `Textarea`
- `src/storyboard/components/SceneDebug.module.css` — CSS Modules (shared with [`SceneDebug`](./SceneDebug.jsx.md))

## Dependents

Currently not imported by any page. Available as a reusable demo component.

