import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Calendar,
  Card,
  Checkbox,
  Divider,
  Progress,
  Reshaped,
  Tabs,
  Text,
  View,
} from 'reshaped'
import 'reshaped/themes/reshaped/theme.css'
import 'reshaped/themes/reshaped/media.css'
import { useSceneData } from '../storyboard'

function display(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

function StatCard({ label, value, change, color }) {
  return (
    <Card padding={5}>
      <View direction="column" gap={2}>
        <Text variant="body-3" color="neutral-faded">{label}</Text>
        <Text variant="featured-2" weight="bold">{value}</Text>
        <Text variant="caption-1" color={color || 'positive'}>{change}</Text>
      </View>
    </Card>
  )
}

function MetricRow({ label, value, max, color }) {
  return (
    <View direction="column" gap={1}>
      <View direction="row" justify="space-between">
        <Text variant="body-3">{label}</Text>
        <Text variant="body-3" weight="medium">{value}</Text>
      </View>
      <Progress
        value={typeof max === 'number' ? (parseFloat(value) / max) * 100 : parseFloat(value)}
        color={color}
        size="small"
        attributes={{ 'aria-label': label }}
      />
    </View>
  )
}

const schedule = [
  { label: 'Team standup', time: 'Today, 10:00' },
  { label: 'Architecture review', time: 'Today, 11:30' },
  { label: 'Lunch', time: 'Today, 12:30' },
  { label: 'Sprint planning', time: 'Today, 14:00' },
  { label: 'Deploy v2.4', time: 'Today, 17:00' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  const fullName = useSceneData('signup.fullName')
  const orgName = useSceneData('signup.organization.name')
  const orgSize = useSceneData('signup.organization.size')
  const role = useSceneData('signup.organization.role')
  const region = useSceneData('signup.workspace.region')
  const plan = useSceneData('signup.workspace.plan')

  return (
    <Reshaped defaultTheme="reshaped" defaultColorMode="dark">
      <View backgroundColor="page" minHeight="100vh" padding={4}>
        <View direction="row" gap={4}>

          {/* Sidebar */}
          <View.Item columns={2}>
            <Card padding={4}>
              <View direction="column" gap={2}>
                <Text variant="featured-3" weight="bold">
                  {display(orgName)}
                </Text>
                <Divider />
                <Tabs direction="column" defaultValue="overview" variant="pills">
                  <Tabs.List>
                    <Tabs.Item value="overview">Overview</Tabs.Item>
                    <Tabs.Item value="analytics">Analytics</Tabs.Item>
                    <Tabs.Item value="team">Team</Tabs.Item>
                    <Tabs.Item value="deployments">Deployments</Tabs.Item>
                    <Tabs.Item value="billing">Billing</Tabs.Item>
                    <Tabs.Item value="settings">Settings</Tabs.Item>
                  </Tabs.List>
                </Tabs>
                <Divider />
                <View direction="column" gap={1} paddingTop={1}>
                  <Text variant="caption-1" color="neutral-faded">{display(fullName)}</Text>
                  <Text variant="caption-1" color="neutral-faded">{display(role)}</Text>
                </View>
              </View>
            </Card>
          </View.Item>

          {/* Main content */}
          <View.Item grow>
            <View direction="column" gap={4}>

              {/* Top bar */}
              <View direction="row" justify="space-between" align="center">
                <Text variant="featured-2" weight="bold">Overview</Text>
                <View direction="row" gap={2} align="center">
                  <Badge color="positive">{display(plan)} plan</Badge>
                  <Badge variant="faded">{display(region)}</Badge>
                  <Button variant="outline" size="small" onClick={() => navigate('/Signup')}>
                    Edit signup
                  </Button>
                </View>
              </View>

              {/* Stat cards row */}
              <View direction="row" gap={3}>
                <View.Item columns={3}>
                  <StatCard label="Active Users" value="854" change="+32% since last week" />
                </View.Item>
                <View.Item columns={3}>
                  <StatCard label="Deployments" value="126" change="+54% since last week" />
                </View.Item>
                <View.Item columns={3}>
                  <StatCard label="New Members" value="278" change="+42% since last week" />
                </View.Item>
                <View.Item columns={3}>
                  <StatCard
                    label="Team Size"
                    value={display(orgSize)}
                    change="Current plan capacity"
                    color="primary"
                  />
                </View.Item>
              </View>

              {/* Second row: Calendar + Schedule | Metrics */}
              <View direction="row" gap={4}>

                {/* Calendar + Schedule */}
                <View.Item columns={5}>
                  <View direction="column" gap={4}>
                    <Card padding={4}>
                      <Calendar />
                    </Card>
                    <Card padding={5}>
                      <View direction="column" gap={3}>
                        <Text variant="body-2" weight="bold">Schedule</Text>
                        <View direction="column" gap={2}>
                          {schedule.map((item) => (
                            <Checkbox key={item.label} name={`schedule-${item.label}`}>
                              <View direction="column">
                                <Text variant="body-3">{item.label}</Text>
                                <Text variant="caption-1" color="neutral-faded">{item.time}</Text>
                              </View>
                            </Checkbox>
                          ))}
                        </View>
                      </View>
                    </Card>
                  </View>
                </View.Item>

                {/* Metrics + Articles */}
                <View.Item grow>
                  <View direction="column" gap={4}>
                    <Card padding={5}>
                      <View direction="column" gap={4}>
                        <Text variant="body-2" weight="bold">Metrics</Text>
                        <MetricRow label="Performance" value="95" max={100} color="positive" />
                        <MetricRow label="Monthly revenue goal" value="62" max={100} color="warning" />
                        <MetricRow label="Error rate" value="12" max={100} color="critical" />
                        <MetricRow label="User acquisition" value="78" max={100} color="positive" />
                        <MetricRow label="Releases shipped" value="100" max={100} color="primary" />
                      </View>
                    </Card>

                    <Card padding={5}>
                      <View direction="column" gap={3}>
                        <Text variant="body-2" weight="bold">Recent activity</Text>
                        <Divider />
                        <View direction="column" gap={3}>
                          <View direction="row" justify="space-between" align="center">
                            <View direction="column">
                              <Text variant="body-3">Production deploy v2.4.1</Text>
                              <Text variant="caption-1" color="neutral-faded">{display(region)} · 2 hours ago</Text>
                            </View>
                            <Badge color="positive" size="small">Success</Badge>
                          </View>
                          <Divider />
                          <View direction="row" justify="space-between" align="center">
                            <View direction="column">
                              <Text variant="body-3">Database migration #847</Text>
                              <Text variant="caption-1" color="neutral-faded">{display(region)} · 5 hours ago</Text>
                            </View>
                            <Badge color="positive" size="small">Complete</Badge>
                          </View>
                          <Divider />
                          <View direction="row" justify="space-between" align="center">
                            <View direction="column">
                              <Text variant="body-3">SSL certificate renewal</Text>
                              <Text variant="caption-1" color="neutral-faded">{display(region)} · 1 day ago</Text>
                            </View>
                            <Badge color="warning" size="small">Pending</Badge>
                          </View>
                          <Divider />
                          <View direction="row" justify="space-between" align="center">
                            <View direction="column">
                              <Text variant="body-3">New team member added</Text>
                              <Text variant="caption-1" color="neutral-faded">{display(fullName)} · 1 day ago</Text>
                            </View>
                            <Badge variant="faded" size="small">Info</Badge>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </View>
                </View.Item>
              </View>

            </View>
          </View.Item>

        </View>
      </View>
    </Reshaped>
  )
}
