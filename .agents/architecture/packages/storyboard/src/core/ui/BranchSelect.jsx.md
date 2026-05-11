# `packages/storyboard/src/core/ui/BranchSelect.jsx`

<!--
source: packages/storyboard/src/core/ui/BranchSelect.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

A tiny styled `<select>` wrapper used by autosync-related flows. It centralizes branch dropdown styling without embedding any fetch or branching policy logic.

Because it accepts a focus ref and plain form handlers, it stays usable inside dropdown content where focus management matters.

## Composition

```jsx
import css from './BranchSelect.module.css'

export default function BranchSelect({
  branches = [],
  value,
  onChange,
  disabled,
  id,
  placeholder,
  ref,
}) {
  return (
    <select
      ref={ref}
      id={id}
      className={css.select}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {branches.length === 0 && (
        <option value="" disabled>{placeholder || 'No branches available'}</option>
      )}
      {branches.map((branch) => (
        <option key={branch} value={branch}>{branch}</option>
      ))}
    </select>
  )
}
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- [`packages/storyboard/src/core/ui/BranchSelect.module.css`](../../../../../../../packages/storyboard/src/core/ui/BranchSelect.module.css) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
