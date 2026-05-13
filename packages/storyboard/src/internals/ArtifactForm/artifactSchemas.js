/**
 * Declarative artifact schemas — the source of truth for all artifact types.
 * Matches the Architect's JSON Schema spec at packages/storyboard/src/core/artifact/schemas/
 *
 * All names: ^[a-z0-9]+(?:-[a-z0-9]+)*$ (kebab-case, max 64 chars)
 */

const NAME_PATTERN = '^[a-z0-9]+(?:-[a-z0-9]+)*$'
const NAME_HINT = 'Kebab-case: lowercase, numbers, hyphens (max 64)'

export const ARTIFACT_SCHEMAS = {
  prototype: {
    label: 'Prototype',
    icon: '📐',
    description: 'Interactive prototype with pages and flows. Add a URL to make it external.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'my-app', pattern: NAME_PATTERN, patternHint: NAME_HINT, maxLength: 64 },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'My App' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What this prototype demonstrates…' },
      { name: 'author', label: 'Author', type: 'text', placeholder: 'dfosco (or comma-separated)' },
      { name: 'folder', label: 'Folder', type: 'text', placeholder: 'main (optional .folder grouping)' },
      { name: 'partial', label: 'Template / Recipe', type: 'select', placeholder: 'Blank prototype', dynamic: 'partials' },
      { name: 'icon', label: 'Icon', type: 'text', placeholder: 'rocket' },
      { name: 'tags', label: 'Tags', type: 'text', placeholder: 'design, exploration (comma-separated)' },
      { name: 'team', label: 'Team', type: 'text', placeholder: 'design-systems' },
      { name: 'url', label: 'External URL', type: 'url', placeholder: 'https://figma.com/… (makes it external)' },
      { name: 'flow', label: 'Create default flow', type: 'checkbox', checkboxLabel: 'Generate a default.flow.json' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
    mutuallyExclusive: [['url', 'flow'], ['url', 'partial']],
  },

  canvas: {
    label: 'Canvas',
    icon: '🎨',
    description: 'Freeform spatial canvas for exploration and planning',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'design-system', pattern: NAME_PATTERN, patternHint: NAME_HINT, maxLength: 64 },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Design Exploration' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Purpose of this canvas…' },
      { name: 'folder', label: 'Folder', type: 'text', placeholder: 'storyboarding (optional grouping)' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },

  component: {
    label: 'Component',
    icon: '🧩',
    description: 'Reusable UI component with story file',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'LoginForm', pattern: '^[A-Z][A-Za-z0-9]+$', patternHint: 'PascalCase (e.g. LoginForm)', maxLength: 64 },
      { name: 'directory', label: 'Directory', type: 'text', placeholder: 'src/components (default)' },
    ],
    operations: ['create', 'delete'],
  },

  flow: {
    label: 'Flow',
    icon: '🔀',
    description: 'Page data context — composes objects via $ref and $global',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'default', pattern: NAME_PATTERN, patternHint: NAME_HINT, maxLength: 64 },
      { name: 'prototype', label: 'Prototype', type: 'select', required: true, options: [], dynamic: 'prototypes' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Settings Flow' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Data context for…' },
      { name: 'globals', label: '$global objects', type: 'text', placeholder: 'navigation, sidebar (comma-separated)' },
      { name: 'folder', label: 'Folder', type: 'text', placeholder: 'Optional subfolder' },
      { name: 'copyFrom', label: 'Copy from', type: 'text', placeholder: 'Existing flow name to duplicate' },
      { name: 'startingPage', label: 'Starting page', type: 'text', placeholder: 'Route to open with this flow' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },

  object: {
    label: 'Object',
    icon: '📦',
    description: 'Reusable data fragment — freeform JSON',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'jane-doe', pattern: NAME_PATTERN, patternHint: NAME_HINT, maxLength: 64 },
      { name: 'folder', label: 'Folder', type: 'text', placeholder: 'Optional folder (or inside prototype for scoping)' },
      { name: 'body', label: 'JSON Body', type: 'code', placeholder: '{\n  "name": "Jane Doe",\n  "role": "admin"\n}', language: 'json' },
    ],
    operations: ['create', 'edit', 'delete', 'duplicate'],
  },

  record: {
    label: 'Record',
    icon: '📋',
    description: 'Collection of entries — array of objects with unique id',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'posts', pattern: NAME_PATTERN, patternHint: NAME_HINT, maxLength: 64 },
      { name: 'folder', label: 'Folder', type: 'text', placeholder: 'Optional folder' },
      { name: 'body', label: 'Entries (JSON array)', type: 'code', placeholder: '[\n  { "id": "first", "title": "First Entry" }\n]', language: 'json' },
    ],
    operations: ['create', 'edit', 'delete'],
  },

  page: {
    label: 'Page',
    icon: '📄',
    description: 'A page inside an existing prototype',
    fields: [
      { name: 'prototype', label: 'Prototype', type: 'select', required: true, options: [], dynamic: 'prototypes' },
      { name: 'path', label: 'Path', type: 'text', required: true, placeholder: 'settings/general', pattern: '^[a-z0-9][a-z0-9-/]*$', patternHint: 'Lowercase path with slashes (e.g. settings/general)' },
      { name: 'folder', label: 'Folder', type: 'text', placeholder: 'Optional subfolder within prototype' },
      { name: 'template', label: 'Template', type: 'text', placeholder: 'Template page to copy from' },
    ],
    operations: ['create', 'delete'],
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

    // Required check
    if (field.required && (!val || (typeof val === 'string' && !val.trim()))) {
      errors[field.name] = `${field.label} is required`
      continue
    }

    // Skip further validation if empty and not required
    if (!val || (typeof val === 'string' && !val.trim())) continue

    // Pattern validation
    if (typeof val === 'string' && field.pattern) {
      const re = new RegExp(field.pattern)
      if (!re.test(val)) {
        errors[field.name] = field.patternHint || 'Invalid format'
      }
    }

    // Max length
    if (typeof val === 'string' && field.maxLength && val.length > field.maxLength) {
      errors[field.name] = `Maximum ${field.maxLength} characters`
    }

    // URL validation
    if (field.type === 'url' && typeof val === 'string') {
      try { new URL(val) } catch { errors[field.name] = 'Must be a valid URL' }
    }

    // JSON validation for code fields
    if (field.type === 'code' && typeof val === 'string') {
      try { JSON.parse(val) } catch { errors[field.name] = 'Invalid JSON' }
    }
  }

  // Mutual exclusivity rules
  if (schema.mutuallyExclusive) {
    for (const group of schema.mutuallyExclusive) {
      const set = group.filter(fieldName => {
        const val = values[fieldName]
        return val && (typeof val === 'string' ? val.trim() : val)
      })
      if (set.length > 1) {
        const labels = set.map(f => schema.fields.find(sf => sf.name === f)?.label || f)
        errors[set[1]] = `Cannot use with ${labels[0]}`
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
