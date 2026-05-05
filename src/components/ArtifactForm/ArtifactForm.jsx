/**
 * ArtifactForm — a schema-driven form that renders the correct fields,
 * validation, and actions for any artifact type.
 *
 * Can be used in two modes:
 * 1. Single-type: <ArtifactForm type="prototype" /> — renders one form
 * 2. Type-picker: <ArtifactForm /> — renders a segmented type selector + form
 *
 * Driven entirely by the declarative schemas in artifactSchemas.js.
 * Surfaces identically across command palette, add widget menu, and workspace.
 */
import { useState, useMemo } from 'react'
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

function FieldRenderer({ field, value, error, onChange }) {
  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <TextInput
          value={value}
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
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          block
          rows={3}
        />
      )
    case 'code':
      return (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          block
          rows={8}
          className={styles.codeField}
        />
      )
    case 'select':
      return (
        <select
          className={styles.select}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
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

export default function ArtifactForm({ type: fixedType, onSubmit, onCancel, operation = 'create', compact = false }) {
  const [selectedType, setSelectedType] = useState(fixedType || 'prototype')
  const activeType = fixedType || selectedType
  const schema = ARTIFACT_SCHEMAS[activeType]

  const [values, setValues] = useState(() => {
    const initial = {}
    if (schema) {
      for (const field of schema.fields) {
        initial[field.name] = field.default ?? ''
      }
    }
    return initial
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Reset form values when type changes
  function handleTypeChange(newType) {
    setSelectedType(newType)
    const newSchema = ARTIFACT_SCHEMAS[newType]
    const initial = {}
    if (newSchema) {
      for (const field of newSchema.fields) {
        initial[field.name] = field.default ?? ''
      }
    }
    setValues(initial)
    setErrors({})
  }

  const visibleFields = useMemo(() => {
    if (!schema) return []
    // In compact mode, show only required fields
    if (compact) return schema.fields.filter(f => f.required)
    return schema.fields
  }, [schema, compact])

  if (!schema) {
    return (
      <Flash variant="danger">
        Unknown artifact type: <code>{activeType}</code>
      </Flash>
    )
  }

  function handleChange(fieldName, value) {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors(prev => { const next = { ...prev }; delete next[fieldName]; return next })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { valid, errors: fieldErrors } = validateArtifact(activeType, values)
    if (!valid) {
      setErrors(fieldErrors)
      return
    }
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit({ type: activeType, operation, values })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-compact={compact || undefined}>
      <header className={styles.header}>
        <h3 className={styles.title}>
          {operation === 'create' ? 'New' : 'Edit'} {schema.label}
        </h3>
        {!compact && (
          <Text as="p" className={styles.description}>{schema.description}</Text>
        )}
      </header>

      {!fixedType && (
        <nav className={styles.typePicker}>
          <TypeSelector selected={activeType} onChange={handleTypeChange} />
        </nav>
      )}

      <div className={styles.fields}>
        {visibleFields.map(field => (
          <FormControl key={field.name} required={field.required}>
            <FormControl.Label>{field.label}</FormControl.Label>
            <FieldRenderer
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={val => handleChange(field.name, val)}
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
        ))}
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

export { TypeSelector }
