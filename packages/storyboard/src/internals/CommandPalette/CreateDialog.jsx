/**
 * CreateDialog — modal wrapper around the unified ArtifactForm.
 *
 * The form, fields, and validation are entirely schema-driven via
 * ARTIFACT_SCHEMAS. This component supplies modal chrome, fetches dynamic
 * select options (e.g. prototype list), POSTs to the artifact API, and
 * navigates to the resulting route on success.
 */
import { useState, useEffect, useMemo } from 'react'
import ArtifactForm, { ARTIFACT_SCHEMAS } from '../ArtifactForm/ArtifactForm.jsx'

// Map UI command-palette type ids (PascalCase) to schema keys (lowercase)
const TYPE_KEY_MAP = {
  Prototype: 'prototype', Canvas: 'canvas', Component: 'component',
  Flow: 'flow', Object: 'object', Record: 'record', Page: 'page',
}

function withBase(base, route) {
  const b = (base || '/').replace(/\/+$/, '')
  return b === '/' ? route : `${b}${route}`
}

export default function CreateDialog({ type, basePath, onClose }) {
  const schemaKey = type ? (TYPE_KEY_MAP[type] || String(type).toLowerCase()) : null
  const schema = schemaKey ? ARTIFACT_SCHEMAS[schemaKey] : null
  const [prototypes, setPrototypes] = useState([])

  const needsPrototypes = useMemo(() => {
    if (!schema) return false
    return schema.fields.some(f => f.dynamic === 'prototypes')
  }, [schema])

  useEffect(() => {
    if (!needsPrototypes || !schemaKey) return
    const apiBase = (basePath || '/').replace(/\/+$/, '')
    fetch(`${apiBase}/_storyboard/artifact/list?type=prototype`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.items) setPrototypes(data.items.map(p => p.name)) })
      .catch(() => {})
  }, [needsPrototypes, schemaKey, basePath])

  if (!schemaKey || !schema) return null

  async function handleSubmit({ type: t, values }) {
    const apiBase = (basePath || '/').replace(/\/+$/, '')
    const endpoint = `${apiBase}/_storyboard/artifact/`

    // Build payload — include checkboxes that are true, trimmed strings, raw selects
    const payload = { type: t }
    for (const field of schema.fields) {
      const val = values[field.name]
      if (field.type === 'checkbox') {
        if (val) payload[field.name] = true
      } else if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed) payload[field.name] = trimmed
      } else if (val != null) {
        payload[field.name] = val
      }
    }

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
    const route = data.route || data.path || `/${values.name?.trim() || ''}`
    window.location.href = withBase(basePath, route)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <button style={closeBtnStyle} onClick={onClose} aria-label="Close">✕</button>
        <ArtifactForm
          type={schemaKey}
          onSubmit={handleSubmit}
          onCancel={onClose}
          dynamicOptions={{ prototypes }}
        />
      </div>
    </div>
  )
}

// Re-export for canvas/workspace integrations
export { ARTIFACT_SCHEMAS as CREATE_SCHEMAS }

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 10001,
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  paddingTop: '12vh',
}

const dialogStyle = {
  position: 'relative',
  background: 'transparent',
  width: '100%', maxWidth: 520,
  maxHeight: '80vh', overflowY: 'auto',
}

const closeBtnStyle = {
  position: 'absolute', top: 12, right: 12, zIndex: 1,
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: 'var(--fgColor-muted, #999)', padding: 4,
}
