import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Text, View } from 'reshaped'
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
    <View padding={8} gap={6} direction="column" maxWidth={100} attributes={{ style: { margin: '0 auto' } }}>
      <View direction="row" justify="space-between" align="center">
        <View direction="column" gap={1}>
          <Text variant="title-3" weight="bold">Cloud dashboard</Text>
          <Text variant="body-2" color="neutral-faded">
            Provisioned from your sign-up flow values.
          </Text>
        </View>
        <Button variant="outline" onClick={() => navigate('/Signup')}>Edit sign-up data</Button>
      </View>

      <View direction="row" gap={3}>
        <Card padding={6} grow>
          <View direction="column" gap={2}>
            <Text variant="title-6" weight="medium">Account</Text>
            <Text variant="body-2"><strong>Name:</strong> {display(fullName)}</Text>
            <Text variant="body-2"><strong>Email:</strong> {display(email)}</Text>
            <Text variant="body-2"><strong>Role:</strong> {display(role)}</Text>
          </View>
        </Card>

        <Card padding={6} grow>
          <View direction="column" gap={2}>
            <Text variant="title-6" weight="medium">Organization</Text>
            <Text variant="body-2"><strong>Name:</strong> {display(organizationName)}</Text>
            <Text variant="body-2"><strong>Size:</strong> {display(organizationSize)}</Text>
            <Text variant="body-2"><strong>Region:</strong> {display(region)}</Text>
          </View>
        </Card>

        <Card padding={6} grow>
          <View direction="column" gap={2}>
            <Text variant="title-6" weight="medium">Plan & notifications</Text>
            <Text variant="body-2"><strong>Plan:</strong> {display(plan)}</Text>
            <Text variant="body-2"><strong>Newsletter:</strong> {boolLabel(newsletter)}</Text>
            <Badge color="primary">Onboarding Complete</Badge>
          </View>
        </Card>
      </View>
    </View>
  )
}
