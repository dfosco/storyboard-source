import { Text } from '@primer/react'
import { useSession } from '../hooks/useSession.js'
import styles from './SceneDebug.module.css'

/**
 * Demo component that renders scene data via useSession().
 * Every value can be overridden by adding a URL param, e.g.:
 *   ?user.name=Alice&user.profile.bio=Hello
 * Refresh the page — overrides persist. Remove the param — scene default returns.
 */
export default function SceneDataDemo() {
  const [name] = useSession('user.name')
  const [username] = useSession('user.username')
  const [bio] = useSession('user.profile.bio')
  const [location] = useSession('user.profile.location')
  const [theme] = useSession('settings.theme')

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>useSession Demo</h2>
      <p>Add <code>?user.name=Alice</code> to the URL to override any value.</p>

      <section>
        <Text as="h3" fontWeight="bold">User</Text>
        <pre className={styles.codeBlock}>
          {name} ({username})
        </pre>
        <pre className={styles.codeBlock}>
          {bio} · {location}
        </pre>
      </section>

      <section>
        <Text as="h3" fontWeight="bold">Settings</Text>
        <pre className={styles.codeBlock}>
          theme: {theme}
        </pre>
      </section>
    </div>
  )
}
