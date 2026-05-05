/**
 * CanvasCreateMenu — CoreUIBar dropdown for adding widgets to the active canvas.
 * Dispatches custom events to bridge to React canvas system.
 * Only visible when a canvas page is active.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import { Button } from '../lib/components/ui/button/index.js'
import { Input } from '../lib/components/ui/input/index.js'
import { Label } from '../lib/components/ui/label/index.js'
import { SearchableList } from '../lib/components/ui/searchable-list.jsx'
import Icon from './Icon.jsx'
import { getConfig } from '../index.js'
import { buildPrototypeIndex } from '../index.js'

const widgetTypes = [
  { type: 'sticky-note', label: 'Sticky Note' },
  { type: 'markdown', label: 'Markdown' },
  { type: 'prompt', label: 'Prompt' },
  { type: 'terminal', label: 'Terminal' },
]

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function ChevronRight({ className, style }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M4.5 2.5L7.5 6L4.5 9.5" />
    </svg>
  )
}

function getApiUrl() {
  const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
  return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
}

export default function CanvasCreateMenu({ config = {}, data: _data, canvasName = '', zoom: _zoom, tabindex }) {
  void _data
  void _zoom
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('menu')
  const [stories, setStories] = useState([])
  const [storiesLoaded, setStoriesLoaded] = useState(false)
  const componentSearchRef = useRef(null)
  const prototypeSearchRef = useRef(null)
  const [expandedProtos, setExpandedProtos] = useState(new Set())

  const showAgentsInMenu = useMemo(() => {
    const canvasConfig = getConfig('canvas')
    return canvasConfig?.showAgentsInAddMenu !== false
  }, [])

  // Read agent configs from canvas.agents
  const agents = useMemo(() => {
    if (!showAgentsInMenu) return []
    const canvasConfig = getConfig('canvas')
    const agentsConfig = canvasConfig?.agents
    if (!agentsConfig || typeof agentsConfig !== 'object') return []
    return Object.entries(agentsConfig).map(([id, cfg]) => ({
      id,
      label: cfg.label || id,
      startupCommand: cfg.startupCommand || id,
      defaultWidth: cfg.defaultWidth,
      defaultHeight: cfg.defaultHeight,
    }))
  }, [])

  // Build prototype list for the Prototype submenu
  const prototypeItems = useMemo(() => {
    try {
      const idx = buildPrototypeIndex()
      const allProtos = []
      for (const folder of (idx.sorted?.title?.folders || idx.folders || [])) {
        for (const proto of folder.prototypes || []) {
          if (!proto.isExternal) allProtos.push(proto)
        }
      }
      for (const proto of (idx.sorted?.title?.prototypes || idx.prototypes || [])) {
        if (!proto.isExternal) allProtos.push(proto)
      }
      return allProtos.map((proto) => {
        if (proto.hideFlows && proto.flows.length === 1) {
          return { name: proto.name, dirName: proto.dirName, flows: [{ name: proto.name, route: proto.flows[0].route }], singleFlow: true }
        } else if (proto.flows.length > 0) {
          return { name: proto.name, dirName: proto.dirName, flows: proto.flows.map((f) => ({ name: f.meta?.title || formatName(f.name), route: f.route })), singleFlow: false }
        } else {
          return { name: proto.name, dirName: proto.dirName, flows: [{ name: proto.name, route: `/${proto.dirName}` }], singleFlow: true }
        }
      })
    } catch {
      return []
    }
  }, [])

  // Create prototype form state
  const [protoName, setProtoName] = useState('')
  const [protoSubmitting, setProtoSubmitting] = useState(false)
  const [protoError, setProtoError] = useState(null)

  const protoKebab = useMemo(
    () => protoName.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, ''),
    [protoName]
  )
  const protoNameError = useMemo(
    () => protoName.trim() && !protoKebab ? 'Name must contain at least one alphanumeric character' : null,
    [protoName, protoKebab]
  )
  const protoRoutePreview = protoKebab ? `/${protoKebab}` : ''
  const canSubmitProto = !!protoKebab && !protoNameError && !protoSubmitting

  function resetProtoForm() {
    setProtoName('')
    setProtoError(null)
    setProtoSubmitting(false)
  }

  // Create form state
  const [createName, setCreateName] = useState('')
  const [createLocation, setCreateLocation] = useState('canvas')
  const [createFormat, setCreateFormat] = useState('jsx')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [notificationPath, setNotificationPath] = useState(null)

  const kebabName = useMemo(
    () => createName.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, ''),
    [createName]
  )
  const nameError = useMemo(
    () => createName.trim() && !kebabName ? 'Name must contain at least one alphanumeric character' : null,
    [createName, kebabName]
  )
  const filePreview = useMemo(
    () => kebabName ? `${kebabName}.story.${createFormat}` : '',
    [kebabName, createFormat]
  )
  const canSubmit = !!kebabName && !nameError && !submitting

  function resetCreateForm() {
    setCreateName('')
    setCreateLocation('canvas')
    setCreateFormat('jsx')
    setCreateError(null)
    setSubmitting(false)
  }

  async function loadStories() {
    try {
      const res = await fetch(getApiUrl() + '/stories')
      if (res.ok) {
        const d = await res.json()
        setStories(d.stories || [])
      }
    } catch { /* ignore */ }
    setStoriesLoaded(true)
  }

  // Load stories when menu opens
  useEffect(() => {
    if (menuOpen) loadStories()
  }, [menuOpen])

  // Focus first menu item when dropdown opens on menu view
  useEffect(() => {
    if (menuOpen && view === 'menu') {
      requestAnimationFrame(() => {
        const item = document.querySelector('[data-bits-dropdown-menu-content] [data-bits-dropdown-menu-item]:not([data-disabled])')
        item?.focus()
      })
    }
  }, [menuOpen, view])

  // Reset when menu closes on menu view
  useEffect(() => {
    if (!menuOpen && view === 'menu') {
      resetCreateForm()
      resetProtoForm()
      setExpandedProtos(new Set())
    }
  }, [menuOpen, view])

  function addWidget(type, props) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', {
      detail: { type, canvasName, props }
    }))
    setMenuOpen(false)
  }

  function addStoryWidget(storyId) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-story-widget', {
      detail: { storyId, canvasName }
    }))
    setMenuOpen(false)
  }

  function addPrototypeWidget(route) {
    addWidget('prototype', { src: route })
  }

  function showCreateProtoForm() {
    resetProtoForm()
    setView('create-prototype')
  }

  async function submitCreateProto() {
    if (!canSubmitProto) return
    setProtoSubmitting(true)
    setProtoError(null)
    try {
      const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
      const apiUrl = basePath.replace(/\/$/, '') + '/_storyboard/artifact/'
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'prototype', name: protoKebab }),
      })
      const d = await res.json()
      if (!res.ok) { setProtoError(d.error || 'Failed to create prototype'); setProtoSubmitting(false); return }

      if (d.route) {
        addPrototypeWidget(d.route)
      }

      setNotificationPath(d.path)
      setView('notification-proto')
      setMenuOpen(true)

      setTimeout(() => {
        if (viewRef.current === 'notification-proto') {
          setMenuOpen(false)
          setView('menu')
          setNotificationPath(null)
        }
      }, 6000)
    } catch (err) {
      setProtoError(err.message || 'Network error')
    } finally {
      setProtoSubmitting(false)
    }
  }

  function showCreateForm() {
    resetCreateForm()
    setView('create')
  }

  const viewRef = useRef(view)
  viewRef.current = view

  async function submitCreate() {
    if (!canSubmit) return
    setSubmitting(true)
    setCreateError(null)
    try {
      const bridgeState = window.__storyboardCanvasBridgeState
      const activeCanvasId = bridgeState?.canvasId || bridgeState?.name || canvasName

      const res = await fetch(getApiUrl() + '/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          location: createLocation,
          format: createFormat,
          canvasName: createLocation === 'canvas' ? activeCanvasId : undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setCreateError(d.error || 'Failed to create component'); setSubmitting(false); return }

      addStoryWidget(d.name)

      setNotificationPath(d.path)
      setView('notification')
      setMenuOpen(true)
      setStoriesLoaded(false)

      setTimeout(() => {
        if (viewRef.current === 'notification') {
          setMenuOpen(false)
          setView('menu')
          setNotificationPath(null)
        }
      }, 6000)
    } catch (err) {
      setCreateError(err.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(open) {
    setMenuOpen(open)
    if (!open) {
      if (view !== 'menu') {
        setView('menu')
        setNotificationPath(null)
        resetCreateForm()
        resetProtoForm()
      }
    }
  }

  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger asChild>
        <TriggerButton
          active={menuOpen}
          size="icon-xl"
          aria-label={config.ariaLabel || 'Add widget'}
          tabIndex={tabindex}
        >
          {config.icon ? (
            <Icon name={config.icon} size={16} {...(config.meta || {})} />
          ) : '+'}
        </TriggerButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="start"
        sideOffset={16}
        className="min-w-[180px]"
        style={config.menuWidth ? { width: config.menuWidth } : undefined}
        onInteractOutside={(e) => { if (view === 'create' || view === 'create-prototype') e.preventDefault() }}
      >
        {view === 'menu' && (
          <>
            <DropdownMenu.Label>Add to canvas</DropdownMenu.Label>
            {widgetTypes.map((wt) => (
              <DropdownMenu.Item key={wt.type} onClick={() => addWidget(wt.type)}>
                {wt.label}
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                Prototype
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent
                className="min-w-[260px]"
                onOpenAutoFocus={(e) => {
                  e.preventDefault()
                }}
              >
                <SearchableList
                  items={prototypeItems}
                  loading={false}
                  filterFn={(proto, q) =>
                    proto.name.toLowerCase().includes(q) ||
                    proto.flows.some((f) => f.name.toLowerCase().includes(q))
                  }
                  renderItem={(proto) => {
                    const hasMultipleFlows = !proto.singleFlow && proto.flows.length > 1
                    const isExpanded = expandedProtos.has(proto.dirName)
                    const isFiltering = prototypeSearchRef.current?.value?.trim().length > 0
                    const showFlows = hasMultipleFlows && (isExpanded || isFiltering)

                    return (
                      <div key={proto.dirName}>
                        <DropdownMenu.Item
                          onSelect={(e) => {
                            if (hasMultipleFlows) {
                              e.preventDefault()
                              setExpandedProtos((prev) => {
                                const next = new Set(prev)
                                if (next.has(proto.dirName)) next.delete(proto.dirName)
                                else next.add(proto.dirName)
                                return next
                              })
                            } else {
                              addPrototypeWidget(proto.flows[0]?.route || `/${proto.dirName}`)
                            }
                          }}
                        >
                          <span className="flex items-center justify-between w-full">
                            <span>{proto.name}</span>
                            {hasMultipleFlows && (
                              <ChevronRight style={{
                                marginLeft: 'auto',
                                transition: 'transform 0.15s',
                                transform: showFlows ? 'rotate(90deg)' : 'none',
                              }} />
                            )}
                          </span>
                        </DropdownMenu.Item>
                        {showFlows && proto.flows.map((flow) => (
                          <DropdownMenu.Item
                            key={flow.route}
                            onSelect={() => addPrototypeWidget(flow.route)}
                            className="text-muted-foreground text-xs"
                          >
                            {flow.name}
                          </DropdownMenu.Item>
                        ))}
                      </div>
                    )
                  }}
                  placeholder="Filter prototypes…"
                  emptyMessage="No prototypes found"
                  listClassName="max-h-[300px]"
                  inputRef={prototypeSearchRef}
                  header={
                    <>
                      <button
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground w-full text-left bg-transparent border-none"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); showCreateProtoForm() }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium">Create new prototype…</span>
                      </button>
                      {prototypeItems.length > 0 && <DropdownMenu.Separator />}
                    </>
                  }
                />
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>

            {agents.length > 0 && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="agents" size={12} />
                    Agents
                  </span>
                </DropdownMenu.Label>
                {agents.map((agent) => (
                  <DropdownMenu.Item key={agent.id} onClick={() => addWidget('agent', {
                    agentId: agent.id,
                    startupCommand: agent.startupCommand,
                    ...(agent.defaultWidth ? { width: agent.defaultWidth } : {}),
                    ...(agent.defaultHeight ? { height: agent.defaultHeight } : {}),
                  })}>
                    {agent.label}
                  </DropdownMenu.Item>
                ))}
              </>
            )}

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                Component
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent
                className="min-w-[200px]"
                onOpenAutoFocus={(e) => {
                  e.preventDefault()
                }}
              >
                <SearchableList
                  items={stories}
                  loading={!storiesLoaded}
                  filterFn={(story, q) =>
                    story.name.toLowerCase().includes(q) ||
                    story.path.toLowerCase().includes(q)
                  }
                  renderItem={(story) => (
                    <DropdownMenu.Item key={story.name} onClick={() => addStoryWidget(story.name)}>
                      <span className="flex flex-col">
                        <span>{story.name}</span>
                        <span className="text-xs text-muted-foreground">{story.path}</span>
                      </span>
                    </DropdownMenu.Item>
                  )}
                  placeholder="Filter components…"
                  emptyMessage="No components found"
                  loadingMessage="Loading components…"
                  listClassName="max-h-[260px]"
                  inputRef={componentSearchRef}
                  header={
                    <>
                      <button
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground w-full text-left bg-transparent border-none"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); showCreateForm() }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium">Create new component…</span>
                      </button>
                      {stories.length > 0 && <DropdownMenu.Separator />}
                    </>
                  }
                />
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex flex-row items-baseline">
              <span className="inline-flex w-2 h-2 rounded-full mr-1.5" style={{ background: 'hsl(212, 92%, 45%)' }}></span>
              Only available in dev environment
            </div>
          </>
        )}

        {view === 'create' && (
          <div
            className="p-3 space-y-3 min-w-[280px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) submitCreate(); if (e.key === 'Escape') setView('menu') }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Create component</span>
              <button className="text-muted-foreground hover:text-foreground text-xs bg-transparent border-none cursor-pointer p-0.5" onClick={() => setView('menu')}>← Back</button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sb-create-comp-name" className="text-xs">Name</Label>
              <Input id="sb-create-comp-name" placeholder="e.g. user-card" autoComplete="off" spellCheck={false} value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-8 text-sm" />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              {filePreview && <p className="text-xs text-muted-foreground">{filePreview}</p>}
            </div>

            <fieldset className="space-y-1">
              <Label className="text-xs">Location</Label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-location" value="canvas" checked={createLocation === 'canvas'} onChange={() => setCreateLocation('canvas')} className="accent-primary" />
                  This canvas directory
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-location" value="components" checked={createLocation === 'components'} onChange={() => setCreateLocation('components')} className="accent-primary" />
                  <code className="text-xs">src/components/</code>
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-1">
              <Label className="text-xs">Format</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-format" value="jsx" checked={createFormat === 'jsx'} onChange={() => setCreateFormat('jsx')} className="accent-primary" />
                  JSX
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-format" value="tsx" checked={createFormat === 'tsx'} onChange={() => setCreateFormat('tsx')} className="accent-primary" />
                  TSX
                </label>
              </div>
            </fieldset>

            {createError && <p className="text-xs text-destructive">{createError}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setView('menu')}>Cancel</Button>
              <Button size="sm" onClick={submitCreate} disabled={!canSubmit}>{submitting ? 'Creating…' : 'Create'}</Button>
            </div>
          </div>
        )}

        {view === 'notification' && (
          <div className="p-3 min-w-[260px] space-y-1">
            <p className="text-sm font-medium">✓ Component added to canvas</p>
            {notificationPath && (
              <>
                <p className="text-xs text-muted-foreground">To edit your component, go to</p>
                <code className="text-xs block bg-muted px-2 py-1 rounded">{notificationPath}</code>
              </>
            )}
          </div>
        )}

        {view === 'create-prototype' && (
          <div
            className="p-3 space-y-3 min-w-[280px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && canSubmitProto) submitCreateProto(); if (e.key === 'Escape') setView('menu') }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Create prototype</span>
              <button className="text-muted-foreground hover:text-foreground text-xs bg-transparent border-none cursor-pointer p-0.5" onClick={() => setView('menu')}>← Back</button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sb-create-proto-name" className="text-xs">Name</Label>
              <Input id="sb-create-proto-name" placeholder="e.g. my-prototype" autoComplete="off" spellCheck={false} value={protoName} onChange={(e) => setProtoName(e.target.value)} className="h-8 text-sm" />
              {protoNameError && <p className="text-xs text-destructive">{protoNameError}</p>}
              {protoRoutePreview && <p className="text-xs text-muted-foreground">Route: <code>{protoRoutePreview}</code></p>}
            </div>

            {protoError && <p className="text-xs text-destructive">{protoError}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setView('menu')}>Cancel</Button>
              <Button size="sm" onClick={submitCreateProto} disabled={!canSubmitProto}>{protoSubmitting ? 'Creating…' : 'Create'}</Button>
            </div>
          </div>
        )}

        {view === 'notification-proto' && (
          <div className="p-3 min-w-[260px] space-y-1">
            <p className="text-sm font-medium">✓ Prototype created</p>
            {notificationPath && (
              <>
                <p className="text-xs text-muted-foreground">Created at</p>
                <code className="text-xs block bg-muted px-2 py-1 rounded">{notificationPath}</code>
              </>
            )}
          </div>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
