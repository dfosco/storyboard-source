/**
 * ArtifactForm — schema-driven form that renders fields, validation, and
 * submit actions for any artifact type. Surfaces identically across the
 * command palette, canvas add menu, and workspace.
 *
 * Modes:
 *   <ArtifactForm type="prototype" onSubmit={fn} />   // single type
 *   <ArtifactForm onSubmit={fn} />                    // type picker
 *
 * Dynamic select options:
 *   Schemas may declare `field.dynamic = 'prototypes'`. Pass
 *   `dynamicOptions={{ prototypes: ['my-app', ...] }}` to populate them.
 */
import { useState, useMemo, useEffect } from 'react'
import { FormControl, Button, TextInput, Textarea, Flash, Text, ActionMenu, ActionList } from '@primer/react'
import { ARTIFACT_SCHEMAS, validateArtifact } from './artifactSchemas.js'
import styles from './ArtifactForm.module.css'

function TypeSelector({ selected, onChange }) {
  const types = Object.entries(ARTIFACT_SCHEMAS)
  const current = ARTIFACT_SCHEMAS[selected]

  return (
    <ActionMenu>
      <ActionMenu.Button className={styles.typeButton}>
        {current?.icon} {current?.label || 'Select type…'}
      </ActionMenu.Button>
      <ActionMenu.Overlay width="medium">
        <ActionList selectionVariant="single">
          {types.map(([key, schema]) => (
            <ActionList.Item key={key} selected={key === selected} onSelect={() => onChange(key)}>
              <ActionList.LeadingVisual>{schema.icon}</ActionList.LeadingVisual>
              {schema.label}
              <ActionList.Description variant="block">{schema.description}</ActionList.Description>
            </ActionList.Item>
          ))}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  )
}

function FieldRenderer({ field, value, error, onChange, options }) {
  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <TextInput
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          block
          type={field.type === 'url' ? 'url' : 'text'}
          validationStatus={error ? 'error' : undefined}
        />
      )
    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          block
          rows={3}
        />
      )
    case 'code':
      return (
        <Textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          block
          rows={8}
          className={styles.codeField}
        />
      )
    case 'select':
      // options may be an array of strings or objects { value, label, group }.
      // When grouped, we render <optgroup>s so templates and recipes appear
      // under headings (mirrors the workshop form's grouping).
      {
        const norm = (options || []).map(o =>
          typeof o === 'string' ? { value: o, label: o, group: null } : { group: null, ...o }
        )
        const grouped = norm.some(o => o.group)
        return (
          <select
            className={styles.select}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">{field.placeholder || 'Select…'}</option>
            {grouped
              ? Object.entries(norm.reduce((acc, opt) => {
                  const key = opt.group || 'Other'
                  ;(acc[key] = acc[key] || []).push(opt)
                  return acc
                }, {})).map(([group, opts]) => (
                  <optgroup key={group} label={group}>
                    {opts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </optgroup>
                ))
              : norm.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
            }
          </select>
        )
      }
    case 'checkbox':
      return (
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
          />
          <span>{field.checkboxLabel || field.label}</span>
        </label>
      )
    default:
      return null
  }
}

function initialValues(schema) {
  const initial = {}
  if (schema) {
    for (const field of schema.fields) {
      initial[field.name] = field.default ?? ''
    }
  }
  return initial
}

export default function ArtifactForm({
  type: fixedType,
  onSubmit,
  onCancel,
  operation = 'create',
  compact = false,
  dynamicOptions = {},
  initialValues: initialOverride,
  hideHeader = false,
}) {
  const [selectedType, setSelectedType] = useState(fixedType || 'prototype')
  const activeType = fixedType || selectedType
  const schema = ARTIFACT_SCHEMAS[activeType]

  const [values, setValues] = useState(() => ({ ...initialValues(schema), ...(initialOverride || {}) }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Reset form when fixed type changes (parent-controlled)
  useEffect(() => {
    if (!fixedType) return
    setValues({ ...initialValues(ARTIFACT_SCHEMAS[fixedType]), ...(initialOverride || {}) })
    setErrors({})
    setSubmitting(false)
  }, [fixedType])

  function handleTypeChange(newType) {
    setSelectedType(newType)
    setValues(initialValues(ARTIFACT_SCHEMAS[newType]))
    setErrors({})
  }

  const [showAdvanced, setShowAdvanced] = useState(false)

  const visibleFields = useMemo(() => {
    if (!schema) return []
    if (compact) return schema.fields.filter(f => f.required)
    // Hide mutually-exclusive partner once one side is set
    let fields = schema.fields
    if (schema.mutuallyExclusive) {
      fields = fields.filter(f => {
        for (const group of schema.mutuallyExclusive) {
          if (!group.includes(f.name)) continue
          const otherSet = group.find(o => o !== f.name && values[o])
          if (otherSet) return false
        }
        return true
      })
    }
    return fields
  }, [schema, compact, values])

  // Split into basic/advanced. A field with no `tier` defaults to 'basic'
  // (matches the old behaviour for any schema not yet annotated).
  const { basicFields, advancedFields } = useMemo(() => {
    const basic = []
    const advanced = []
    for (const f of visibleFields) {
      if (f.tier === 'advanced') advanced.push(f)
      else basic.push(f)
    }
    return { basicFields: basic, advancedFields: advanced }
  }, [visibleFields])

  if (!schema) {
    return (
      <Flash variant="warning">
        Unknown artifact type: <code>{activeType}</code>
      </Flash>
    )
  }

  function handleChange(fieldName, value) {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors(prev => { const next = { ...prev }; delete next[fieldName]; return next })
    }
    if (errors._form) {
      setErrors(prev => { const next = { ...prev }; delete next._form; return next })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { valid, errors: fieldErrors } = validateArtifact(activeType, values)
    if (!valid) { setErrors(fieldErrors); return }
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit({ type: activeType, operation, values })
    } catch (err) {
      setErrors({ _form: err?.message || 'Submit failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-compact={compact || undefined} data-bare={hideHeader || undefined}>
      {!hideHeader && (
        <header className={styles.header}>
          <h3 className={styles.title}>
            {operation === 'create' ? 'New' : 'Edit'} {schema.label}
          </h3>
          {!compact && (
            <Text as="p" className={styles.description}>{schema.description}</Text>
          )}
        </header>
      )}

      {!fixedType && (
        <nav className={styles.typePicker}>
          <TypeSelector selected={activeType} onChange={handleTypeChange} />
        </nav>
      )}

      <div className={styles.fields}>
        {basicFields.map(field => {
          const options = field.dynamic ? dynamicOptions[field.dynamic] : field.options
          return (
            <FormControl key={field.name} required={field.required}>
              <FormControl.Label>{field.label}</FormControl.Label>
              <FieldRenderer
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={val => handleChange(field.name, val)}
                options={options}
              />
              {errors[field.name] && (
                <FormControl.Validation variant="error">
                  {errors[field.name]}
                </FormControl.Validation>
              )}
              {field.patternHint && !errors[field.name] && (
                <FormControl.Caption>{field.patternHint}</FormControl.Caption>
              )}
            </FormControl>
          )
        })}

        {advancedFields.length > 0 && (
          <>
            <Button
              type="button"
              variant="invisible"
              size="small"
              onClick={() => setShowAdvanced(s => !s)}
              className={styles.advancedToggle}
            >
              {showAdvanced ? '− Hide advanced fields' : '+ Advanced fields'}
            </Button>
            {showAdvanced && advancedFields.map(field => {
              const options = field.dynamic ? dynamicOptions[field.dynamic] : field.options
              return (
                <FormControl key={field.name} required={field.required}>
                  <FormControl.Label>{field.label}</FormControl.Label>
                  <FieldRenderer
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name]}
                    onChange={val => handleChange(field.name, val)}
                    options={options}
                  />
                  {errors[field.name] && (
                    <FormControl.Validation variant="error">
                      {errors[field.name]}
                    </FormControl.Validation>
                  )}
                  {field.patternHint && !errors[field.name] && (
                    <FormControl.Caption>{field.patternHint}</FormControl.Caption>
                  )}
                </FormControl>
              )
            })}
          </>
        )}
      </div>

      {errors._form && (
        <Flash variant="danger">{errors._form}</Flash>
      )}

      <footer className={styles.footer}>
        {onCancel && (
          <Button type="button" variant="invisible" onClick={onCancel} size={compact ? 'small' : 'medium'}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={submitting} size={compact ? 'small' : 'medium'}>
          {submitting ? 'Creating…' : `${operation === 'create' ? 'Create' : 'Save'} ${schema.label}`}
        </Button>
      </footer>
    </form>
  )
}

export { TypeSelector, ARTIFACT_SCHEMAS, validateArtifact }
