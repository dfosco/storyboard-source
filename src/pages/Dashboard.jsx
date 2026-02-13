import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Reshaped, Text, View } from 'reshaped'
import 'reshaped/themes/reshaped/theme.css'
import 'reshaped/themes/reshaped/media.css'
import { useSceneData } from '../storyboard'

function boolLabel(value) {
  return value === true || value === 'true' ? 'Enabled' : 'Disabled'
}

function display(value) {
  if (value == null || value === '') return '—'
  return String(value)
}

export default function Dashboard() {
  const navigate = useNavigate()

  const fullName = useSceneData('signup.fullName')
  const email = useSceneData('signup.email')
  const organizationName = useSceneData('signup.organization.name')
  const organizationSize = useSceneData('signup.organization.size')
  const role = useSceneData('signup.organization.role')
  const region = useSceneData('signup.workspace.region')
  const plan = useSceneData('signup.workspace.plan')
  const newsletter = useSceneData('signup.workspace.newsletter')

  return (
    <Reshaped defaultTheme="reshaped" defaultColorMode="dark">
    <View
      backgroundColor="page"
      minHeight="100vh"
      padding={6}
      align="center"
    >
      <View maxWidth="720px" width="100%" direction="column" gap={6} paddingBlock={10}>
        <View direction="row" justify="space-between" align="center">
          <View direction="column" gap={1}>
            <Text variant="featured-1" weight="bold">Cloud dashboard</Text>
            <Text variant="body-2" color="neutral-faded">
              Provisioned from your sign-up flow values.
            </Text>
          </View>
          <Button variant="outline" onClick={() => navigate('/Signup')}>Edit sign-up data</Button>
        </View>

        <View direction="row" gap={4}>
          <View.Item columns={4}>
            <Card padding={5}>
              <View direction="column" gap={3}>
                <Text variant="body-2" weight="bold">Account</Text>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Name</Text>
                  <Text variant="body-2">{display(fullName)}</Text>
                </View>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Email</Text>
                  <Text variant="body-2">{display(email)}</Text>
                </View>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Role</Text>
                  <Text variant="body-2">{display(role)}</Text>
                </View>
              </View>
            </Card>
          </View.Item>

          <View.Item columns={4}>
            <Card padding={5}>
              <View direction="column" gap={3}>
                <Text variant="body-2" weight="bold">Organization</Text>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Name</Text>
                  <Text variant="body-2">{display(organizationName)}</Text>
                </View>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Size</Text>
                  <Text variant="body-2">{display(organizationSize)}</Text>
                </View>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Region</Text>
                  <Text variant="body-2">{display(region)}</Text>
                </View>
              </View>
            </Card>
          </View.Item>

          <View.Item columns={4}>
            <Card padding={5}>
              <View direction="column" gap={3}>
                <Text variant="body-2" weight="bold">Plan & notifications</Text>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Plan</Text>
                  <Text variant="body-2">{display(plan)}</Text>
                </View>
                <View direction="column" gap={1}>
                  <Text variant="caption-1" color="neutral-faded">Newsletter</Text>
                  <Text variant="body-2">{boolLabel(newsletter)}</Text>
                </View>
                <View paddingTop={2}>
                  <Badge color="positive">Onboarding Complete</Badge>
                </View>
              </View>
            </Card>
          </View.Item>
        </View>
      </View>
    </View>
    </Reshaped>
  )
}
