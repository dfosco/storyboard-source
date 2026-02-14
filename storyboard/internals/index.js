/**
 * storyboard-react — React-specific layer.
 *
 * Re-exports all React hooks, components, and context providers
 * that depend on React, React Router, or Primer React.
 */

// Context & Provider
export { default as StoryboardProvider } from './context.jsx'
export { StoryboardContext } from './StoryboardContext.js'

// Hooks
export { useSceneData, useSceneLoading } from './hooks/useSceneData.js'
export { useOverride } from './hooks/useOverride.js'
export { useOverride as useSession } from './hooks/useOverride.js' // deprecated alias
export { useScene } from './hooks/useScene.js'
export { useRecord, useRecords } from './hooks/useRecord.js'
export { useRecordOverride } from './hooks/useRecordOverride.js'

// React Router integration
export { installHashPreserver } from './hashPreserver.js'

// Components (Primer React wrappers)
export { default as DevTools } from './components/DevTools/DevTools.jsx'
export { default as StoryboardForm } from './components/StoryboardForm.jsx'
export { default as TextInput } from './components/TextInput.jsx'
export { default as Checkbox } from './components/Checkbox.jsx'
export { default as Select } from './components/Select.jsx'
export { default as Textarea } from './components/Textarea.jsx'
