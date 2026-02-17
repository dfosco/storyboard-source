import {
  FormControl,
  Select,
  TextField,
  View,
} from 'reshaped'
import { useOverride } from '@storyboard/react'

const statusLabels = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

const priorityLabels = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const statusOptions = Object.entries(statusLabels)
const priorityOptions = Object.entries(priorityLabels)

export default function IssueFormFields({ prefix }) {
  const [title, setTitle] = useOverride(`${prefix}.title`)
  const [description, setDescription] = useOverride(`${prefix}.description`)
  const [status, setStatus] = useOverride(`${prefix}.status`)
  const [priority, setPriority] = useOverride(`${prefix}.priority`)
  const [assignee, setAssignee] = useOverride(`${prefix}.assignee`)
  const [project, setProject] = useOverride(`${prefix}.project`)
  const [estimate, setEstimate] = useOverride(`${prefix}.estimate`)

  return (
    <View direction="column" gap={4}>
      <FormControl>
        <FormControl.Label>Title</FormControl.Label>
        <TextField name="title" value={title ?? ''} onChange={({ value }) => setTitle(value)} />
      </FormControl>

      <FormControl>
        <FormControl.Label>Description</FormControl.Label>
        <TextField
          name="description"
          multiline
          value={description ?? ''}
          onChange={({ value }) => setDescription(value)}
          inputAttributes={{ rows: 3 }}
        />
      </FormControl>

      <View direction="row" gap={4}>
        <View.Item grow>
          <FormControl>
            <FormControl.Label>Status</FormControl.Label>
            <Select name="status" value={status ?? 'todo'} onChange={({ value }) => setStatus(value)}>
              {statusOptions.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Select>
          </FormControl>
        </View.Item>
        <View.Item grow>
          <FormControl>
            <FormControl.Label>Priority</FormControl.Label>
            <Select name="priority" value={priority ?? 'medium'} onChange={({ value }) => setPriority(value)}>
              {priorityOptions.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Select>
          </FormControl>
        </View.Item>
      </View>

      <View direction="row" gap={4}>
        <View.Item grow>
          <FormControl>
            <FormControl.Label>Assignee</FormControl.Label>
            <TextField
              name="assignee"
              placeholder="Username"
              value={assignee ?? ''}
              onChange={({ value }) => setAssignee(value)}
            />
          </FormControl>
        </View.Item>
        <View.Item grow>
          <FormControl>
            <FormControl.Label>Project</FormControl.Label>
            <TextField
              name="project"
              placeholder="Project name"
              value={project ?? ''}
              onChange={({ value }) => setProject(value)}
            />
          </FormControl>
        </View.Item>
      </View>

      <FormControl>
        <FormControl.Label>Estimate (points)</FormControl.Label>
        <TextField
          name="estimate"
          placeholder="e.g. 5"
          value={estimate ?? ''}
          onChange={({ value }) => setEstimate(value)}
        />
      </FormControl>
    </View>
  )
}

export { statusLabels, priorityLabels }
