# `src/storyboard/components/SceneDataDemo.jsx`

<!--
source: src/storyboard/components/SceneDataDemo.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A demo component that showcases the [`useSceneData()`](../hooks/useSceneData.js.md) hook API. It reads the full scene object, destructures the `user` and `navigation` data, and renders them in a simple formatted layout. This serves as a living example of how to consume storyboard data in page components.

Unlike [`SceneDebug`](./SceneDebug.jsx.md) (which loads scene data independently via [`loadScene()`](../core/loader.js.md)), this component relies entirely on the [`StoryboardProvider`](../context.jsx.md) context, demonstrating the recommended data access pattern.

## Composition

```jsx
export default function SceneDataDemo() {
  const scene = useSceneData()
  const { user } = scene

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>useSceneData Demo</h2>

      <section>
        <Text as="h3" fontWeight="bold">User</Text>
        <pre className={styles.codeBlock}>
          {user.name} ({user.username})
        </pre>
        {/* ... bio, location, navigation labels */}
      </section>
    </div>
  )
}
```

The component expects the scene data to contain `user` (with `name`, `username`, `profile.bio`, `profile.location`) and `navigation.primary` (array with `label` fields). It uses CSS Modules from `SceneDebug.module.css` (shared styles).

## Dependencies

- `@primer/react` — `Text`
- [`src/storyboard/hooks/useSceneData.js`](../hooks/useSceneData.js.md) — `useSceneData`
- `src/storyboard/components/SceneDebug.module.css` — CSS Modules (shared with [`SceneDebug`](./SceneDebug.jsx.md))

## Dependents

Currently not imported by any page. Available as a reusable demo component.
