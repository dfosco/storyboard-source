/**
 * CreateDialog — centered modal for creating storyboard artifacts.
 * Triggered from the command palette's Create actions.
 */
import { useState, useEffect } from 'react'

const TYPE_LABELS = {
  Canvas: 'Canvas',
  Prototype: 'Prototype',
  Component: 'Component',
  Flow: 'Prototype Flow',
  Page: 'Prototype Page',
}

export default function CreateDialog({ type, basePath, onClose }) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [isExternal, setIsExternal] = useState(false)
  const [prototype, setPrototype] = useState('')
  const [prototypes, setPrototypes] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const needsPrototype = type === 'Flow' || type === 'Page'

  // Reset form when type changes
  useEffect(() => {
    setName('')
    setTitle('')
    setDescription('')
    setUrl('')
    setIsExternal(false)
    setPrototype('')
    setError('')
    setSubmitting(false)
  }, [type])

  // Fetch prototypes list when needed
  useEffect(() => {
    if (!needsPrototype || !type) return
    const apiBase = (basePath || '/').replace(/\/+$/, '')
    fetch(`${apiBase}/_storyboard/workshop/flows`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.prototypes) setPrototypes(data.prototypes) })
      .catch(() => {})
  }, [needsPrototype, type, basePath])

  if (!type) return null

  function withBase(base, route) {
    const b = (base || '/').replace(/\/+$/, '')
    return b === '/' ? route : `${b}${route}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (needsPrototype && !prototype) { setError('Select a prototype'); return }
    setError('')
    setSubmitting(true)

    const apiBase = (basePath || '/').replace(/\/+$/, '')
    let endpoint, body
    if (type === 'Canvas') {
      endpoint = `${apiBase}/_storyboard/canvas/create`
      body = { name: name.trim(), title: title.trim(), description: description.trim(), grid: true, gridSize: 24 }
    } else if (type === 'Prototype') {
      endpoint = `${apiBase}/_storyboard/workshop/prototypes`
      body = { name: name.trim(), title: title.trim(), description: description.trim() }
      if (isExternal) { body.external = true; body.url = url.trim() }
    } else if (type === 'Flow') {
      endpoint = `${apiBase}/_storyboard/workshop/flows`
      body = { name: name.trim(), title: title.trim(), prototype, description: description.trim() }
    } else if (type === 'Page') {
      endpoint = `${apiBase}/_storyboard/workshop/pages`
      body = { name: name.trim(), prototype }
    } else {
      endpoint = `${apiBase}/_storyboard/canvas/create-story`
      body = { name: name.trim(), location: 'src/components' }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed (${res.status})`)
      }
      const data = await res.json().catch(() => ({}))
      const route = data.route || data.path || `/${name.trim()}`
      window.location.href = withBase(basePath, route)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>New {TYPE_LABELS[type] || type}</span>
          <button style={closeBtnStyle} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {needsPrototype && (
            <label style={fieldStyle}>
              <span style={labelStyle}>Prototype *</span>
              <select style={inputStyle} value={prototype} onChange={e => setPrototype(e.target.value)}>
                <option value="">Select a prototype…</option>
                {prototypes.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </label>
          )}

          <label style={fieldStyle}>
            <span style={labelStyle}>Name *</span>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
              placeholder={type === 'Page' ? 'my-page' : `my-${type.toLowerCase()}`} autoFocus />
          </label>

          {type !== 'Page' && (
            <label style={fieldStyle}>
              <span style={labelStyle}>Title</span>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Display title (optional)" />
            </label>
          )}

          {(type === 'Canvas' || type === 'Prototype') && (
            <label style={fieldStyle}>
              <span style={labelStyle}>Description</span>
              <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Short description (optional)" />
            </label>
          )}

          {type === 'Prototype' && (
            <label style={checkboxFieldStyle}>
              <input type="checkbox" checked={isExternal} onChange={e => setIsExternal(e.target.checked)} />
              <span>External prototype</span>
            </label>
          )}

          {isExternal && (
            <label style={fieldStyle}>
              <span style={labelStyle}>URL *</span>
              <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com" />
            </label>
          )}

          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" disabled={submitting} style={submitStyle}>
            {submitting ? 'Creating…' : `Create ${TYPE_LABELS[type] || type}`}
          </button>
        </form>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 10001,
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  paddingTop: '15vh',
}

const dialogStyle = {
  background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420,
  boxShadow: '0 16px 48px rgba(0,0,0,0.15)', overflow: 'hidden',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px 12px', borderBottom: '1px solid #e5e5e5',
}

const titleStyle = { fontSize: 16, fontWeight: 600, color: '#1a1a1a' }

const closeBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: '#999', padding: 4,
}

const formStyle = { padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4 }

const labelStyle = { fontSize: 13, fontWeight: 500, color: '#555' }

const inputStyle = {
  padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
}

const checkboxFieldStyle = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555',
}

const errorStyle = {
  fontSize: 13, color: '#ef4444', background: '#fef2f2',
  padding: '6px 10px', borderRadius: 6,
}

const submitStyle = {
  padding: '10px 16px', background: '#1a1a1a', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
}
