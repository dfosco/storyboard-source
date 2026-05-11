# `packages/storyboard/src/internals/AuthModal/AuthModal.jsx`
<!--
source: packages/storyboard/src/internals/AuthModal/AuthModal.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

A global Personal Access Token (PAT) entry dialog for GitHub comments authentication. The modal is triggered by a custom event (`storyboard:open-auth-modal`) rather than being wired to a parent component, making it mountable once at the app root and callable from anywhere — the CoreUIBar comments tool, the Workspace sidebar login button, etc.

## Composition

```jsx
export default function AuthModal() {
  const [open, setOpen] = useState(false)
  const [tokenValue, setTokenValue] = useState('')

  // Listen for global trigger event
  useEffect(() => {
    document.addEventListener('storyboard:open-auth-modal', () => setOpen(true))
  }, [])

  const handleSignIn = useCallback(() => {
    localStorage.setItem(COMMENTS_TOKEN_KEY, trimmed)
    // Dynamic import — comments module is optional
    import('../../core/comments/index.js').then(({ setToken, validateToken }) => {
      setToken(trimmed)
      validateToken(trimmed).then(() =>
        document.dispatchEvent(new CustomEvent('storyboard:auth-changed'))
      )
    }).catch(() => {})
    setOpen(false)
  }, [tokenValue])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Instructions card showing required PAT permissions */}
      {/* Fine-grained PAT creation link */}
      {/* Password input */}
      {/* Sign in / Cancel buttons */}
    </Dialog.Root>
  )
}
```

The modal reads `__STORYBOARD_CONFIG__` (injected by the server plugin) to show the correct repository owner/name in the PAT permission instructions.

## Dependencies

- `@base-ui/react/dialog` — accessible modal primitives
- `../../core/comments/index.js` — dynamic import (optional); `setToken`, `validateToken`
- CSS Modules — `AuthModal.module.css`

## Dependents

- [`CommandPalette/CommandPalette.jsx`](../CommandPalette/CommandPalette.jsx.md) — renders `<AuthModal />` at the palette root so it's always available
- [`index.js`](../index.js.md) — exports `AuthModal` for standalone mounting

## Notes

- Uses dynamic `import()` with `.catch(() => {})` for the comments module — it's an optional dependency and consumers may not have it installed.
- After sign-in, dispatches `storyboard:auth-changed` so `Viewfinder.jsx`'s `useGitHubUser` hook updates the sidebar avatar.
- `sb-comments-token` is the localStorage key shared with the comments system.
