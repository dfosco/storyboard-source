import { Link, useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Divider,
  FormControl,
  Modal,
  Reshaped,
  Select,
  Text,
  TextField,
  View,
} from 'reshaped'
import 'reshaped/themes/reshaped/theme.css'
import 'reshaped/themes/reshaped/media.css'
import { useSceneData, useOverride, useRecords } from '@storyboard/react'
import { setParam, removeParam } from '@storyboard/core'
import AppSidebar from '../../components/AppSidebar/AppSidebar.jsx'
import IssueFormFields from '../../components/IssueFormFields/IssueFormFields.jsx'
import styles from './issues.module.css'

const statusIcons = {
  todo: '○',
  in_progress: '◐',
  done: '●',
  cancelled: '✕',
}

const labelColors = {
  Auth: 'neutral',
  Backend: 'critical',
  Feature: 'primary',
  Bug: 'critical',
  Security: 'warning',
  Frontend: 'primary',
  DevEx: 'positive',
}

const emptyDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  project: '',
  estimate: '',
}

const DRAFT_FIELDS = ['title', 'description', 'status', 'priority', 'assignee', 'project', 'estimate']

function clearDraftParams(prefix) {
  DRAFT_FIELDS.forEach((field) => removeParam(`${prefix}.${field}`))
}

function CreateIssueModal({ active, onClose, issueCount }) {
  const [draftTitle] = useOverride('draft.create.title')
  const navigate = useNavigate()

  const newIdentifier = `FIL-${issueCount + 1}`

  const handleOpen = () => {
    DRAFT_FIELDS.forEach((field) => {
      setParam(`draft.create.${field}`, emptyDraft[field])
    })
  }

  const handleSave = () => {
    if (!(draftTitle ?? '').trim()) return
    const newId = draftTitle
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      || `new-issue-${issueCount + 1}`

    // Copy draft fields to record overrides
    DRAFT_FIELDS.forEach((field) => {
      const val = new URLSearchParams(window.location.hash.replace(/^#/, '')).get(`draft.create.${field}`) ?? ''
      setParam(`record.issues.${newId}.${field}`, val)
    })
    setParam(`record.issues.${newId}.identifier`, newIdentifier)

    clearDraftParams('draft.create')
    onClose({ reason: 'save' })
    navigate(`/issues/${newId}`)
  }

  const handleCancel = () => {
    clearDraftParams('draft.create')
    onClose({ reason: 'cancel' })
  }

  return (
    <Modal active={active} onClose={handleCancel} onOpen={handleOpen} size="600px" padding={6} position="center">
      <Modal.Title>Create Issue</Modal.Title>
      <Modal.Subtitle>{newIdentifier}</Modal.Subtitle>
      <View direction="column" gap={4} paddingTop={4}>
        <IssueFormFields prefix="draft.create" />
        <View direction="row" justify="end" gap={2} paddingTop={2}>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button color="primary" onClick={handleSave}>Save</Button>
        </View>
      </View>
    </Modal>
  )
}

export default function IssuesIndex() {
  const [createOpen, setCreateOpen, clearCreateOpen] = useOverride('ui.createModal')
  const isCreateOpen = createOpen === 'true'
  const issues = useRecords('issues')
  const orgName = useSceneData('signup.organization.name')
  const fullName = useSceneData('signup.fullName')
  const role = useSceneData('signup.organization.role')

  const openIssues = issues.filter((i) => i.status !== 'done' && i.status !== 'cancelled')
  const closedIssues = issues.filter((i) => i.status === 'done' || i.status === 'cancelled')

  return (
    <Reshaped defaultTheme="reshaped" defaultColorMode="dark">
      <View backgroundColor="page" minHeight="100vh" padding={12}>
        <View direction="row" align="start" gap={8} wrap="no-wrap">

          <View.Item columns={2}>
            <AppSidebar
              orgName={orgName}
              activePage="Issues"
              userInfo={{ name: fullName, role }}
            />
          </View.Item>

          <View.Item grow>
            <View direction="column" gap={4} maxWidth="900px">
              <View direction="row" justify="space-between" align="center">
                <Text variant="featured-2" weight="bold">Issues</Text>
                <View direction="row" gap={2} align="center">
                  <Badge color="neutral">{issues.length} total</Badge>
                  <Button size="small" color="primary" onClick={() => setCreateOpen('true')}>
                    Create issue
                  </Button>
                </View>
              </View>

              <CreateIssueModal
                active={isCreateOpen}
                onClose={() => clearCreateOpen()}
                issueCount={issues.length}
              />

              {/* Open issues */}
              <View direction="column" gap={0}>
                <View paddingBlock={2} paddingInline={3}>
                  <Text variant="caption-1" color="neutral-faded" weight="medium">
                    Open · {openIssues.length}
                  </Text>
                </View>
                <Divider />
                {openIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </View>

              {/* Closed issues */}
              {closedIssues.length > 0 && (
                <View direction="column" gap={0}>
                  <View paddingBlock={2} paddingInline={3}>
                    <Text variant="caption-1" color="neutral-faded" weight="medium">
                      Closed · {closedIssues.length}
                    </Text>
                  </View>
                  <Divider />
                  {closedIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </View>
              )}
            </View>
          </View.Item>

        </View>
      </View>
    </Reshaped>
  )
}

function IssueRow({ issue }) {
  return (
    <>
      <Link to={`/issues/${issue.id}`} className={styles.issueRow}>
        <View direction="row" align="center" gap={3} padding={3}>
          <Text variant="body-3" color="neutral-faded" attributes={{ style: { minWidth: 20 } }}>
            {statusIcons[issue.status] || '○'}
          </Text>
          <Text variant="caption-1" color="neutral-faded" attributes={{ style: { minWidth: 50 } }}>
            {issue.identifier}
          </Text>
          <View.Item grow>
            <Text variant="body-3">{issue.title}</Text>
          </View.Item>
          <View direction="row" gap={1}>
            {(issue.labels || []).map((label) => (
              <Badge key={label} size="small" color={labelColors[label] || 'neutral'}>
                {label}
              </Badge>
            ))}
          </View>
          <Text variant="caption-1" color="neutral-faded" attributes={{ style: { textTransform: 'capitalize' } }}>
            {issue.priority}
          </Text>
        </View>
      </Link>
      <Divider />
    </>
  )
}
