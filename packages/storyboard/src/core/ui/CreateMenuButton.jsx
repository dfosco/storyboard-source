import { useState, useMemo } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import * as Panel from '../lib/components/ui/panel/index.js'
import Icon from './Icon.jsx'
import { isExcludedByRoute } from '../index.js'

export default function CreateMenuButton({ features: featuresProp = [], data, config = { label: 'Create' }, localOnly: _localOnly, tabindex }) {
  const features = featuresProp.length > 0 ? featuresProp : (data?.features || [])
  void _localOnly
  const menuWidth = config.menuWidth || null

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeAction, setActiveAction] = useState(null)

  const featuresByName = useMemo(
    () => Object.fromEntries(features.map((f) => [f.name, f])),
    [features],
  )

  const resolvedActions = useMemo(() => {
    const actions = config.actions
    if (!Array.isArray(actions)) {
      return [
        { type: 'header', label: config.label, _key: 'header' },
        ...features.map((f) => ({ type: 'default', label: f.label, _feature: f, _key: f.overlayId })),
      ]
    }
    return actions
      .map((a, i) => {
        if (a.feature) {
          const feat = featuresByName[a.feature]
          if (!feat) return null
          return { ...a, _feature: feat, _key: a.id || `action-${i}` }
        }
        return { ...a, _key: a.id || `${a.type}-${i}` }
      })
      .filter(Boolean)
  }, [config, features, featuresByName])

  function showOverlay(action) {
    setActiveAction(action)
    setMenuOpen(false)
  }

  function closeOverlay() { setActiveAction(null) }

  const OverlayComponent = activeAction?._feature?.overlay

  return (
    <>
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger>
            <TriggerButton
              active={menuOpen}
              size="icon-xl"
              aria-label={config.ariaLabel || config.label}
              tabIndex={tabindex}
            >
              {config.icon ? (
                <Icon name={config.icon} size={16} {...(config.meta || {})} />
              ) : config.character ? (
                config.character
              ) : (
                '+'
              )}
            </TriggerButton>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={16}
          className="min-w-[180px]"
          style={menuWidth ? { width: menuWidth } : undefined}
        >
          {resolvedActions.map((action) => {
            if (isExcludedByRoute(action)) return null
            if (action.type === 'header') {
              return <DropdownMenu.Label key={action._key}>{action.label}</DropdownMenu.Label>
            }
            if (action.type === 'separator') {
              return <DropdownMenu.Separator key={action._key} />
            }
            if (action.type === 'footer') {
              return (
                <div key={action._key}>
                  <DropdownMenu.Separator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground flex flex-row items-baseline">
                    <span className="inline-flex w-2 h-2 rounded-full mr-1.5" style={{ background: 'hsl(212, 92%, 45%)' }} />
                    Only available in dev environment
                  </div>
                </div>
              )
            }
            if (action._feature) {
              return (
                <DropdownMenu.Item key={action._key} onClick={() => showOverlay(action)}>
                  {action.label || action._feature.label}
                </DropdownMenu.Item>
              )
            }
            return null
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {OverlayComponent && (
        <Panel.Root open={true} onOpenChange={(open) => { if (!open) closeOverlay() }}>
          <Panel.Content>
            <OverlayComponent onClose={closeOverlay} {...(activeAction.overlayProps || {})} />
          </Panel.Content>
        </Panel.Root>
      )}
    </>
  )
}
