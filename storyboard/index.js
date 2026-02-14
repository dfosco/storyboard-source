/**
 * Main storyboard barrel — re-exports everything from core and react layers.
 *
 * Consumers can import from here for convenience, or directly from
 * './core' (framework-agnostic) or './react' (React-specific).
 */

// Core (framework-agnostic)
export { init } from './core/index.js'
export { getByPath, setByPath, deepClone } from './core/index.js'
export { loadScene, sceneExists, loadRecord, findRecord, deepMerge } from './core/index.js'
export { getParam, setParam, getAllParams, removeParam } from './core/index.js'
export { subscribeToHash, getHashSnapshot } from './core/index.js'

// React layer
export { default as StoryboardProvider } from './internals/context.jsx'
export { useSceneData, useSceneLoading } from './internals/hooks/useSceneData.js'
export { useOverride } from './internals/hooks/useOverride.js'
export { useOverride as useSession } from './internals/hooks/useOverride.js' // deprecated alias
export { useScene } from './internals/hooks/useScene.js'
export { useRecord, useRecords } from './internals/hooks/useRecord.js'
export { useRecordOverride } from './internals/hooks/useRecordOverride.js'
export { installHashPreserver } from './internals/hashPreserver.js'
export { default as DevTools } from './internals/components/DevTools/DevTools.jsx'
export { default as StoryboardForm } from './internals/components/StoryboardForm.jsx'
export { default as TextInput } from './internals/components/TextInput.jsx'
export { default as Checkbox } from './internals/components/Checkbox.jsx'
export { default as Select } from './internals/components/Select.jsx'
export { default as Textarea } from './internals/components/Textarea.jsx'
