import { useState, useMemo, useEffect } from 'react'
import { Button } from '../../../lib/components/ui/button/index.js'
import { Input } from '../../../lib/components/ui/input/index.js'
import { Label } from '../../../lib/components/ui/label/index.js'
import { Checkbox } from '../../../lib/components/ui/checkbox/index.js'
import * as Panel from '../../../lib/components/ui/panel/index.js'
import * as Alert from '../../../lib/components/ui/alert/index.js'

const CANVAS_SUCCESS_KEY = 'sb-canvas-created'

function getApiUrl() {
  const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
  return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
}

export default function CreateCanvasForm({ onClose }) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [folder, setFolder] = useState('')
  const [grid, setGrid] = useState(true)
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [createdRoute, setCreatedRoute] = useState(null)

  const kebabName = useMemo(
    () =>
      name
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    [name],
  )

  const autoTitle = useMemo(
    () =>
      kebabName
        ? kebabName
            .split('-')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ')
        : '',
    [kebabName],
  )

  const displayTitle = useMemo(
    () => (titleTouched ? title : autoTitle),
    [titleTouched, title, autoTitle],
  )

  const routePreview = useMemo(
    () => (kebabName ? `/canvas/${kebabName}` : ''),
    [kebabName],
  )

  const nameError = useMemo(() => {
    if (name.trim() && !kebabName)
      return 'Name must contain at least one alphanumeric character'
    if (name.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebabName))
      return 'Name must be kebab-case'
    return null
  }, [name, kebabName])

  const canSubmit = useMemo(
    () => !!kebabName && !nameError && !submitting,
    [kebabName, nameError, submitting],
  )

  useEffect(() => {
    // Restore success state after Vite's full-reload on file creation
    try {
      const saved = sessionStorage.getItem(CANVAS_SUCCESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSuccess(parsed.success)
        setCreatedRoute(parsed.route)
        sessionStorage.removeItem(CANVAS_SUCCESS_KEY)
      }
    } catch { /* empty */ }

    async function fetchFolders() {
      try {
        const res = await fetch(getApiUrl() + '/folders')
        if (res.ok) {
          const data = await res.json()
          setFolders(data.folders || [])
        }
      } catch { /* empty */ } finally {
        setLoading(false)
      }
    }
    fetchFolders()
  }, [])

  function handleTitleInput(e) {
    setTitle(e.target.value)
    setTitleTouched(true)
  }

  function handleTitleBlur() {
    if (!title.trim()) setTitleTouched(false)
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setCreatedRoute(null)
    try {
      const res = await fetch(getApiUrl() + '/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          title: displayTitle,
          description: description || undefined,
          folder: folder || undefined,
          grid,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create canvas')
        return
      }
      const msg = `Created ${data.path}`
      setSuccess(msg)
      setCreatedRoute(data.route)
      try {
        sessionStorage.setItem(
          CANVAS_SUCCESS_KEY,
          JSON.stringify({ success: msg, route: data.route }),
        )
      } catch { /* empty */ }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && canSubmit) submit()
  }

  return (
    <div onKeyDown={handleKeydown}>
      <Panel.Header>
        <Panel.Title>Create canvas</Panel.Title>
        <Panel.Close onClick={onClose} />
      </Panel.Header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        <div>
          <Label htmlFor="canvas-name">Name</Label>
          <Input
            id="canvas-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-canvas"
          />
          {nameError && (
            <p style={{ color: 'var(--color-danger-fg, red)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {nameError}
            </p>
          )}
          {routePreview && (
            <p style={{ color: 'var(--color-fg-muted, #666)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {routePreview}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="canvas-title">Title</Label>
          <Input
            id="canvas-title"
            value={displayTitle}
            onChange={handleTitleInput}
            onBlur={handleTitleBlur}
            placeholder="Auto-generated from name"
          />
        </div>

        <div>
          <Label htmlFor="canvas-description">Description</Label>
          <Input
            id="canvas-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div>
          <Label htmlFor="canvas-folder">Folder</Label>
          <select
            id="canvas-folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            disabled={loading}
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            id="canvas-grid"
            checked={grid}
            onCheckedChange={setGrid}
          />
          <Label htmlFor="canvas-grid">Show grid</Label>
        </div>

        {error && (
          <Alert.Root variant="destructive">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}

        {success && (
          <Alert.Root>
            <Alert.Description>
              {success}
              {createdRoute && (
                <>
                  {' — '}
                  <a href={createdRoute}>Open canvas</a>
                </>
              )}
            </Alert.Description>
          </Alert.Root>
        )}
      </div>

      <Panel.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </Panel.Footer>
    </div>
  )
}
