/**
 * CanvasAgentsMenu — CoreUIBar dropdown for adding agent widgets to the active canvas.
 * Reads agent definitions from canvas.agents config and dispatches add-widget events.
 * Only visible when a canvas page is active and agents are configured.
 */
import { useState, useMemo } from 'react'
import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
import Icon from './Icon.jsx'
import { getConfig } from '@dfosco/storyboard-core'

export default function CanvasAgentsMenu({ config = {}, data: _data, canvasName = '', zoom: _zoom, tabindex }) {
  void _data
  void _zoom
  const [menuOpen, setMenuOpen] = useState(false)

  const agents = useMemo(() => {
    const canvasConfig = getConfig('canvas')
    const agentsConfig = canvasConfig?.agents
    if (!agentsConfig || typeof agentsConfig !== 'object') return []
    return Object.entries(agentsConfig).map(([id, cfg]) => ({
      id,
      label: cfg.label || id,
      icon: cfg.icon,
      startupCommand: cfg.startupCommand || id,
      defaultWidth: cfg.defaultWidth,
      defaultHeight: cfg.defaultHeight,
    }))
  }, [])

  function addAgent(agent) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', {
      detail: {
        type: 'agent',
        canvasName,
        props: {
          agentId: agent.id,
          startupCommand: agent.startupCommand,
          ...(agent.defaultWidth ? { width: agent.defaultWidth } : {}),
          ...(agent.defaultHeight ? { height: agent.defaultHeight } : {}),
        },
      }
    }))
    setMenuOpen(false)
  }

  if (agents.length === 0) return null

  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenu.Trigger asChild>
        <TriggerButton
          active={menuOpen}
          size="icon-xl"
          aria-label={config.ariaLabel || 'Add agent'}
          tabIndex={tabindex}
        >
          {config.icon ? (
            <Icon name={config.icon} size={16} {...(config.meta || {})} />
          ) : (
            <Icon name="agents" size={16} />
          )}
        </TriggerButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="start"
        sideOffset={16}
        className="min-w-[180px]"
      >
        <DropdownMenu.Label>Add agent</DropdownMenu.Label>
        {agents.map((agent) => (
          <DropdownMenu.Item key={agent.id} onClick={() => addAgent(agent)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name={agent.icon || 'agents'} size={16} />
              {agent.label}
            </span>
          </DropdownMenu.Item>
        ))}
        <DropdownMenu.Separator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground flex flex-row items-baseline">
          <span className="inline-flex w-2 h-2 rounded-full mr-1.5" style={{ background: 'hsl(212, 92%, 45%)' }}></span>
          Only available in dev environment
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
