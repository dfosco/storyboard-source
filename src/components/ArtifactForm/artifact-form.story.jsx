/**
 * ArtifactForm stories — demonstrates the unified creation UI.
 *
 * Matches Architect's spec: 7 types (prototype, canvas, component,
 * flow, object, record, page). External prototypes are just prototypes
 * with a URL field — no separate type.
 */
import ArtifactForm from './ArtifactForm.jsx'

/** Full form with type dropdown — ActionMenu lets user switch artifact types */
export function TypePicker() {
  return (
    <ArtifactForm
      onSubmit={data => console.log('Create:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Compact mode — required fields only */
export function CompactTypePicker() {
  return (
    <ArtifactForm
      compact
      onSubmit={data => console.log('Create:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Prototype — name, title, desc, author, folder, icon, tags, team, url, flow checkbox */
export function CreatePrototype() {
  return (
    <ArtifactForm
      type="prototype"
      onSubmit={data => console.log('Create prototype:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Canvas — name, title, description, folder */
export function CreateCanvas() {
  return (
    <ArtifactForm
      type="canvas"
      onSubmit={data => console.log('Create canvas:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Component — name (PascalCase), directory */
export function CreateComponent() {
  return (
    <ArtifactForm
      type="component"
      onSubmit={data => console.log('Create component:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Flow — name, prototype, title, desc, globals, folder, copy-from, starting-page */
export function CreateFlow() {
  return (
    <ArtifactForm
      type="flow"
      onSubmit={data => console.log('Create flow:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Object — name, folder, JSON body */
export function CreateObject() {
  return (
    <ArtifactForm
      type="object"
      onSubmit={data => console.log('Create object:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Record — name, folder, JSON array */
export function CreateRecord() {
  return (
    <ArtifactForm
      type="record"
      onSubmit={data => console.log('Create record:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Page — prototype (select), path, folder, template */
export function CreatePage() {
  return (
    <ArtifactForm
      type="page"
      onSubmit={data => console.log('Create page:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Edit mode — shows "Edit" instead of "New", "Save" instead of "Create" */
export function EditPrototype() {
  return (
    <ArtifactForm
      type="prototype"
      operation="edit"
      onSubmit={data => console.log('Save prototype:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Error state for unknown type */
export function UnknownType() {
  return <ArtifactForm type="invalid-type" />
}
