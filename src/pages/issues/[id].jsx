import { Link } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Modal,
  Reshaped,
  Text,
  View,
} from 'reshaped'
import 'reshaped/themes/reshaped/theme.css'
import 'reshaped/themes/reshaped/media.css'
import { useSceneData, useOverride, useRecord, useRecordOverride } from '@storyboard/react'
import { setParam, removeParam } from '@storyboard/core'
import AppSidebar from '../../components/AppSidebar/AppSidebar.jsx'
import IssueFormFields, { statusLabels, priorityLabels } from '../../components/IssueFormFields/IssueFormFields.jsx'

const labelColors = {
  Auth: 'neutral',
  Backend: 'critical',
  Feature: 'primary',
  Bug: 'critical',
  Security: 'warning',
  Frontend: 'primary',
  DevEx: 'positive',
}

const DRAFT_FIELDS = ['title', 'description', 'status', 'priority', 'assignee', 'project', 'estimate']

function EditIssueModal({ issue, active, onClose }) {
  const overrides = {
    title: useRecordOverride('issues', issue.id, 'title'),
    description: useRecordOverride('issues', issue.id, 'description'),
    status: useRecordOverride('issues', issue.id, 'status'),
    priority: useRecordOverride('issues', issue.id, 'priority'),
    assignee: useRecordOverride('issues', issue.id, 'assignee'),
    project: useRecordOverride('issues', issue.id, 'project'),
    estimate: useRecordOverride('issues', issue.id, 'estimate'),
  }

  const handleOpen = () => {
    DRAFT_FIELDS.forEach((field) => {
      setParam(`draft.edit.${field}`, issue[field] ?? '')
    })
  }

  const handleSave = () => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    DRAFT_FIELDS.forEach((field) => {
      const [, setRecord] = overrides[field]
      setRecord(hash.get(`draft.edit.${field}`) ?? '')
    })
    DRAFT_FIELDS.forEach((field) => removeParam(`draft.edit.${field}`))
    onClose({ reason: 'save' })
  }

  const handleCancel = () => {
    DRAFT_FIELDS.forEach((field) => removeParam(`draft.edit.${field}`))
    onClose({ reason: 'cancel' })
  }

  return (
    <Modal active={active} onClose={handleCancel} onOpen={handleOpen} size="600px" padding={6} position="center">
      <Modal.Title>Edit Issue</Modal.Title>
      <Modal.Subtitle>{issue.identifier}</Modal.Subtitle>
      <View direction="column" gap={4} paddingTop={4}>
        <IssueFormFields prefix="draft.edit" />
        <View direction="row" justify="end" gap={2} paddingTop={2}>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button color="primary" onClick={handleSave}>Save</Button>
        </View>
      </View>
    </Modal>
  )
}

export default function IssueDetail() {
  const [editOpen, setEditOpen, clearEditOpen] = useOverride('ui.editModal')
  const isEditOpen = editOpen === 'true'
  const issue = useRecord('issues', 'id')
  const orgName = useSceneData('signup.organization.name')
  const fullName = useSceneData('signup.fullName')
  const role = useSceneData('signup.organization.role')

  if (!issue) {
    return (
      <Reshaped defaultTheme="reshaped" defaultColorMode="dark">
        <View backgroundColor="page" minHeight="100vh" padding={12}>
          <View direction="row" align="start" gap={8} wrap="no-wrap">
            <View.Item columns={2}>
              <AppSidebar orgName={orgName} activePage="Issues" userInfo={{ name: fullName, role }} />
            </View.Item>
            <View.Item grow>
              <View direction="column" gap={4} align="center" paddingBlock={16}>
                <Text variant="featured-2" weight="bold">Issue not found</Text>
                <Text variant="body-3" color="neutral-faded">The issue you're looking for doesn't exist.</Text>
                <Link to="/issues">← Back to all issues</Link>
              </View>
            </View.Item>
          </View>
        </View>
      </Reshaped>
    )
  }

  return (
    <Reshaped defaultTheme="reshaped" defaultColorMode="dark">
      <View backgroundColor="page" minHeight="100vh" padding={12}>
        <View direction="row" align="start" gap={8} wrap="no-wrap">

          {/* Sidebar */}
          <View.Item columns={2}>
            <AppSidebar orgName={orgName} activePage="Issues" userInfo={{ name: fullName, role }} />
          </View.Item>

          {/* Main content */}
          <View.Item grow>
            <View direction="row" gap={8} align="start">

              {/* Issue body */}
              <View.Item grow>
                <View direction="column" gap={4} maxWidth="720px">
                  {/* Breadcrumb */}
                  <View direction="row" gap={2} align="center" justify="space-between">
                    <View direction="row" gap={2} align="center">
                      <Link to="/issues" style={{ textDecoration: 'none' }}>
                        <Text variant="caption-1" color="neutral-faded">
                          {orgName || 'Workspace'}
                        </Text>
                      </Link>
                      <Text variant="caption-1" color="neutral-faded">›</Text>
                      <Text variant="caption-1" color="neutral-faded">{issue.identifier}</Text>
                    </View>
                    <Button variant="outline" size="small" onClick={() => setEditOpen('true')}>
                      Edit issue
                    </Button>
                  </View>

                  <EditIssueModal
                    issue={issue}
                    active={isEditOpen}
                    onClose={() => clearEditOpen()}
                  />

                  {/* Title */}
                  <Text variant="featured-1" weight="bold">{issue.title}</Text>

                  {/* Description */}
                  {issue.description && (
                    <Text variant="body-2" color="neutral-faded">{issue.description}</Text>
                  )}

                  {/* Acceptance Criteria */}
                  {issue.acceptanceCriteria?.length > 0 && (
                    <View direction="column" gap={2}>
                      <Text variant="body-2" weight="bold">Acceptance Criteria</Text>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        {issue.acceptanceCriteria.map((item, i) => (
                          <li key={i} style={{ marginBottom: '0.5rem' }}>
                            <Text variant="body-3">{item}</Text>
                          </li>
                        ))}
                      </ul>
                    </View>
                  )}

                  {/* Technical Notes */}
                  {issue.technicalNotes?.length > 0 && (
                    <View direction="column" gap={2}>
                      <Text variant="body-2" weight="bold">Technical Notes</Text>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        {issue.technicalNotes.map((item, i) => (
                          <li key={i} style={{ marginBottom: '0.5rem' }}>
                            <Text variant="body-3">{item}</Text>
                          </li>
                        ))}
                      </ul>
                    </View>
                  )}

                  {/* Sub-issues placeholder */}
                  <Divider />
                  <Text variant="caption-1" color="neutral-faded">+ Add sub-issues</Text>

                  {/* Activity */}
                  <Divider />
                  <View direction="column" gap={3}>
                    <Text variant="body-2" weight="bold">Activity</Text>
                    {(issue.activity || []).map((entry, i) => (
                      <View key={i} direction="row" gap={3} align="center">
                        <Avatar
                          src={entry.avatar}
                          initials={entry.user?.[0]?.toUpperCase()}
                          size={6}
                        />
                        <View direction="column">
                          <Text variant="body-3">
                            <Text weight="medium">{entry.user}</Text>
                            {entry.type === 'created' && ' created the issue'}
                            {entry.type === 'comment' && ':'}
                          </Text>
                          {entry.body && (
                            <Text variant="body-3" color="neutral-faded">{entry.body}</Text>
                          )}
                          <Text variant="caption-1" color="neutral-faded">{entry.time}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View.Item>

              {/* Properties sidebar */}
              <View.Item columns={3}>
                <Card padding={4}>
                  <View direction="column" gap={4}>
                    <Text variant="caption-1" color="neutral-faded" weight="medium">Properties</Text>
                    <Divider />

                    {/* Status */}
                    <View direction="column" gap={1}>
                      <Text variant="caption-1" color="neutral-faded">Status</Text>
                      <Text variant="body-3">{statusLabels[issue.status] || issue.status}</Text>
                    </View>

                    {/* Priority */}
                    <View direction="column" gap={1}>
                      <Text variant="caption-1" color="neutral-faded">Priority</Text>
                      <Text variant="body-3">{priorityLabels[issue.priority] || issue.priority}</Text>
                    </View>

                    {/* Assignee */}
                    <View direction="column" gap={1}>
                      <Text variant="caption-1" color="neutral-faded">Assignee</Text>
                      {issue.assignee ? (
                        <View direction="row" gap={2} align="center">
                          <Avatar
                            src={issue.assigneeAvatar}
                            initials={issue.assignee?.[0]?.toUpperCase()}
                            size={5}
                          />
                          <Text variant="body-3">{issue.assignee}</Text>
                        </View>
                      ) : (
                        <Text variant="body-3" color="neutral-faded">Assign</Text>
                      )}
                    </View>

                    {/* Labels */}
                    <View direction="column" gap={1}>
                      <Text variant="caption-1" color="neutral-faded">Labels</Text>
                      <View direction="row" gap={1} wrap>
                        {(issue.labels || []).map((label) => (
                          <Badge key={label} size="small" color={labelColors[label] || 'neutral'}>
                            {label}
                          </Badge>
                        ))}
                      </View>
                    </View>

                    {/* Project */}
                    <View direction="column" gap={1}>
                      <Text variant="caption-1" color="neutral-faded">Project</Text>
                      <Text variant="body-3" color={issue.project ? undefined : 'neutral-faded'}>
                        {issue.project || 'Add to project'}
                      </Text>
                    </View>

                    {/* Estimate */}
                    {issue.estimate && (
                      <View direction="column" gap={1}>
                        <Text variant="caption-1" color="neutral-faded">Estimate</Text>
                        <Text variant="body-3">{issue.estimate} points</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </View.Item>

            </View>
          </View.Item>

        </View>
      </View>
    </Reshaped>
  )
}
