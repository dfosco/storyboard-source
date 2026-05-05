/**
 * Declarative artifact schemas — the source of truth for all artifact types.
 * Each schema defines fields, validation, defaults, and operations.
 */

export const ARTIFACT_SCHEMAS = {
  prototype: {
    label: 'Prototype',
    icon: '📐',
    description: 'A new interactive prototype with pages and flows',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'my-prototype', pattern: '^[a-z0-9][a-z0-9-]*$', patternHint: 'Lowercase letters, numbers, and hyphens' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'My Prototype' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What this prototype demonstrates…' },
      { name: 'author', label: 'Author', type: 'text', placeholder: 'dfosco' },
      { name: 'icon', label: 'Icon', type: 'text', placeholder: 'rocket' },
      { name: 'tags', label: 'Tags', type: 'text', placeholder: 'design, exploration (comma-separated)' },
      { name: 'team', label: 'Team', type: 'text', placeholder: 'design-systems' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },

  'external-prototype': {
    label: 'External',
    icon: '🔗',
    description: 'Link to a prototype hosted elsewhere — opens in a new tab',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'external-app', pattern: '^[a-z0-9][a-z0-9-]*$', patternHint: 'Lowercase letters, numbers, and hyphens' },
      { name: 'url', label: 'URL', type: 'url', required: true, placeholder: 'https://example.com/prototype' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'External App' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What this links to…' },
      { name: 'author', label: 'Author', type: 'text', placeholder: 'dfosco' },
    ],
    operations: ['create', 'edit', 'delete'],
  },

  canvas: {
    label: 'Canvas',
    icon: '🎨',
    description: 'A freeform spatial canvas for exploration and planning',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'my-canvas', pattern: '^[a-z0-9][a-z0-9-/]*$', patternHint: 'Lowercase letters, numbers, hyphens, slashes' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Design Exploration' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Purpose of this canvas…' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },

  component: {
    label: 'Component',
    icon: '🧩',
    description: 'A reusable UI component with story file',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'MyComponent', pattern: '^[A-Z][A-Za-z0-9]+$', patternHint: 'PascalCase (e.g. LoginForm)' },
      { name: 'location', label: 'Location', type: 'select', required: true, options: ['src/components', 'src/prototypes'], default: 'src/components' },
      { name: 'format', label: 'Format', type: 'select', options: ['jsx', 'tsx'], default: 'jsx' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'My Component' },
    ],
    operations: ['create', 'delete'],
  },

  object: {
    label: 'Object',
    icon: '📦',
    description: 'A reusable data fragment — freeform JSON',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'jane-doe', pattern: '^[a-z0-9][a-z0-9-]*$', patternHint: 'Lowercase letters, numbers, and hyphens' },
      { name: 'body', label: 'JSON Body', type: 'code', placeholder: '{\n  "name": "Jane Doe",\n  "role": "admin"\n}', language: 'json' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },

  record: {
    label: 'Record',
    icon: '📋',
    description: 'A collection of entries — array of objects with unique id',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'posts', pattern: '^[a-z0-9][a-z0-9-]*$', patternHint: 'Lowercase letters, numbers, and hyphens' },
      { name: 'body', label: 'Entries (JSON array)', type: 'code', placeholder: '[\n  { "id": "first", "title": "First Entry" }\n]', language: 'json' },
    ],
    operations: ['create', 'edit', 'delete'],
  },

  flow: {
    label: 'Flow',
    icon: '🔀',
    description: 'Page data context — composes objects via $ref and $global',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'default', pattern: '^[a-z0-9][a-z0-9-]*$', patternHint: 'Lowercase letters, numbers, and hyphens' },
      { name: 'prototype', label: 'Prototype', type: 'select', required: true, options: [], dynamic: 'prototypes' },
      { name: 'globals', label: '$global objects', type: 'text', placeholder: 'navigation, sidebar (comma-separated)' },
      { name: 'body', label: 'Flow Body (JSON)', type: 'code', placeholder: '{\n  "user": { "$ref": "jane-doe" },\n  "settings": { "theme": "dark" }\n}', language: 'json' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },
}

/**
 * Validate a form values object against a schema.
 * Returns { valid: boolean, errors: Record<string, string> }
 */
export function validateArtifact(type, values) {
  const schema = ARTIFACT_SCHEMAS[type]
  if (!schema) return { valid: false, errors: { _form: `Unknown type: ${type}` } }

  const errors = {}

  for (const field of schema.fields) {
    const val = values[field.name]

    if (field.required && (!val || (typeof val === 'string' && !val.trim()))) {
      errors[field.name] = `${field.label} is required`
      continue
    }

    if (val && typeof val === 'string' && field.pattern) {
      const re = new RegExp(field.pattern)
      if (!re.test(val)) {
        errors[field.name] = field.patternHint || 'Invalid format'
      }
    }

    if (val && field.type === 'url') {
      try { new URL(val) } catch { errors[field.name] = 'Must be a valid URL' }
    }

    if (val && field.type === 'code') {
      try { JSON.parse(val) } catch { errors[field.name] = 'Invalid JSON' }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
