/**
 * CreateDialog — Primer Dialog wrapper around the unified ArtifactForm.
 *
 * The form, fields, and validation are entirely schema-driven via
 * ARTIFACT_SCHEMAS. This component supplies modal chrome (Primer Dialog),
 * fetches dynamic select options (e.g. prototype list), POSTs to the
 * artifact API, and navigates to the resulting route on success.
 */
import { useState, useEffect, useMemo } from 'react'
import { Dialog } from '@primer/react/experimental'
import ArtifactForm, { ARTIFACT_SCHEMAS } from '../ArtifactForm/ArtifactForm.jsx'

// Map UI command-palette type ids (PascalCase) to schema keys (lowercase)
const TYPE_KEY_MAP = {
  Prototype: 'prototype', Canvas: 'canvas', Component: 'component',
  Flow: 'flow', Object: 'object', Record: 'record', Page: 'page',
}

function withBase(base, route) {
  const b = (base || '/').replace(/\/+$/, '')
  const r = route?.startsWith('/') ? route : `/${route || ''}`
  return b === '' || b === '/' ? r : `${b}${r}`
}

export default function CreateDialog({ type, basePath, onClose }) {
  const schemaKey = type ? (TYPE_KEY_MAP[type] || String(type).toLowerCase()) : null
  const schema = schemaKey ? ARTIFACT_SCHEMAS[schemaKey] : null
  const [prototypes, setPrototypes] = useState([])
  const [partials, setPartials] = useState([])

  const needsPrototypes = useMemo(() => {
    if (!schema) return false
    return schema.fields.some(f => f.dynamic === 'prototypes')
  }, [schema])

  const needsPartials = useMemo(() => {
    if (!schema) return false
    return schema.fields.some(f => f.dynamic === 'partials')
  }, [schema])

  useEffect(() => {
    if (!needsPrototypes || !schemaKey) return
    const apiBase = (basePath || '/').replace(/\/+$/, '')
    fetch(`${apiBase}/_storyboard/artifact/list?type=prototype`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.items) setPrototypes(data.items.map(p => p.name)) })
      .catch(() => {})
  }, [needsPrototypes, schemaKey, basePath])

  useEffect(() => {
    if (!needsPartials || !schemaKey) return
    const apiBase = (basePath || '/').replace(/\/+$/, '')
    fetch(`${apiBase}/_storyboard/workshop/prototypes`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.partials) return
        // Map workshop format → grouped select options.
        // Group by scope+kind: "Templates" / "Recipes" for global, "<proto> / Templates" etc. for local.
        const opts = data.partials.map(p => {
          const kindLabel = p.kind === 'recipe' ? 'Recipes' : 'Templates'
          const group = p.scope === 'global'
            ? kindLabel
            : `${p.folder ? p.folder + ' / ' : ''}${p.prototype || 'local'} / ${kindLabel}`
          return { value: p.id, label: p.name, group }
        })
        setPartials(opts)
      })
      .catch(() => {})
  }, [needsPartials, schemaKey, basePath])

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
    // Only navigate when the server gives us an explicit route. Falling back
    // to data.path here is wrong — that's a filesystem path (e.g. "src/canvas"),
    // not a URL route. Types without a route (object/record/component) just close.
    if (data.route) {
      window.location.href = withBase(basePath, data.route)
    } else {
      onClose?.()
    }
  }

  return (
    <Dialog
      title={`New ${schema.label}`}
      subtitle={schema.description}
      onClose={onClose}
      width="large"
    >
      <ArtifactForm
        type={schemaKey}
        onSubmit={handleSubmit}
        onCancel={onClose}
        dynamicOptions={{ prototypes, partials }}
        hideHeader
      />
    </Dialog>
  )
}

// Re-export for canvas/workspace integrations
export { ARTIFACT_SCHEMAS as CREATE_SCHEMAS }
