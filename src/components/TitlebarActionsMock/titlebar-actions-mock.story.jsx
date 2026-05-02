/**
 * Titlebar Actions — mock stories showing ExpandedPaneTopBar
 * with various config-driven action configurations.
 *
 * Each export demonstrates a different titlebar scenario:
 * - No actions (label + close only)
 * - Single toggle action (markdown edit/preview)
 * - Multiple actions
 * - Actions without close button (left pane in split)
 */
import ExpandedPaneTopBar from '../../../packages/storyboard/src/internals/canvas/widgets/ExpandedPaneTopBar.jsx'
import { useState, useCallback } from 'react'

const barWrapperStyle = {
  width: 600,
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
}

const sceneStyle = {
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
  minWidth: 660,
}

const captionStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--fgColor-muted, #656d76)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

/**
 * Titlebar with only label + close button (no actions).
 * This is what terminals, prototypes, etc. show by default.
 */
export function NoActions() {
  return (
    <div style={sceneStyle}>
      <span style={captionStyle}>Fullbar — no actions, just label + close</span>
      <div style={barWrapperStyle}>
        <ExpandedPaneTopBar
          label="Terminal · pearl-wren"
          widgetType="terminal"
          showClose
          onClose={() => {}}
        />
      </div>

      <span style={captionStyle}>Splitbar — left pane (no close)</span>
      <div style={barWrapperStyle}>
        <ExpandedPaneTopBar
          label="Prototype · /Dashboard"
          widgetType="prototype"
          onClose={() => {}}
        />
      </div>
    </div>
  )
}

/**
 * Markdown edit/preview toggle — config-driven feature with toggle state.
 * Clicking the action swaps icon (pencil ↔ eye) and label (Edit ↔ Preview).
 */
export function MarkdownToggle() {
  const [editing, setEditing] = useState(false)

  const features = [
    {
      id: 'toggle-edit',
      type: 'action',
      action: 'toggle-edit',
      label: 'Edit',
      icon: 'edit',
      toggle: {
        stateKey: 'editing',
        activeIcon: 'eye',
        activeLabel: 'Preview',
      },
    },
  ]

  const getState = useCallback((key) => {
    if (key === 'editing') return editing
  }, [editing])

  const onAction = useCallback((actionId) => {
    if (actionId === 'toggle-edit') setEditing(v => !v)
  }, [])

  return (
    <div style={sceneStyle}>
      <span style={captionStyle}>
        Markdown fullbar — toggle-edit action (click to toggle) — {editing ? 'EDITING' : 'VIEWING'}
      </span>
      <div style={barWrapperStyle}>
        <ExpandedPaneTopBar
          label="Markdown · Design decisions in the mock"
          widgetType="markdown"
          features={features}
          getState={getState}
          onAction={onAction}
          showClose
          onClose={() => {}}
        />
      </div>

      <span style={captionStyle}>Same as splitbar — left pane (no close)</span>
      <div style={barWrapperStyle}>
        <ExpandedPaneTopBar
          label="Markdown · Requirements"
          widgetType="markdown"
          features={features}
          getState={getState}
          onAction={onAction}
          onClose={() => {}}
        />
      </div>
    </div>
  )
}

/**
 * Multiple actions — hypothetical widget with several titlebar actions.
 */
export function MultipleActions() {
  return (
    <div style={sceneStyle}>
      <span style={captionStyle}>Multiple config-driven actions + close (top-right pane)</span>
      <div style={barWrapperStyle}>
        <ExpandedPaneTopBar
          label="Story · LoginForm / Default"
          widgetType="story"
          features={[
            { id: 'show-code', type: 'action', action: 'show-code', label: 'Show code', icon: 'code' },
            { id: 'open-external', type: 'action', action: 'open-external', label: 'Open in new tab', icon: 'open-external' },
          ]}
          onAction={(id) => console.log('action:', id)}
          showClose
          onClose={() => {}}
        />
      </div>

      <span style={captionStyle}>Multiple actions — left pane (no close)</span>
      <div style={barWrapperStyle}>
        <ExpandedPaneTopBar
          label="Story · LoginForm / Default"
          widgetType="story"
          features={[
            { id: 'show-code', type: 'action', action: 'show-code', label: 'Show code', icon: 'code' },
            { id: 'open-external', type: 'action', action: 'open-external', label: 'Open in new tab', icon: 'open-external' },
          ]}
          onAction={(id) => console.log('action:', id)}
          onClose={() => {}}
        />
      </div>
    </div>
  )
}

/**
 * Side-by-side: simulates a split-screen with two titlebars.
 * Left pane has actions but no close. Right pane has close as last action.
 */
export function SplitSimulation() {
  const [editing, setEditing] = useState(false)

  const mdFeatures = [
    {
      id: 'toggle-edit',
      type: 'action',
      action: 'toggle-edit',
      label: 'Edit',
      icon: 'edit',
      toggle: { stateKey: 'editing', activeIcon: 'eye', activeLabel: 'Preview' },
    },
  ]

  return (
    <div style={sceneStyle}>
      <span style={captionStyle}>Split-screen simulation — left: markdown (no close), right: story (close)</span>
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        <div style={{ flex: 1 }}>
          <ExpandedPaneTopBar
            label="Markdown · API Notes"
            widgetType="markdown"
            features={mdFeatures}
            getState={(key) => key === 'editing' ? editing : undefined}
            onAction={(id) => { if (id === 'toggle-edit') setEditing(v => !v) }}
            onClose={() => {}}
          />
          <div style={{ background: '#0d1117', padding: 24, color: '#c9d1d9', fontFamily: 'monospace', fontSize: 13, minHeight: 120 }}>
            {editing ? '✏️ Editing mode — textarea would go here' : '👁️ Preview mode — rendered markdown here'}
          </div>
        </div>
        <div style={{ width: 1, background: '#30363d' }} />
        <div style={{ flex: 1 }}>
          <ExpandedPaneTopBar
            label="Story · prototype-selector-mock"
            widgetType="story"
            features={[
              { id: 'show-code', type: 'action', action: 'show-code', label: 'Show code', icon: 'code' },
            ]}
            onAction={() => {}}
            showClose
            onClose={() => {}}
          />
          <div style={{ background: '#0d1117', padding: 24, color: '#c9d1d9', fontFamily: 'monospace', fontSize: 13, minHeight: 120 }}>
            Story iframe content
          </div>
        </div>
      </div>
    </div>
  )
}
