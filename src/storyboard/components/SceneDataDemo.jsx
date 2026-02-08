import { useState } from 'react'
import { Text, Button, ButtonGroup, TextInput, FormControl } from '@primer/react'
import { useSession } from '../hooks/useSession.js'
import { useScene } from '../hooks/useScene.js'
import styles from './SceneDebug.module.css'

/**
 * Demo component that renders scene data via useSession().
 * Every value can be overridden by adding a URL param, e.g.:
 *   ?user.name=Alice&user.profile.bio=Hello
 * Refresh the page — overrides persist. Remove the param — scene default returns.
 */
export default function SceneDataDemo() {
  const [name, setName, clearName] = useSession('user.name')
  const [username, setUsername, clearUsername] = useSession('user.username')
  const [bio, setBio, clearBio] = useSession('user.profile.bio')
  const [location, setLocation, clearLocation] = useSession('user.profile.location')
  const { sceneName, switchScene } = useScene()

  const nextScene = (sceneName === 'default') ? 'other-scene' : 'default'

  // Local form state
  const [formName, setFormName] = useState(name || '')
  const [formUsername, setFormUsername] = useState(username || '')
  const [formBio, setFormBio] = useState(bio || '')
  const [formLocation, setFormLocation] = useState(location || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    setName(formName)
    setUsername(formUsername)
    setBio(formBio)
    setLocation(formLocation)
  }

  const resetUser = () => {
    clearName()
    clearUsername()
    clearBio()
    clearLocation()
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>useSession Demo</h2>
      <p>Add <code>?user.name=Alice</code> to the URL to override any value.</p>

      <section>
        <Text as="h3" fontWeight="bold">Scene</Text>
        <pre className={styles.codeBlock}>current: {sceneName}</pre>
        
        <Button size="small" onClick={() => switchScene(nextScene)}>
          Switch to &quot;{nextScene}&quot;
        </Button>
      </section>

      <section>
        <Text as="h3" fontWeight="bold">User</Text>
        <pre className={styles.codeBlock}>
          {name} ({username})
        </pre>
        <pre className={styles.codeBlock}>
          {bio} · {location}
        </pre>

        <Text as="h4" fontWeight="semibold" fontSize={1}>Switch User</Text>
        <ButtonGroup>
          <Button size="small" onClick={() => setName('Alice Chen')}>Update name</Button>
          <Button size="small" onClick={() => setUsername('alice123')}>Update username</Button>
          <Button size="small" onClick={() => setBio('Product manager working at Memex')}>Update bio</Button>
          <Button size="small" onClick={() => setLocation('Seattle, WA')}>Update location</Button>
        </ButtonGroup>
        <Button size="small" variant="danger" onClick={resetUser} style={{ marginLeft: '8px' }}>
          Reset
        </Button>
      </section>

      <section>
        <Text as="h3" fontWeight="bold">Edit User</Text>
        <form onSubmit={handleSubmit} className={styles.form}>
          <FormControl>
            <FormControl.Label>Name</FormControl.Label>
            <TextInput
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Name"
              size="small"
            />
          </FormControl>
          <FormControl>
            <FormControl.Label>Username</FormControl.Label>
            <TextInput
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="Username"
              size="small"
            />
          </FormControl>
          <FormControl>
            <FormControl.Label>Bio</FormControl.Label>
            <TextInput
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              placeholder="Bio"
              size="small"
            />
          </FormControl>
          <FormControl>
            <FormControl.Label>Location</FormControl.Label>
            <TextInput
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Location"
              size="small"
            />
          </FormControl>
          <Button type="submit" size="small">Save</Button>
        </form>
      </section>
    </div>
  )
}
