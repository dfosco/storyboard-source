/**
 * storyboard-core — framework-agnostic data layer.
 *
 * This barrel exports all core utilities that have zero framework dependencies.
 * Any frontend (React, Vue, Alpine, vanilla JS) can use these directly.
 */

// Data index initialization
export { init } from './loader.js'

// Flow, object & record loading
export { loadFlow, listFlows, flowExists, getFlowsForPrototype, loadRecord, findRecord, loadObject, deepMerge } from './loader.js'
// Scoped name resolution
export { resolveFlowName, resolveRecordName, resolveObjectName } from './loader.js'
// Prototype metadata
export { listPrototypes, getPrototypeMetadata } from './loader.js'
// Folder metadata
export { listFolders, getFolderMetadata } from './loader.js'
// Canvas data
export { listCanvases, getCanvasData } from './loader.js'
// Story data
export { listStories, getStoryData } from './loader.js'
// Deprecated scene aliases
export { loadScene, listScenes, sceneExists } from './loader.js'

// Dot-notation path utilities
export { getByPath, setByPath, deepClone } from './dotPath.js'

// URL hash session state (read/write)
export { getParam, setParam, getAllParams, removeParam } from './session.js'

// localStorage persistence
export { getLocal, setLocal, removeLocal, getAllLocal, subscribeToStorage, getStorageSnapshot, notifyChange } from './localStorage.js'

// Hide mode (clean URLs)
export { isHideMode, activateHideMode, deactivateHideMode, getShadow, setShadow, removeShadow, getAllShadows, pushSnapshot, getOverrideHistory, getCurrentSnapshot, getCurrentRoute, getCurrentIndex, getNextIndex, canUndo, canRedo, undo, redo, syncHashToHistory, installHistorySync } from './hideMode.js'
export { interceptHideParams, installHideParamListener } from './interceptHideParams.js'

// Hash change subscription (for reactive frameworks)
export { subscribeToHash, getHashSnapshot } from './hashSubscribe.js'

// Body class sync (overrides + flow → <body> classes)
export { installBodyClassSync, setFlowClass, syncOverrideClasses } from './bodyClasses.js'
// Deprecated alias
export { setSceneClass } from './bodyClasses.js'

// Design modes (mode registry, switching, event bus)
export { registerMode, unregisterMode, getRegisteredModes, getCurrentMode, activateMode, deactivateMode, subscribeToMode, getModeSnapshot, syncModeClasses, on, off, emit, initModesConfig, isModesEnabled, getLockedMode, isModeSwitcherVisible } from './modes.js'

// Tool registry (declared in modes.config.json, state managed at runtime)
export { initTools, setToolAction, setToolState, getToolState, getToolsForMode, subscribeToTools, getToolsSnapshot } from './modes.js'

// Dev tools (vanilla JS, framework-agnostic)
// mountDevTools delegates to the compiled UI bundle so consumers

export { mountDevTools } from './devtools-consumer.js'
export { mountFlowDebug } from './sceneDebug.js'
// Deprecated alias
export { mountSceneDebug } from './sceneDebug.js'

// Single entry point for consumer apps
export { mountStoryboardCore } from './mountStoryboardCore.js'

// Viewfinder utilities
export { hash, resolveFlowRoute, getFlowMeta, buildPrototypeIndex } from './viewfinder.js'
// Deprecated aliases
export { resolveSceneRoute, getSceneMeta } from './viewfinder.js'

// Feature flags
export { initFeatureFlags, getFlag, setFlag, toggleFlag, getAllFlags, resetFlags, getFlagKeys, syncFlagBodyClasses } from './featureFlags.js'

// Command actions (config-driven command menu entries)
export { initCommandActions, registerCommandAction, unregisterCommandAction, setDynamicActions, clearDynamicActions, getActionsForMode, executeAction, getActionChildren, hasChildrenProvider, subscribeToCommandActions, getCommandActionsSnapshot, setRoutingBasePath, isExcludedByRoute } from './commandActions.js'

// Plugin configuration
export { initPlugins, isPluginEnabled, getPluginsConfig } from './plugins.js'

// UI config (project-level chrome overrides)
export { initUIConfig, isMenuHidden, getHiddenItems } from './uiConfig.js'

// Tool registry (declarative tool system)
export { initToolRegistry, registerToolModule, setToolComponent, setToolGuardResult, getToolComponent, getToolModule, getToolsForToolbar, getToolConfig, getAllToolConfigs, subscribeToToolRegistry, getToolRegistrySnapshot } from './toolRegistry.js'

// Toolbar config store (reactive layered overrides: core → custom → prototype → user)
export { initToolbarConfig, setPrototypeToolbarConfig, clearPrototypeToolbarConfig, getToolbarConfig, subscribeToToolbarConfig, getToolbarConfigSnapshot, setClientToolbarOverrides, consumeClientToolbarOverrides } from './toolbarConfigStore.js'

// Toolbar tool state management (runtime state for toolbar tools)
export { TOOL_STATES, initToolbarToolStates, setToolbarToolState, getToolbarToolState, isToolbarToolLocalOnly, subscribeToToolbarToolStates, getToolbarToolStatesSnapshot } from './toolStateStore.js'

// Comments system
export { initCommentsConfig, getCommentsConfig, isCommentsEnabled } from './comments/config.js'

// Canvas config (paste rules, canvas-level overrides)
export { initCanvasConfig, getPasteRules, getTerminalConfig, getAgentsConfig, isTerminalResizable, getTerminalDimensions, getCanvasZoom } from './canvasConfig.js'
export { getCommandPaletteConfig, initCommandPaletteConfig } from './commandPaletteConfig.js'

// Unified config store
export { initConfig, getConfig, setOverrides, clearOverrides, clearAllOverrides, subscribeToConfig, getConfigSnapshot } from './configStore.js'

// Customer mode config
export { initCustomerModeConfig, getCustomerModeConfig, isCustomerMode } from './customerModeConfig.js'

// Theme
export {
  setTheme,
  getTheme,
  themeState,
  themeSyncState,
  THEMES,
  getThemeSyncTargets,
  setThemeSyncTarget,
} from './stores/themeStore.js'

// Recent artifacts (command palette recents)
export { trackRecent, getRecent, clearRecent } from './recentArtifacts.js'

// Fuzzy search (scoring used by command palette custom filter)
export { scoreMatch } from './fuzzySearch.js'

// Icon component for UI rendering
export { default as Icon, default as IconDefault } from './Icon.jsx'

// Shared UI components
export { default as BranchSelect } from './BranchSelect.jsx'
