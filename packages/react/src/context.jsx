import { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// Named import seeds the core data index via init() AND provides canvas/story route data
import { canvases, stories } from 'virtual:storyboard-data-index'
import { loadFlow, flowExists, findRecord, deepMerge, setFlowClass, installBodyClassSync, resolveFlowName, resolveRecordName, isModesEnabled, getPrototypeMetadata } from '@dfosco/storyboard-core'
import { StoryboardContext } from './StoryboardContext.js'
import usePrototypeReloadGuard from './hooks/usePrototypeReloadGuard.js'
import styles from './FlowError.module.css'

export { StoryboardContext }

const CanvasPageLazy = lazy(() => import('./canvas/CanvasPage.jsx'))
const StoryPageLazy = lazy(() => import('./story/StoryPage.jsx'))
const CommandPaletteLazy = lazy(() => import('./CommandPalette/CommandPalette.jsx'))

// Build a map from canvas route paths → canvas names at module load time
const canvasRouteMap = new Map()
// Build a map from group name → array of { name, route, title } for page selector
const canvasGroupMap = new Map()
for (const [name, data] of Object.entries(canvases || {})) {
  const route = (data?._route || `/canvas/${name}`).replace(/\/+$/, '')
  canvasRouteMap.set(route, name)
  const group = data?._group
  if (group) {
    if (!canvasGroupMap.has(group)) canvasGroupMap.set(group, [])
    canvasGroupMap.get(group).push({
      name,
      route,
      title: data?.title || name.split('/').pop(),
      _canvasMeta: data?._canvasMeta || null,
    })
  }
}
// Sort each group's pages by pageOrder from .meta.json (if available)
for (const [, pages] of canvasGroupMap) {
  const pageOrder = pages[0]?._canvasMeta?.pageOrder
  if (Array.isArray(pageOrder)) {
    const orderMap = new Map()
    pageOrder.forEach((entry, idx) => {
      if (typeof entry === 'string' && !entry.startsWith('sep-')) orderMap.set(entry, idx)
    })
    pages.sort((a, b) => {
      const ai = orderMap.has(a.name) ? orderMap.get(a.name) : Infinity
      const bi = orderMap.has(b.name) ? orderMap.get(b.name) : Infinity
      return ai - bi
    })
  }
}

function matchCanvasRoute(pathname) {
  const normalized = stripBasePath(pathname)
  return canvasRouteMap.get(normalized) || null
}

/**
 * Live-lookup a story route against the current `stories` object.
 *
 * Unlike the canvas route map (built once at module scope), this iterates
 * the `stories` object on every call so it always reflects HMR mutations
 * (the virtual-module HMR handler mutates `stories` in place).
 *
 * Also strips encoded query strings (%3F / %3f) that can leak into the
 * pathname when an iframe src is percent-encoded incorrectly.
 */
function matchStoryRoute(pathname) {
  let normalized = stripBasePath(pathname)
  // Strip encoded query strings that leaked into the path (%3F / %3f = ?)
  const encodedIdx = normalized.search(/%3f/i)
  if (encodedIdx !== -1) normalized = normalized.substring(0, encodedIdx)
  const literalIdx = normalized.indexOf('?')
  if (literalIdx !== -1) normalized = normalized.substring(0, literalIdx)

  for (const [name, data] of Object.entries(stories || {})) {
    if (data?._route && data._route.replace(/\/+$/, '') === normalized) {
      return name
    }
  }
  return null
}

/**
 * Strip the app's sub-path prefix (e.g. /storyboard) from the pathname.
 * React Router's basename strips the branch prefix but not the app name prefix
 * when the app runs under a nested base path.
 */
function stripBasePath(pathname) {
  let p = pathname.replace(/\/+$/, '') || '/'
  // BASE_URL includes branch prefix + app path (e.g. /branch--name/storyboard/)
  // React Router strips the branch prefix but may leave the app sub-path
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '')
  if (base && base !== '/') {
    // Extract just the last segment(s) after the branch prefix
    const withoutBranch = base.replace(/^\/branch--[^/]+/, '')
    const subPath = withoutBranch.replace(/\/+$/, '')
    if (subPath && p.startsWith(subPath)) {
      p = p.slice(subPath.length) || '/'
    }
  }
  return p
}

function isCanvasPath(pathname) {
  const normalized = stripBasePath(pathname)
  return normalized === '/canvas' || normalized.startsWith('/canvas/')
}

function isStoryPath(pathname) {
  const normalized = stripBasePath(pathname)
  return normalized === '/components' || normalized.startsWith('/components/')
}

/**
 * Derives the top-level prototype name from a pathname.
 * "/Dashboard" → "Dashboard", "/Dashboard/sub" → "Dashboard"
 * "/posts/123" → "posts", "/" → null
 */
function getPrototypeName(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return null
  const segments = path.split('/').filter(Boolean)
  return segments[0] || null
}

/**
 * Derives a flow name from a pathname.
 * "/Overview" → "Overview", "/" → "index", "/nested/Page" → "Page"
 */
function getPageFlowName(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'index'
  const last = path.split('/').pop()
  return last || 'index'
}

/**
 * Provides loaded flow data to the component tree.
 * Reads the flow name from the ?flow= URL param (with ?scene= as alias),
 * a matching flow file for the current page, or defaults to "default".
 *
 * Derives the prototype scope from the route and uses it to resolve
 * scoped flow and record names (e.g. "Dashboard/default" for /Dashboard).
 *
 * Optionally merges record data when `recordName` and `recordParam` are provided.
 * The matched record entry is injected under the "record" key in flow data.
 */
export default function StoryboardProvider({ flowName, sceneName, recordName, recordParam, children }) {
  const basePath = import.meta.env?.BASE_URL || '/'

  // Suppress HMR full-reloads when prototype-auto-reload flag is off
  usePrototypeReloadGuard()

  return (
    <>
      <StoryboardProviderInner
        flowName={flowName}
        sceneName={sceneName}
        recordName={recordName}
        recordParam={recordParam}
      >
        {children}
      </StoryboardProviderInner>
      <Suspense fallback={null}>
        <CommandPaletteLazy basePath={basePath} />
      </Suspense>
    </>
  )
}

function StoryboardProviderInner({ flowName, sceneName, recordName, recordParam, children }) {
  const location = useLocation()
  const params = useParams()

  // Re-evaluate story route detection when the data index changes via HMR.
  // The virtual-module HMR handler mutates `stories` in place and dispatches
  // this event; bumping the key forces useMemo deps to re-fire.
  const [storyIndexKey, setStoryIndexKey] = useState(0)
  useEffect(() => {
    const handler = () => setStoryIndexKey((k) => k + 1)
    document.addEventListener('storyboard:story-index-changed', handler)
    return () => document.removeEventListener('storyboard:story-index-changed', handler)
  }, [])

  // Story route detection — matches current URL against registered story routes
  // storyIndexKey forces re-evaluation when HMR mutates the stories object in place
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const storyName = useMemo(() => matchStoryRoute(location.pathname), [location.pathname, storyIndexKey])
  const isMissingStoryRoute = useMemo(
    () => isStoryPath(location.pathname) && !storyName,
    [location.pathname, storyName],
  )

  // Canvas route detection — matches current URL against registered canvas routes
  const canvasId = useMemo(() => matchCanvasRoute(location.pathname), [location.pathname])
  const isMissingCanvasRoute = useMemo(
    () => isCanvasPath(location.pathname) && !canvasId && !storyName,
    [location.pathname, canvasId, storyName],
  )

  const searchParams = new URLSearchParams(location.search)
  const sceneParam = searchParams.get('flow') || searchParams.get('scene')
  const prototypeName = getPrototypeName(location.pathname)
  const pageFlow = getPageFlowName(location.pathname)

  // Resolve flow name with prototype scoping (skip for canvas/story pages)
  const activeFlowName = useMemo(() => {
    if (canvasId || isMissingCanvasRoute || storyName || isMissingStoryRoute) return null
    const requested = sceneParam || flowName || sceneName
    if (requested) {
      // Allow fully-scoped flow names from URLs/widgets without re-prefixing
      // (e.g. "Proto/flow" should not become "Proto/Proto/flow").
      if (requested.includes('/')) return requested
      return resolveFlowName(prototypeName, requested)
    }
    // 1. Page-specific flow (e.g., Example/Forms)
    const scopedPageFlow = resolveFlowName(prototypeName, pageFlow)
    if (flowExists(scopedPageFlow)) return scopedPageFlow
    // 2. Prototype flow — named after the prototype folder (e.g., Example/example)
    if (prototypeName) {
      const protoFlow = resolveFlowName(prototypeName, prototypeName)
      if (flowExists(protoFlow)) return protoFlow
    }
    // 3. Prototype-scoped default (e.g. Example/default)
    if (prototypeName) {
      const scopedDefault = resolveFlowName(prototypeName, 'default')
      if (flowExists(scopedDefault)) return scopedDefault
    }
    // 4. Global default — or null if no flow exists at all
    if (flowExists('default')) return 'default'
    return null
  }, [canvasId, isMissingCanvasRoute, storyName, isMissingStoryRoute, sceneParam, flowName, sceneName, prototypeName, pageFlow])

  // Auto-install body class sync (sb-key--value classes on <body>)
  useEffect(() => installBodyClassSync(), [])

  // Update document.title to reflect the current artifact
  useEffect(() => {
    const base = import.meta.env?.BASE_URL || '/'
    const branchMatch = base.match(/\/branch--([^/]+)/)
    const branchSuffix = branchMatch ? ` (${branchMatch[1]})` : ''

    let title
    if (canvasId) {
      const canvasData = canvases?.[canvasId]
      const meta = canvasData?._canvasMeta
      const pageTitle = canvasData?.title || canvasId.split('/').pop()
      title = (meta?.title || pageTitle) + ' · Storyboard'
    } else if (prototypeName) {
      title = prototypeName + ' · Storyboard'
    } else {
      title = 'Storyboard'
    }

    document.title = title + branchSuffix
  }, [canvasId, prototypeName])

  // Mount design modes UI when enabled in storyboard.config.json
  useEffect(() => {
    if (!isModesEnabled()) return

    let cleanup
    import('@dfosco/storyboard-core/ui-runtime')
      .then(({ mountDesignModes }) => {
        cleanup = mountDesignModes()
      })
      .catch(() => {
        // UI not available — degrade gracefully
      })

    return () => cleanup?.()
  }, [])

  // Skip flow loading for canvas/story pages and flow-less pages
  const { data, error, flowTokens } = useMemo(() => {
    if (canvasId || isMissingCanvasRoute || storyName || isMissingStoryRoute) return { data: null, error: null, flowTokens: null }
    if (!activeFlowName) return { data: {}, error: null, flowTokens: null }
    try {
      let flowData = loadFlow(activeFlowName)

      // Extract tokens before passing data to consumers (reserved metadata key)
      const extractedTokens = flowData?.tokens || null
      if (flowData?.tokens) {
        flowData = { ...flowData }
        delete flowData.tokens
      }

      // Merge record data if configured (with scoped resolution)
      if (recordName && recordParam && params[recordParam]) {
        const resolvedRecord = resolveRecordName(prototypeName, recordName)
        const entry = findRecord(resolvedRecord, params[recordParam])
        if (entry) {
          flowData = deepMerge(flowData, { record: entry })
        }
      }

      setFlowClass(activeFlowName)
      return { data: flowData, error: null, flowTokens: extractedTokens }
    } catch (err) {
      return { data: null, error: err.message, flowTokens: null }
    }
  }, [canvasId, isMissingCanvasRoute, storyName, isMissingStoryRoute, activeFlowName, recordName, recordParam, params, prototypeName])

  // Resolve prototype-level tokens from .prototype.json metadata
  const protoTokens = useMemo(() => {
    if (!prototypeName) return null
    const meta = getPrototypeMetadata(prototypeName)
    return meta?.tokens || null
  }, [prototypeName])

  // Merge prototype + flow tokens (flow wins). Stable reference when tokens don't change.
  const mergedTokens = useMemo(() => {
    if (!protoTokens && !flowTokens) return null
    return { ...(protoTokens || {}), ...(flowTokens || {}) }
  }, [protoTokens, flowTokens])

  // Track which URL params were set by tokens (vs. user-explicit params)
  const managedParamsRef = useRef({})

  // Apply merged tokens to URL search params via replaceState.
  // Only sets params not already present (user-explicit wins on first load).
  // Cleans up stale managed params when flow/prototype tokens change.
  useEffect(() => {
    const url = new URL(window.location.href)
    const managed = managedParamsRef.current
    const nextManaged = {}
    let changed = false

    // Remove stale managed params no longer in merged tokens
    for (const key of Object.keys(managed)) {
      if (!mergedTokens || !(key in mergedTokens)) {
        url.searchParams.delete(key)
        changed = true
      }
    }

    // Apply current tokens
    if (mergedTokens) {
      const reserved = new Set(['flow', 'scene'])
      for (const [key, value] of Object.entries(mergedTokens)) {
        if (value == null || typeof value === 'object' || reserved.has(key)) continue
        const strValue = String(value)
        if (!url.searchParams.has(key) || (key in managed && managed[key] !== strValue)) {
          url.searchParams.set(key, strValue)
          nextManaged[key] = strValue
          changed = true
        } else if (key in managed) {
          nextManaged[key] = strValue
        }
      }
    }

    managedParamsRef.current = nextManaged

    if (changed) {
      window.history.replaceState(window.history.state, '', url.toString())
    }
  }, [mergedTokens])

  // Canvas pages get their own rendering path — no flow data needed
  if (canvasId) {
    const canvasData = canvases?.[canvasId]
    const group = canvasData?._group
    // Include the current canvas as a sibling even if it's the only page in its group,
    // so the PageSelector can render and allow adding new pages.
    const siblingPages = group
      ? canvasGroupMap.get(group) || []
      : [{ name: canvasId, route: canvasData?._route || `/canvas/${canvasId}`, title: canvasData?.title || canvasId.split('/').pop() }]
    const canvasMeta = canvasData?._canvasMeta || null
    const canvasValue = {
      data: null,
      error: null,
      loading: false,
      flowName: null,
      sceneName: null,
      prototypeName: null,
    }
    return (
      <StoryboardContext.Provider value={canvasValue}>
        <Suspense fallback={null}>
          <CanvasPageLazy canvasId={canvasId} siblingPages={siblingPages} canvasMeta={canvasMeta} />
        </Suspense>
      </StoryboardContext.Provider>
    )
  }

  // Story pages get their own rendering path — no flow data needed
  if (storyName) {
    const storyValue = {
      data: null,
      error: null,
      loading: false,
      flowName: null,
      sceneName: null,
      prototypeName: null,
    }
    return (
      <StoryboardContext.Provider value={storyValue}>
        <Suspense fallback={null}>
          <StoryPageLazy name={storyName} />
        </Suspense>
      </StoryboardContext.Provider>
    )
  }

  if (isMissingCanvasRoute) {
    const currentUrl = `${location.pathname}${location.search}`
    const truncatedUrl = currentUrl.length > 60
      ? currentUrl.slice(0, 60) + '…'
      : currentUrl

    return (
      <main className={styles.container}>
        <div className={styles.banner}>
          <strong>Canvas not found</strong>
          No canvas matches this route.
        </div>
        <p className={styles.meta}>
          Tried to open{' '}
          <a href={currentUrl} title={currentUrl}>{truncatedUrl}</a>
        </p>
        <a className={styles.homeLink} href="/">← Go to index page</a>
      </main>
    )
  }

  if (isMissingStoryRoute) {
    const currentUrl = `${location.pathname}${location.search}`
    const truncatedUrl = currentUrl.length > 60
      ? currentUrl.slice(0, 60) + '…'
      : currentUrl

    return (
      <main className={styles.container}>
        <div className={styles.banner}>
          <strong>Story not found</strong>
          No story matches this route.
        </div>
        <p className={styles.meta}>
          Tried to open{' '}
          <a href={currentUrl} title={currentUrl}>{truncatedUrl}</a>
        </p>
        <a className={styles.homeLink} href="/">← Go to index page</a>
      </main>
    )
  }

  const value = {
    data,
    error,
    loading: false,
    flowName: activeFlowName,
    sceneName: activeFlowName, // backward compat
    prototypeName,
  }

  if (error) {
    const currentUrl = `${location.pathname}${location.search}`
    const truncatedUrl = currentUrl.length > 60
      ? currentUrl.slice(0, 60) + '…'
      : currentUrl

    return (
      <div className={styles.container}>
        <div className={styles.banner}>
          <strong>Error loading flow</strong>
          {error}
        </div>
        <p className={styles.meta}>
          Tried to load{' '}
          <a href={currentUrl} title={currentUrl}>{truncatedUrl}</a>
        </p>
        <a className={styles.homeLink} href="/">← Go to homepage</a>
      </div>
    )
  }

  return (
    <StoryboardContext.Provider value={value}>
      {children}
    </StoryboardContext.Provider>
  )
}
