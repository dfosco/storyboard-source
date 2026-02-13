import { useNavigate } from 'react-router-dom'
import { Button, Card, Text, View } from 'reshaped'

function Home() {
  const navigate = useNavigate()

  return (
    <View padding={8} maxWidth={80} direction="column" gap={6} attributes={{ style: { margin: '0 auto' } }}>
      <Text variant="title-2" weight="bold">Cloud platform onboarding</Text>
      <Text variant="body-2" color="neutral-faded">
        Start a multi-step sign-up flow and land on a personalized dashboard generated from your submitted data.
      </Text>

      <Card padding={6}>
        <View direction="column" gap={4}>
          <Text variant="title-6" weight="medium">Get started</Text>
          <View direction="row" gap={3}>
            <Button color="primary" onClick={() => navigate('/Signup')}>
              Start sign-up
            </Button>
            <Button variant="outline" onClick={() => navigate('/Dashboard')}>
              Go to dashboard
            </Button>
          </View>
        </View>
      </Card>
    </View>
  )
}

export default Home
