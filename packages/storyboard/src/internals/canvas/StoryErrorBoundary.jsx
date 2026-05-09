/**
 * Shared error boundary for isolated story rendering.
 *
 * Used by:
 *  - componentIsolate.jsx (the iframe shell at /_storyboard/canvas/isolate)
 *  - InlineStoryRenderer (in-process story rendering when canvas.inlineStories=true)
 *
 * Catches render errors so a broken story cannot crash the parent (canvas or shell).
 */
import { createElement, Component as ReactComponent } from 'react'

const errorStyle = {
  padding: '16px',
  color: '#cf222e',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

export class StoryErrorBoundary extends ReactComponent {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }
  render() {
    if (this.state.error) {
      return createElement('div', { style: errorStyle },
        createElement('strong', null, this.props.name || 'Component'),
        createElement('br'),
        String(this.state.error.message || this.state.error),
      )
    }
    return this.props.children
  }
}

export default StoryErrorBoundary
