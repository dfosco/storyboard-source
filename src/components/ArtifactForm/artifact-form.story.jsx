/**
 * ArtifactForm stories — demonstrates the unified creation UI.
 *
 * Based on reference images showing:
 * - Type picker with segmented control across top
 * - Individual artifact forms (prototype, canvas, component, etc.)
 * - Compact mode with dropdown type selector
 * - Code/JSON editing for objects, records, flows
 * - Validation states
 */
import ArtifactForm from './ArtifactForm.jsx'

/** Full form with type picker — segmented control lets user switch artifact types */
export function TypePicker() {
  return (
    <ArtifactForm
      onSubmit={data => console.log('Create:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Compact mode — dropdown type selector, only required fields shown */
export function CompactTypePicker() {
  return (
    <ArtifactForm
      compact
      onSubmit={data => console.log('Create:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create Prototype — name, title, description, author, icon, tags, team */
export function CreatePrototype() {
  return (
    <ArtifactForm
      type="prototype"
      onSubmit={data => console.log('Create prototype:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create External Prototype — name, URL (required), title, description */
export function CreateExternalPrototype() {
  return (
    <ArtifactForm
      type="external-prototype"
      onSubmit={data => console.log('Create external:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create Canvas — name, title, description */
export function CreateCanvas() {
  return (
    <ArtifactForm
      type="canvas"
      onSubmit={data => console.log('Create canvas:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create Component — name (PascalCase), location select, format select */
export function CreateComponent() {
  return (
    <ArtifactForm
      type="component"
      onSubmit={data => console.log('Create component:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create Object — name + JSON code editor */
export function CreateObject() {
  return (
    <ArtifactForm
      type="object"
      onSubmit={data => console.log('Create object:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create Record — name + JSON array editor */
export function CreateRecord() {
  return (
    <ArtifactForm
      type="record"
      onSubmit={data => console.log('Create record:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  )
}

/** Create Flow — name, prototype select, $global, JSON body */
export function CreateFlow() {
  return (
    <ArtifactForm
      type="flow"
      onSubmit={data => console.log('Create flow:', data)}
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
