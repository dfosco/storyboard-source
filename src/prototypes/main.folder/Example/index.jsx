import { Text, Button, ButtonGroup, FormControl } from '@primer/react'
import { useOverride, useFlow } from '@dfosco/storyboard'
import ColorModeSwitcher from '@/components/ColorModeSwitcher/ColorModeSwitcher.jsx'
import StoryboardForm from '@/components/StoryboardForm/StoryboardForm.jsx'
import TextInput from '@/components/TextInput/TextInput.jsx'
import Textarea from '@/components/Textarea/Textarea.jsx'
import styles from './Example.module.css'

function Example() {
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('_sb_embed')
  const [name, setName, clearName] = useOverride('user.name')
  const [username, setUsername, clearUsername] = useOverride('user.username')
  const [bio, clearBio] = useOverride('user.profile.bio')
  const [location, clearLocation] = useOverride('user.profile.location')
  const [currentDirectory] = useOverride('user.systemInfo.currentDirectory')
  const [currentProto] = useOverride('user.systemInfo.currentProto')
  const [currentProtoDir] = useOverride('user.systemInfo.currentProtoDir')

  const { flowName, switchFlow } = useFlow()

  const nextFlow = (flowName === 'default') ? 'other-scene' : 'default'

  const resetUser = () => {
    clearName()
    clearUsername()
    clearBio()
    clearLocation()
  }

  return (
    <div className={styles.containerOuter}>
      {!isEmbed && <ColorModeSwitcher />}
      <div className={styles.container}>
        <h2 className={styles.title}>useOverride Demo</h2>
        <p>Add <code>#user.name=Alice</code> to the URL hash to override any value.</p>

        <section>
          <Text as="h3" fontWeight="bold">Flow</Text>
          <pre className={styles.codeBlock}>current: {flowName}</pre>
          
          <Button size="small" onClick={() => switchFlow(nextFlow)}>
            Switch to &quot;{nextFlow}&quot;
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
          <pre className={styles.codeBlock}>
            {currentDirectory} · {currentProtoDir} · {currentProto}
          </pre>

          <Text as="h4" fontWeight="semibold" fontSize={1}>Switch User</Text>
          <ButtonGroup>
            <Button size="small" onClick={() => setName('Alice Chen')}>Update name</Button>
            <Button size="small" onClick={() => setUsername('alice123')}>Update username</Button>
          </ButtonGroup>
          <Button size="small" variant="danger" onClick={resetUser} style={{ marginLeft: '8px' }}>
            Reset
          </Button>
        </section>

        <section>
          <Text as="h3" fontWeight="bold">Edit User</Text>
          <StoryboardForm data="user" className={styles.form}>
            <FormControl>
              <FormControl.Label>Name</FormControl.Label>
              <TextInput name="name" placeholder="Name" size="small" />
            </FormControl>
            <FormControl>
              <FormControl.Label>Username</FormControl.Label>
              <TextInput name="username" placeholder="Username" size="small" />
            </FormControl>
            <FormControl>
              <FormControl.Label>Bio</FormControl.Label>
              <Textarea name="profile.bio" placeholder="Bio" />
            </FormControl>
            <FormControl>
              <FormControl.Label>Location</FormControl.Label>
              <TextInput name="profile.location" placeholder="Location" size="small" />
            </FormControl>
            <Button type="submit" size="small">Save</Button>
          </StoryboardForm>
        </section>
      </div>
    </div>
  )
}

export default Example
