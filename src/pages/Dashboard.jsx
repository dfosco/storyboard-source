import {
  Badge,
  Calendar,
  Card,
  Checkbox,
  Divider,
  Progress,
  Reshaped,
  Text,
  View,
} from 'reshaped'
import 'reshaped/themes/reshaped/theme.css'
import 'reshaped/themes/reshaped/media.css'
import { useSceneData } from '@storyboard/react'
import AppSidebar from '../components/AppSidebar/AppSidebar.jsx'

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
  const fullName = useSceneData('signup.fullName')
  const orgName = useSceneData('signup.organization.name')
  const orgSize = useSceneData('signup.organization.size')
  const role = useSceneData('signup.organization.role')
  const region = useSceneData('signup.workspace.region')
  const plan = useSceneData('signup.workspace.plan')

  return (
    <Reshaped defaultTheme="reshaped" defaultColorMode="dark">
      <View backgroundColor="page" minHeight="100vh" padding={12}>
        <View direction="row" align="start" gap={8} wrap="no-wrap">

          {/* Sidebar */}
          <View.Item columns={2}>
            <AppSidebar
              orgName={display(orgName)}
              activePage="Overview"
              userInfo={{ name: display(fullName), role: display(role) }}
            />
          </View.Item>

          {/* Main content */}
          <View.Item columns={10} direction="column" align="center" justify="center">
            <View direction="column" maxWidth="80%" gap={4}>

              {/* Top bar */}
              <View direction="row" justify="space-between" align="center">
                <Text variant="featured-2" weight="bold">Overview</Text>
                <View direction="row" gap={2} align="center">
                  <Badge color="positive">{display(plan)} plan</Badge>
                  <Badge variant="faded">{display(region)}</Badge>
                </View>
              </View>

              {/* Stat cards row */}
              <View direction="row" gap={3}>
                <View.Item columns={3}>
                  <StatCard label="Active Users" value="0" change="No data yet" color="neutral-faded" />
                </View.Item>
                <View.Item columns={3}>
                  <StatCard label="Deployments" value="0" change="No data yet" color="neutral-faded" />
                </View.Item>
                <View.Item columns={3}>
                  <StatCard label="New Members" value="1" change="That's you!" color="primary" />
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
                        <MetricRow label="Performance" value="0" max={100} color="neutral-faded" />
                        <MetricRow label="Monthly revenue goal" value="0" max={100} color="neutral-faded" />
                        <MetricRow label="Error rate" value="0" max={100} color="neutral-faded" />
                        <MetricRow label="User acquisition" value="0" max={100} color="neutral-faded" />
                        <MetricRow label="Releases shipped" value="0" max={100} color="neutral-faded" />
                      </View>
                    </Card>

                    <Card padding={5}>
                      <View direction="column" gap={3}>
                        <Text variant="body-2" weight="bold">Recent activity</Text>
                        <Divider />
                        <View direction="column" gap={4} align="center" paddingBlock={6}>
                          <Text variant="body-3" color="neutral-faded">No activity yet</Text>
                          <Text variant="caption-1" color="neutral-faded">
                            Deployments and events will appear here once your workspace is active.
                          </Text>
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
