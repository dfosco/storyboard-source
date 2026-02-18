/**
 * @dfosco/storyboard-react — React framework binding for Storyboard.
 *
 * Provides hooks, context, and provider for React apps.
 * Design-system-agnostic — no Primer, Reshaped, or other UI library deps.
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
export { useLocalStorage } from './hooks/useLocalStorage.js'
export { useHideMode } from './hooks/useHideMode.js'
export { useUndoRedo } from './hooks/useUndoRedo.js'

// React Router integration
export { installHashPreserver } from './hashPreserver.js'

// Form context (for design system packages to use)
export { FormContext } from './context/FormContext.js'

// Viewfinder dashboard
export { default as Viewfinder } from './Viewfinder.jsx'
