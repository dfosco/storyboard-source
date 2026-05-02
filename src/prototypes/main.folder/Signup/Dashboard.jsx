import { Label, ProgressBar, Text, Checkbox as PrimerCheckbox } from '@primer/react'
import { useFlowData } from '@dfosco/storyboard'
import AppSidebar from '@/components/AppSidebar/AppSidebar.jsx'
import styles from './Dashboard.module.css'

function display(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

function StatCard({ label, value, change, accent }) {
  return (
    <div className={styles.card}>
      <Text as="p" size="small" className={styles.muted}>{label}</Text>
      <Text as="p" size="large" weight="bold">{value}</Text>
      <Text as="p" size="small" className={accent ? styles.accent : styles.muted}>{change}</Text>
    </div>
  )
}

function MetricRow({ label, value, max }) {
  const pct = typeof max === 'number' ? (parseFloat(value) / max) * 100 : parseFloat(value)
  return (
    <div className={styles.metricRow}>
      <div className={styles.metricHeader}>
        <Text as="span" size="small">{label}</Text>
        <Text as="span" size="small" weight="semibold">{value}</Text>
      </div>
      <ProgressBar progress={pct} aria-label={label} />
    </div>
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
  const fullName = useFlowData('signup.fullName')
  const orgName = useFlowData('signup.organization.name')
  const orgSize = useFlowData('signup.organization.size')
  const role = useFlowData('signup.organization.role')
  const region = useFlowData('signup.workspace.region')
  const plan = useFlowData('signup.workspace.plan')

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <AppSidebar
            orgName={display(orgName)}
            activePage="Overview"
            userInfo={{ name: display(fullName), role: display(role) }}
          />
        </aside>

        {/* Main content */}
        <main className={styles.main}>

          {/* Top bar */}
          <div className={styles.topBar}>
            <Text as="h1" size="large" weight="bold">Overview</Text>
            <div className={styles.badges}>
              <Label variant="accent">{display(plan)} plan</Label>
              <Label>{display(region)}</Label>
            </div>
          </div>

          {/* Stat cards row */}
          <div className={styles.statsGrid}>
            <StatCard label="Active Users" value="0" change="No data yet" />
            <StatCard label="Deployments" value="0" change="No data yet" />
            <StatCard label="New Members" value="1" change="That's you!" accent />
            <StatCard label="Team Size" value={display(orgSize)} change="Current plan capacity" accent />
          </div>

          {/* Second row */}
          <div className={styles.secondRow}>

            {/* Schedule */}
            <div className={styles.scheduleCol}>
              <div className={styles.card}>
                <Text as="h2" size="medium" weight="bold">Schedule</Text>
                <div className={styles.scheduleList}>
                  {schedule.map((item) => (
                    <label key={item.label} className={styles.scheduleItem}>
                      <PrimerCheckbox />
                      <span>
                        <Text as="span" size="small">{item.label}</Text>
                        <br />
                        <Text as="span" size="small" className={styles.muted}>{item.time}</Text>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics + Activity */}
            <div className={styles.metricsCol}>
              <div className={styles.card}>
                <Text as="h2" size="medium" weight="bold">Metrics</Text>
                <div className={styles.metricsList}>
                  <MetricRow label="Performance" value="0" max={100} />
                  <MetricRow label="Monthly revenue goal" value="0" max={100} />
                  <MetricRow label="Error rate" value="0" max={100} />
                  <MetricRow label="User acquisition" value="0" max={100} />
                  <MetricRow label="Releases shipped" value="0" max={100} />
                </div>
              </div>

              <div className={styles.card}>
                <Text as="h2" size="medium" weight="bold">Recent activity</Text>
                <hr className={styles.divider} />
                <div className={styles.emptyState}>
                  <Text as="p" size="small" className={styles.muted}>No activity yet</Text>
                  <Text as="p" size="small" className={styles.muted}>
                    Deployments and events will appear here once your workspace is active.
                  </Text>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
