/**
 * CreateDialog — schema-driven modal for creating storyboard artifacts.
 * Triggered from the command palette's Create actions.
 *
 * Supports all 7 artifact types: prototype, canvas, component, flow, object, record, page.
 * Each type's fields, validation, and API endpoint are driven by SCHEMAS below.
 */
import { useState, useEffect, useMemo } from 'react'

// Kebab-case pattern (shared across most types)
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PASCAL_RE = /^[A-Z][A-Za-z0-9]+$/

const SCHEMAS = {
  Prototype: {
    label: 'Prototype',
    icon: '📐',
    description: 'Interactive prototype with pages and flows',
    fields: [
      { name: 'name', label: 'Name', required: true, placeholder: 'my-app', pattern: NAME_RE, hint: 'kebab-case (a-z, 0-9, hyphens)' },
      { name: 'title', label: 'Title', placeholder: 'Display title' },
      { name: 'description', label: 'Description', placeholder: 'What this prototype demonstrates…', multiline: true },
      { name: 'author', label: 'Author', placeholder: 'github-username' },
      { name: 'folder', label: 'Folder', placeholder: 'main (optional .folder grouping)' },
      { name: 'url', label: 'External URL', placeholder: 'https://… (makes it external, skips flow)', type: 'url' },
      { name: 'flow', label: 'Create default flow', type: 'checkbox', checkboxLabel: 'Generate a default.flow.json' },
    ],
    mutuallyExclusive: [['url', 'flow']],
  },
  Canvas: {
    label: 'Canvas',
    icon: '🎨',
    description: 'Freeform spatial canvas for exploration',
    fields: [
      { name: 'name', label: 'Name', required: true, placeholder: 'design-system', pattern: NAME_RE, hint: 'kebab-case' },
      { name: 'title', label: 'Title', placeholder: 'Display title' },
      { name: 'description', label: 'Description', placeholder: 'Purpose of this canvas…', multiline: true },
      { name: 'folder', label: 'Folder', placeholder: 'storyboarding (optional grouping)' },
    ],
  },
  Component: {
    label: 'Component',
    icon: '🧩',
    description: 'Reusable UI component with story file',
    fields: [
      { name: 'name', label: 'Name', required: true, placeholder: 'LoginForm', pattern: PASCAL_RE, hint: 'PascalCase (e.g. LoginForm)' },
    ],
  },
  Flow: {
    label: 'Flow',
    icon: '🔀',
    description: 'Data context for prototype pages',
    fields: [
      { name: 'prototype', label: 'Prototype', required: true, type: 'prototype-select' },
      { name: 'name', label: 'Name', required: true, placeholder: 'settings-view', pattern: NAME_RE, hint: 'kebab-case' },
      { name: 'title', label: 'Title', placeholder: 'Display title' },
      { name: 'description', label: 'Description', placeholder: 'What data scenario this represents…', multiline: true },
    ],
  },
  Object: {
    label: 'Object',
    icon: '📦',
    description: 'Reusable data fragment (JSON)',
    fields: [
      { name: 'prototype', label: 'Prototype (optional)', type: 'prototype-select' },
      { name: 'name', label: 'Name', required: true, placeholder: 'jane-doe', pattern: NAME_RE, hint: 'kebab-case' },
      { name: 'content', label: 'Initial JSON', placeholder: '{\n  "name": "Jane Doe"\n}', multiline: true, code: true },
    ],
  },
  Record: {
    label: 'Record',
    icon: '📋',
    description: 'Parameterized collection (array with id per entry)',
    fields: [
      { name: 'prototype', label: 'Prototype (optional)', type: 'prototype-select' },
      { name: 'name', label: 'Name', required: true, placeholder: 'posts', pattern: NAME_RE, hint: 'kebab-case' },
      { name: 'content', label: 'Initial JSON', placeholder: '[\n  { "id": "first", "title": "First Post" }\n]', multiline: true, code: true },
    ],
  },
  Page: {
    label: 'Page',
    icon: '📄',
    description: 'New page inside a prototype',
    fields: [
      { name: 'prototype', label: 'Prototype', required: true, type: 'prototype-select' },
      { name: 'name', label: 'Name', required: true, placeholder: 'settings', pattern: NAME_RE, hint: 'kebab-case' },
    ],
  },
}

function validate(schema, values) {
  for (const field of schema.fields) {
    const val = values[field.name]
    if (field.required && !val) return `${field.label} is required`
    if (field.pattern && val && !field.pattern.test(val)) return `${field.label}: ${field.hint}`
    if (field.type === 'url' && val) {
      try { new URL(val) } catch { return 'Invalid URL' }
    }
  }
  // Mutual exclusivity
  if (schema.mutuallyExclusive) {
    for (const [a, b] of schema.mutuallyExclusive) {
      if (values[a] && values[b]) {
        const fa = schema.fields.find(f => f.name === a)
        const fb = schema.fields.find(f => f.name === b)
        return `${fa?.label || a} and ${fb?.label || b} cannot both be set`
      }
    }
  }
  return null
}

export default function CreateDialog({ type, basePath, onClose }) {
  const [values, setValues] = useState({})
  const [prototypes, setPrototypes] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const schema = type ? SCHEMAS[type] : null

  // Reset form when type changes
  useEffect(() => {
    setValues({})
    setError('')
    setSubmitting(false)
  }, [type])

  // Fetch prototypes when needed
  const needsPrototypes = useMemo(() => {
    if (!schema) return false
    return schema.fields.some(f => f.type === 'prototype-select')
  }, [schema])

  useEffect(() => {
    if (!needsPrototypes || !type) return
    const apiBase = (basePath || '/').replace(/\/+$/, '')
    fetch(`${apiBase}/_storyboard/artifact/list?type=prototype`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.items) setPrototypes(data.items.map(p => ({ name: p.name }))) })
      .catch(() => {})
  }, [needsPrototypes, type, basePath])

  if (!type || !schema) return null

  function handleChange(fieldName, value) {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    if (error) setError('')
  }

  function withBase(base, route) {
    const b = (base || '/').replace(/\/+$/, '')
    return b === '/' ? route : `${b}${route}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(schema, values)
    if (err) { setError(err); return }
    setSubmitting(true)

    const apiBase = (basePath || '/').replace(/\/+$/, '')
    const endpoint = `${apiBase}/_storyboard/artifact/`

    // Map UI type names to API type names
    const typeMap = { Prototype: 'prototype', Canvas: 'canvas', Component: 'component', Flow: 'flow', Object: 'object', Record: 'record', Page: 'page' }
    const apiType = typeMap[type]

    // Build payload — trim strings, drop empty values
    const payload = { type: apiType }
    for (const field of schema.fields) {
      const val = values[field.name]
      if (field.type === 'checkbox') {
        if (val) payload[field.name] = true
      } else if (typeof val === 'string' && val.trim()) {
        payload[field.name] = val.trim()
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }
      const data = await res.json().catch(() => ({}))
      const route = data.route || data.path || `/${values.name?.trim()}`
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
          <span style={titleStyle}>{schema.icon} New {schema.label}</span>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p style={descStyle}>{schema.description}</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          {schema.fields.map(field => {
            // Mutual exclusivity: hide disabled field
            if (schema.mutuallyExclusive) {
              for (const [a, b] of schema.mutuallyExclusive) {
                if (field.name === a && values[b]) return null
                if (field.name === b && values[a]) return null
              }
            }

            if (field.type === 'prototype-select') {
              return (
                <label key={field.name} style={fieldStyle}>
                  <span style={labelStyle}>{field.label}{field.required ? ' *' : ''}</span>
                  <select style={inputStyle} value={values[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)}>
                    <option value="">Select a prototype…</option>
                    {prototypes.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </label>
              )
            }

            if (field.type === 'checkbox') {
              return (
                <label key={field.name} style={checkboxFieldStyle}>
                  <input type="checkbox" checked={!!values[field.name]} onChange={e => handleChange(field.name, e.target.checked)} />
                  <span>{field.checkboxLabel || field.label}</span>
                </label>
              )
            }

            if (field.multiline) {
              return (
                <label key={field.name} style={fieldStyle}>
                  <span style={labelStyle}>{field.label}{field.required ? ' *' : ''}</span>
                  <textarea
                    style={{ ...inputStyle, ...(field.code ? codeStyle : {}), minHeight: field.code ? 100 : 60, resize: 'vertical' }}
                    value={values[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.code ? 5 : 3}
                  />
                </label>
              )
            }

            return (
              <label key={field.name} style={fieldStyle}>
                <span style={labelStyle}>{field.label}{field.required ? ' *' : ''}</span>
                <input
                  style={inputStyle}
                  value={values[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  type={field.type === 'url' ? 'url' : 'text'}
                  autoFocus={field.required && schema.fields.indexOf(field) === schema.fields.findIndex(f => f.required)}
                />
                {field.hint && !error && <span style={hintStyle}>{field.hint}</span>}
              </label>
            )
          })}

          {error && <div style={errorStyle}>{error}</div>}

          <div style={footerStyle}>
            <button type="button" style={cancelBtnStyle} onClick={onClose}>Cancel</button>
            <button type="submit" disabled={submitting} style={submitStyle}>
              {submitting ? 'Creating…' : `Create ${schema.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Exported for use by canvas workspace UI
export { SCHEMAS as CREATE_SCHEMAS }

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 10001,
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  paddingTop: '12vh',
}

const dialogStyle = {
  background: 'var(--bgColor-default, #fff)', borderRadius: 12, width: '100%', maxWidth: 440,
  boxShadow: '0 16px 48px rgba(0,0,0,0.15)', overflow: 'hidden',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: 'var(--fgColor-default, #1a1a1a)',
  maxHeight: '75vh', overflowY: 'auto',
}

const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px 8px',
}

const titleStyle = { fontSize: 16, fontWeight: 600 }

const descStyle = { fontSize: 13, color: 'var(--fgColor-muted, #656d76)', margin: '0 20px 12px', lineHeight: 1.4 }

const closeBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: 'var(--fgColor-muted, #999)', padding: 4,
}

const formStyle = { padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4 }

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--fgColor-muted, #555)' }

const hintStyle = { fontSize: 11, color: 'var(--fgColor-muted, #888)', marginTop: 2 }

const inputStyle = {
  padding: '8px 10px', border: '1px solid var(--borderColor-default, #ddd)', borderRadius: 6,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
  background: 'var(--bgColor-default, #fff)', color: 'var(--fgColor-default, #1a1a1a)',
}

const codeStyle = { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 12 }

const checkboxFieldStyle = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fgColor-default, #555)',
}

const errorStyle = {
  fontSize: 13, color: 'var(--fgColor-danger, #ef4444)', background: 'var(--bgColor-danger-muted, #fef2f2)',
  padding: '6px 10px', borderRadius: 6,
}

const footerStyle = { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }

const cancelBtnStyle = {
  padding: '8px 14px', background: 'transparent', color: 'var(--fgColor-muted, #555)',
  border: '1px solid var(--borderColor-default, #ddd)', borderRadius: 8,
  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
}

const submitStyle = {
  padding: '8px 16px', background: 'var(--bgColor-accent-emphasis, #1a1a1a)', color: 'var(--fgColor-onEmphasis, #fff)',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
}
