import { Text, FormControl, Button, Stack } from '@primer/react'
import Application from '../templates/Application/Application.jsx'
import {
  StoryboardForm,
  TextInput,
  Checkbox,
  Select,
  Textarea,
  useOverride,
} from '../storyboard'
import {
  HomeIcon,
  GearIcon,
} from '@primer/octicons-react'

const topnav = [
  { icon: HomeIcon, label: 'Home', url: '/' },
  { icon: GearIcon, label: 'Forms', url: '/Forms', current: true },
]

function Forms() {
  const [, , clearAll] = useOverride('checkout')

  return (
    <Application title="Storyboard" subtitle="Forms" topnav={topnav}>
      <Text as="h1" fontSize="larger">Form Components Demo</Text>
      <Text as="p" color="fg.muted">
        Type in the fields below, then click Submit to persist values in the URL hash.
        Refresh the page or share the URL to restore state.
      </Text>

      <StoryboardForm data="checkout">
        <Stack direction="vertical" gap="normal" padding="normal">
          <FormControl>
            <FormControl.Label>Email</FormControl.Label>
            <TextInput name="email" placeholder="you@example.com" />
          </FormControl>

          <FormControl>
            <FormControl.Label>Full Name</FormControl.Label>
            <TextInput name="name" placeholder="Jane Doe" />
          </FormControl>

          <FormControl>
            <FormControl.Label>Shipping Address</FormControl.Label>
            <Textarea name="address" placeholder="123 Main St..." />
          </FormControl>

          <FormControl>
            <FormControl.Label>Country</FormControl.Label>
            <Select name="country">
              <Select.Option value="">Select a country</Select.Option>
              <Select.Option value="us">United States</Select.Option>
              <Select.Option value="ca">Canada</Select.Option>
              <Select.Option value="uk">United Kingdom</Select.Option>
              <Select.Option value="de">Germany</Select.Option>
            </Select>
          </FormControl>

          <FormControl>
            <Checkbox name="newsletter" />
            <FormControl.Label>Subscribe to newsletter</FormControl.Label>
          </FormControl>

          <Stack direction="horizontal" gap="condensed">
            <Button type="submit" variant="primary">Submit</Button>
            <Button type="button" variant="danger" onClick={() => clearAll()}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </StoryboardForm>
    </Application>
  )
}

export default Forms
