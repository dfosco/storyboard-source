# `packages/storyboard/src/core/ui/CoreUIBar.jsx`

<!--
source: packages/storyboard/src/core/ui/CoreUIBar.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/ui/CoreUIBar.jsx`](./CoreUIBar.jsx.md) is the runtime UI shell for Storyboard's developer chrome. It assembles the floating command toolbar, the canvas-only toolbar, the collaboration bar, the lazily mounted side panel, the PWA banner, and the flow inspector dialog into one React root. In practice this is the single component that turns static toolbar config into live, mode-aware UI.

Architecturally, the component is the bridge between declarative tool metadata and imperative runtime behavior. It reads mode state from [`packages/storyboard/src/core/modes/modes.js`](../../../../../../../packages/storyboard/src/core/modes/modes.js), toolbar config from [`packages/storyboard/src/core/stores/toolbarConfigStore.js`](../../../../../../../packages/storyboard/src/core/stores/toolbarConfigStore.js), command actions from [`packages/storyboard/src/core/stores/commandActions.js`](../../../../../../../packages/storyboard/src/core/stores/commandActions.js), tool state from [`packages/storyboard/src/core/stores/toolStateStore.js`](../../../../../../../packages/storyboard/src/core/stores/toolStateStore.js), and handler modules from [`packages/storyboard/src/core/tools/registry.js`](../../../../../../../packages/storyboard/src/core/tools/registry.js). It then projects those inputs onto four runtime surfaces: command-toolbar, canvas-toolbar, collab-bar, and command-palette/mobile actions.

## Composition

The file begins with compatibility helpers that normalize toolbar config into the runtime concepts the shell understands: handler references, legacy menu definitions, and command-palette actions. Those helpers let the shell support both older menu-shaped configs and newer tool/surface config without duplicating rendering logic.

```jsx
function resolveHandlerModule(ref, coreModules, custom) {
  const colonIdx = ref.indexOf(':')
  if (colonIdx === -1) return coreModules[ref] || null
  const prefix = ref.slice(0, colonIdx)
  const name = ref.slice(colonIdx + 1)
  if (prefix === 'core') return coreModules[name] || null
  if (prefix === 'custom') return custom[name] || null
  return null
}

// Resolve tools → menus compatibility layer.
function resolveMenus(cfg) {
  if (cfg.tools) {
    const result = {}
    for (const [key, tool] of Object.entries(cfg.tools)) {
      if (tool.surface === 'command-palette' || tool.surface === 'canvas-toolbar' || tool.surface === 'collab-bar') continue
      const menu = { ...tool }
      if (tool.render === 'menu' && tool.handler) {
        menu.action = tool.handler
      }
      result[key] = { ...menu, _toolId: key }
    }
    return result
  }
  return cfg.menus || {}
}

function resolveCommandConfig(cfg) {
  if (!cfg.tools) return cfg.menus?.command || null
  const actions = []
  actions.push({ type: 'header', label: 'Command Menu' })

  for (const [toolKey, tool] of Object.entries(cfg.tools)) {
    if (tool.surface !== 'command-palette') continue
    if (tool.render === 'separator') {
      actions.push({ type: 'separator' })
      continue
    }
    actions.push({
      id: tool.handler || `core/${tool.label?.toLowerCase().replace(/\s+/g, '-')}`,
      label: tool.label || tool.ariaLabel,
      type: tool.render || 'default',
      url: tool.url || null,
      modes: tool.modes || ['*'],
      toolKey,
      localOnly: !tool.prod,
      hideFromCommandPaletteSearch: tool.hideFromCommandPaletteSearch || false,
    })
  }

  return {
    ariaLabel: 'Command Menu',
    trigger: 'command',
    default: true,
    modes: ['*'],
    actions,
  }
}
```

Inside the component, React state tracks shell visibility, canvas bridge status, loaded tool components, tool-provided data payloads, roving-tabindex state, and the flow-info dialog. A memoized filtering pipeline derives which tools belong on which surface and whether they should be visible in the current mode, route, and environment.

```jsx
  // Resolved config
  const config = useMemo(() => {
    return (storeConfig && Object.keys(storeConfig).length > 0)
      ? storeConfig
      : (toolbarConfig || defaultToolbarConfig)
  }, [storeConfig, toolbarConfig])

  // Re-seed tool states whenever config changes
  useEffect(() => {
    const tools = config.tools || {}
    initToolbarToolStates(tools, { isLocalDev })
  }, [config])

  const commandMenuConfig = useMemo(() => resolveCommandConfig(config), [config])

  const shortcutsConfig = useMemo(() => {
    const tools = config.tools || {}
    const hideChromeTool = tools['hide-chrome']
    const commandPaletteTool = tools['command-palette']
    return {
      hideChrome: hideChromeTool?.shortcut || { key: '.', label: '⌘.' },
      openCommandMenu: commandPaletteTool?.shortcut || { key: 'k', label: '⌘K' },
    }
  }, [config])

  const allMenus = useMemo(() => resolveMenus(config), [config])

  const orderedMenus = useMemo(() => {
    // Reference toolStateVersion to re-compute when tool states change
    void toolStateVersion
    return Object.entries(allMenus)
      .filter(([key]) => key !== 'command')
      .filter(([key]) => !isMenuHidden(key))
      .filter(([key]) => getToolbarToolState(key) !== 'disabled')
      .map(([key, menu]) => ({ key, ...menu }))
  }, [allMenus, toolStateVersion])

  const sidepanelMenus = useMemo(
    () => orderedMenus.filter((menu) => menu.sidepanel),
    [orderedMenus],
  )

  const canvasMenus = useMemo(() => {
    return config.tools
      ? Object.entries(config.tools)
          .filter(([, tool]) => tool.surface === 'canvas-toolbar')
          .filter(([, tool]) => tool.prod || isLocalDev)
          .map(([key, tool]) => ({ key, ...tool }))
      : []
  }, [config])

  const collabBarMenus = useMemo(() => {
    return config.tools
      ? Object.entries(config.tools)
          .filter(([, tool]) => tool.surface === 'collab-bar')
          .filter(([, tool]) => tool.prod || isLocalDev)
          .map(([key, tool]) => ({ key, ...tool }))
      : []
  }, [config])

  const visibleMenus = useMemo(() => {
    void navVersion
    void toolStateVersion
    return orderedMenus
      .filter((menu) => {
        const toolState = getToolbarToolState(menu.key)
        if (toolState === 'hidden') return false
        if (menu.render === 'separator') return true
        if (!menuVisibleInMode(menu, currentModeState.mode)) return false
        if (menu.render === 'sidepanel') return true
        if (!toolComponents[menu.key]) return false
        const actionId = menu.handler || menu.action
        if (actionId && menu.render === 'menu' && hasChildrenProvider(actionId)) {
          return getActionChildren(actionId).length > 0
        }
        return true
      })
  }, [orderedMenus, navVersion, toolStateVersion, currentModeState.mode, toolComponents])
```

Tool loading is the key architectural seam. For every configured tool, CoreUIBar resolves a handler reference, optionally runs a guard, executes setup, registers command handlers, and then asks the module for a UI component appropriate to the requested render type. That makes the toolbar extensible without hard-coding every feature into the shell itself.

```jsx
      await Promise.all(Object.entries(toolConfigs).map(async ([toolId, toolConfig]) => {
        if (toolConfig.render === 'separator') return
        if (getToolbarToolState(toolId) === 'disabled') return

        const handlerRef = toolConfig.handler || `core:${toolId}`
        const loadModule = resolveHandlerModule(handlerRef, coreHandlers, customHandlers)
        if (!loadModule) return

        try {
          const mod = await loadModule()
          const toolCtx = { ...ctx, config: toolConfig }

          if (mod.guard) {
            const ok = await mod.guard(toolCtx)
            if (!ok) return
          }

          if (mod.setup) {
            const setupResult = await mod.setup(toolCtx)
            if (setupResult) {
              loadedData[toolId] = setupResult
            }
          }

          if (mod.handler) {
            const handlerResult = await mod.handler(toolCtx)
            const actionId = toolConfig.handler || `core:${toolId}`
            if (handlerResult && !handlerResult.getChildren) {
              loadedData[toolId] = { ...(loadedData[toolId] || {}), ...handlerResult }
            }
            registerCommandAction(actionId, handlerResult)
          }

          if (mod.component) {
            const component = await mod.component(toolConfig.render)
            loadedComponents[toolId] = component
          }
```

Accessibility and keyboard behavior are also centralized here. The main toolbar uses roving tabindex plus arrow-key navigation, while global shortcuts handle chrome visibility, per-tool commands, and immersive prototype fullscreen.

```jsx
  function getTabindex(index) {
    if (activeToolbarIndex < 0) {
      return index === lastToolIndex ? 0 : -1
    }
    return index === activeToolbarIndex ? 0 : -1
  }

  const focusToolbarItem = useCallback((index) => {
    setActiveToolbarIndex(index)
    if (!toolbarEl.current) return
    const buttons = toolbarEl.current.querySelectorAll('[data-slot="button"]')
    buttons[index]?.focus()
  }, [])

  const handleToolbarKeydown = useCallback((e) => {
    if (toolbarItemCount === 0) return
    const current = activeToolbarIndex < 0 ? toolbarItemCount - 1 : activeToolbarIndex

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusToolbarItem((current + 1) % toolbarItemCount)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusToolbarItem((current - 1 + toolbarItemCount) % toolbarItemCount)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusToolbarItem(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusToolbarItem(toolbarItemCount - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const openContent = document.querySelector('[data-slot="dropdown-menu-content"]')
      if (openContent) {
        const items = openContent.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')
        if (items.length > 0) items[items.length - 1].focus()
        return
      }
      const focusedBtn = toolbarEl.current?.querySelector('[data-slot="button"]:focus')
      if (focusedBtn?.getAttribute('aria-haspopup')) {
        focusedBtn.click()
        requestAnimationFrame(() => {
          const content = document.querySelector('[data-slot="dropdown-menu-content"]')
          if (content) {
            const items = content.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')
            if (items.length > 0) items[items.length - 1].focus()
          }
        })
      }
    }
  }, [toolbarItemCount, activeToolbarIndex, focusToolbarItem])
```

```jsx
  // Keyboard shortcut handler
  useEffect(() => {
    function handleKeydown(e) {
      const hideKey = shortcutsConfig.hideChrome?.key || '.'

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        // Alt+Cmd+. — completely hide (use e.code since alt changes e.key on macOS)
        if (e.altKey && e.code === 'Period') {
          e.preventDefault()
          toggleCompletelyHidden()
          return
        }
        // Cmd+. — regular hide/show
        if (!e.altKey && e.key === hideKey) {
          e.preventDefault()
          toggleToolsVisibility()
          return
        }
      }

      for (const menu of cleanedMenus) {
        const shortcut = menu.shortcut
        if (!shortcut?.key) continue
        if (e.key === shortcut.key && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
          const toolState = getToolbarToolState(menu.key)
          if (toolState === 'inactive' || toolState === 'disabled') break
          if (menu.sidepanel) {
            e.preventDefault()
            togglePanel(menu.sidepanel)
          }
          break
        }
      }

      // Cmd+Opt+Ctrl+F — prototype fullscreen (immersive mode)
      // Use e.code since alt/opt changes e.key on macOS (e.g. 'f' → 'ƒ')
      if (e.metaKey && e.altKey && e.ctrlKey && e.code === 'KeyF') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('storyboard:canvas:prototype-fullscreen'))
        return
      }
    }
```

Finally, rendering is split by surface. The collab bar appears top-right only when a canvas is active, the canvas toolbar appears bottom-left for canvas-local tools, and the main toolbar anchors bottom-right for general command-toolbar tools. The command-palette surface is realized indirectly through command registration and mobile action mirroring rather than as a third inline button strip.

```jsx
  return (
    <>
      {/* Collab bar (top-right, canvas only) */}
      {canvasActive && visible && !completelyHidden && collabBarMenus.length > 0 && (
        <div
          className="fixed z-[9999] font-sans flex items-center gap-3"
          data-collab-bar
          role="toolbar"
          aria-label="Collab bar"
        >
          {collabBarMenus.map((collabTool) => {
            const CollabToolComponent = toolComponents[collabTool.key]
            if (!CollabToolComponent) return null
            return (
              <Tooltip.Root key={collabTool.key}>
                <Tooltip.Trigger>
                  <span data-local-only={isToolbarToolLocalOnly(collabTool.key) || undefined}>
                    <CollabToolComponent
                      config={collabTool}
                      data={toolData[collabTool.key]}
                      canvasName={activeCanvasId}
                      tabIndex={0}
                    />
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">{collabTool.ariaLabel || collabTool.key}</Tooltip.Content>
              </Tooltip.Root>
            )
          })}
        </div>
      )}

      {/* Canvas toolbar */}
      {canvasActive && visible && !completelyHidden && canvasMenus.length > 0 && (
        <div
          className="fixed bottom-6 left-6 z-[9999] font-sans flex items-center gap-3"
          role="toolbar"
          aria-label="Canvas toolbar"
        >
          {canvasMenus.map((canvasTool) => {
            const CanvasToolComponent = toolComponents[canvasTool.key]
            if (!CanvasToolComponent) return null
            if (canvasTool.render === 'menu') {
              return (
                <Tooltip.Root key={canvasTool.key}>
                  <Tooltip.Trigger>
                    <span data-local-only={isToolbarToolLocalOnly(canvasTool.key) || undefined}>
                      <CanvasToolComponent
                        config={canvasTool}
                        data={toolData[canvasTool.key]}
                        canvasName={activeCanvasId}
                        zoom={canvasZoom}
                        tabIndex={0}
                      />
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top">{canvasTool.ariaLabel || canvasTool.key}</Tooltip.Content>
                </Tooltip.Root>
              )
            }
            return (
              <CanvasToolComponent
                key={canvasTool.key}
                config={canvasTool}
                data={toolData[canvasTool.key]}
                canvasName={activeCanvasId}
                zoom={canvasZoom}
                tabIndex={0}
              />
            )
          })}
        </div>
      )}

      {/* Main toolbar */}
      <div
        id="storyboard-controls"
        className="fixed bottom-6 right-6 z-[9999] font-sans flex items-end gap-3"
        data-core-ui-bar=""
        role="toolbar"
        tabIndex={0}
        aria-label="Storyboard controls"
        onKeyDown={handleToolbarKeydown}
        ref={toolbarEl}
      >
        {/* Always-visible tools (left) */}
        {cleanedMenus.map((menu, i) => {
          if (!menu.alwaysVisible || !toolComponents[menu.key]) return null
          const ToolComponent = toolComponents[menu.key]
          return (
            <Tooltip.Root key={menu.key}>
              <Tooltip.Trigger>
                <ToolComponent
                  config={menu}
                  data={toolData[menu.key]}
                  tabIndex={getTabindex(i)}
                  localOnly={isToolbarToolLocalOnly(menu.key)}
                  basePath={basePath}
                />
              </Tooltip.Trigger>
              <Tooltip.Content side="top">
                {menu.ariaLabel || menu.key}{menu.shortcut?.label ? ` · ${menu.shortcut.label}` : ''}
              </Tooltip.Content>
            </Tooltip.Root>
          )
        })}

        {visible && !isMobileState && cleanedMenus.map((menu, i) => {
          if (menu.alwaysVisible) return null
          if (menu.render === 'separator') {
            return <div key={menu.key} className="toolbar-separator" aria-hidden="true" />
          }
          const toolState = getToolbarToolState(menu.key)
          return (
            <Tooltip.Root key={menu.key}>
              <Tooltip.Trigger>
                {menu.render === 'sidepanel' ? (
                  <TriggerButton
                    active={currentSidePanelState.open && currentSidePanelState.activeTab === menu.sidepanel}
                    inactive={toolState === 'inactive'}
                    dimmed={toolState === 'dimmed'}
                    localOnly={isToolbarToolLocalOnly(menu.key)}
                    size="icon-xl"
                    aria-label={menu.ariaLabel || menu.key}
                    tabIndex={getTabindex(i)}
                    onFocus={() => setActiveToolbarIndex(i)}
                    onClick={() => togglePanel(menu.sidepanel)}
                  >
                    <Icon name={menu.icon || menu.key} size={16} {...(menu.meta || {})} />
                  </TriggerButton>
                ) : toolComponents[menu.key] ? (() => {
                  const ToolComponent = toolComponents[menu.key]
                  return (
                    <span
                      data-tool-state={toolState}
                      data-local-only={isToolbarToolLocalOnly(menu.key) || undefined}
                      className={toolState === 'inactive' ? 'tool-inactive' : toolState === 'dimmed' ? 'tool-dimmed' : ''}
                    >
                      <ToolComponent
                        config={menu}
                        data={toolData[menu.key]}
                        tabIndex={getTabindex(i)}
                        localOnly={isToolbarToolLocalOnly(menu.key)}
                        basePath={basePath}
                      />
                    </span>
                  )
                })() : null}
              </Tooltip.Trigger>
              <Tooltip.Content side="top">
                {menu.ariaLabel || menu.key}{menu.shortcut?.label ? ` · ${menu.shortcut.label}` : ''}
              </Tooltip.Content>
            </Tooltip.Root>
          )
        })}

      </div>

      {/* Side panel */}
      {SidePanelComp && (
        <SidePanelComp
          onClose={() => focusToolbarItem(activeToolbarIndex < 0 ? toolbarItemCount - 1 : activeToolbarIndex)}
        />
      )}

      {/* PWA install banner */}
      <PwaInstallBanner />

      {/* Flow info panel */}
      <Panel.Root open={flowDialogOpen} onOpenChange={setFlowDialogOpen}>
        <Panel.Content>
          <Panel.Header>
            <Panel.Title>Flow: {flowName}</Panel.Title>
            <Panel.Close />
          </Panel.Header>
          <Panel.Body>
            {flowError ? (
              <span className="text-destructive text-sm">{flowError}</span>
            ) : (
              <pre className="m-0 bg-transparent text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">{flowJson}</pre>
            )}
          </Panel.Body>
        </Panel.Content>
      </Panel.Root>
    </>
```

## Dependencies

- [`packages/storyboard/src/core/modes/modes.js`](../../../../../../../packages/storyboard/src/core/modes/modes.js) supplies mode subscriptions and switcher visibility.
- [`packages/storyboard/src/core/stores/commandActions.js`](../../../../../../../packages/storyboard/src/core/stores/commandActions.js) owns command registration, child providers, route filtering, and dynamic mobile actions.
- [`packages/storyboard/src/core/stores/toolStateStore.js`](../../../../../../../packages/storyboard/src/core/stores/toolStateStore.js) drives disabled/hidden/local-only tool behavior.
- [`packages/storyboard/src/core/stores/toolbarConfigStore.js`](../../../../../../../packages/storyboard/src/core/stores/toolbarConfigStore.js) layers default, store, and prototype toolbar config.
- [`packages/storyboard/src/core/tools/registry.js`](../../../../../../../packages/storyboard/src/core/tools/registry.js) provides the `coreHandlers` registry used to load tool modules.
- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx) emits the canvas mount/status/zoom events this shell consumes.
- [`packages/storyboard/src/core/ui/SidePanel.jsx`](./SidePanel.jsx.md) provides the lazily mounted push panel for shell tabs.
- [`packages/storyboard/src/core/ui/PwaInstallBanner.jsx`](./PwaInstallBanner.jsx.md) adds the mobile install affordance managed by the shell root.

## Dependents

- No direct imports found outside this file.

## Notes

- The component intentionally returns `null` in embed mode, so the shell never appears inside embedded prototypes.
- Prototype metadata can inject toolbar, command palette, widgets, and paste overrides on navigation by mutating config stores.
- Mobile support is expressed as dynamic command actions rather than a second dedicated mobile toolbar implementation.
