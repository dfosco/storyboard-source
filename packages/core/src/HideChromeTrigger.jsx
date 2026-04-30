/**
 * HideChromeTrigger — toolbar button that toggles toolbar/branch bar visibility.
 * Always visible (even in hide mode). Uses the lightbulb icon.
 * In hide mode: goes 50% opacity.
 */

import { useState, useEffect, useCallback } from 'react'
import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'

export default function HideChromeTrigger({ config = {}, tabindex }) {
  const [hidden, setHidden] = useState(
    () => document.documentElement.classList.contains('storyboard-chrome-hidden')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.documentElement.classList.contains('storyboard-chrome-hidden'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    document.documentElement.classList.toggle('storyboard-chrome-hidden')
  }, [])

  return (
    <span style={{ opacity: hidden ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      <TriggerButton
        aria-label={config.ariaLabel || 'Toggle toolbars'}
        size={config.size || 'icon-xl'}
        tabIndex={tabindex}
        onClick={toggle}
      >
        <Icon name={config.icon || 'primer/light-bulb'} size={16} {...(config.meta || {})} />
      </TriggerButton>
    </span>
  )
}
