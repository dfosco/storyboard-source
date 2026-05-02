/**
 * Tests for iframe snapshot display — single snapshot prop.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import PrototypeEmbed from './PrototypeEmbed.jsx'
import StoryWidget from './StoryWidget.jsx'

vi.mock('../../../core/index.js', () => ({
  buildPrototypeIndex: () => ({
    folders: [],
    prototypes: [
      {
        name: 'Design Overview',
        dirName: 'examples',
        isExternal: false,
        hideFlows: true,
        flows: [{ route: '/test', name: 'default', meta: { title: 'Design Overview' } }],
      },
    ],
    globalFlows: [],
    sorted: { title: { prototypes: [], folders: [] } },
  }),
  getStoryData: (storyId) => ({ _storyModule: `/src/canvas/${storyId}.story.jsx`, _route: `/components/${storyId}` }),
}))

vi.mock('./WidgetWrapper.jsx', () => ({
  default: ({ children }) => <div data-testid="widget-wrapper">{children}</div>,
}))

vi.mock('../../../core/inspector/highlighter.js', () => ({
  createInspectorHighlighter: async () => ({
    codeToHtml: () => '<pre><code></code></pre>',
  }),
}), { virtual: true })

vi.mock('./ResizeHandle.jsx', () => ({
  default: () => <div data-testid="resize-handle" />,
}))

/**
 * Render inside a wrapper with data-sb-canvas-theme, matching the real
 * CanvasPage DOM structure that subscribeCanvasTheme reads from.
 */
function renderInCanvas(ui, theme = 'light') {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-sb-canvas-theme', theme)
  document.body.appendChild(wrapper)
  const result = render(ui, { container: wrapper })
  return { ...result, wrapper }
}

afterEach(() => {
  document.querySelectorAll('[data-sb-canvas-theme]').forEach(el => el.remove())
})

describe('Snapshot display (snapshots removed — iframes always render)', () => {
  describe('PrototypeEmbed', () => {
    it('renders iframe even when snapshot prop is provided', () => {
      const { wrapper } = renderInCanvas(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshot: '/_storyboard/canvas/images/snapshot-proto-abc123.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })

    it('renders iframe when snapshotLight prop is provided', () => {
      const { wrapper } = renderInCanvas(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--light.webp?v=1',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })

    it('renders iframe when no snapshot exists', () => {
      const { wrapper } = renderInCanvas(
        <PrototypeEmbed
          id="proto-xyz"
          props={{ src: '/test', width: 400, height: 300, zoom: 100 }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })

    it('ignores snapshot prop that does not match widget ID', () => {
      const { wrapper } = renderInCanvas(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshot: '/_storyboard/canvas/images/snapshot-other-widget.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })

    it('renders iframe for external URLs regardless of snapshot', () => {
      const { wrapper } = renderInCanvas(
        <PrototypeEmbed
          id="proto-ext"
          props={{
            src: 'https://example.com',
            width: 400,
            height: 300,
            zoom: 100,
            snapshot: '/_storyboard/canvas/images/snapshot-proto-ext.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })
  })

  describe('StoryWidget', () => {
    it('renders iframe even when snapshot prop is provided', () => {
      const { wrapper } = renderInCanvas(
        <StoryWidget
          id="story-abc123"
          props={{
            storyId: 'button-patterns',
            exportName: 'Primary',
            width: 400,
            height: 300,
            snapshot: '/_storyboard/canvas/images/snapshot-story-abc123.webp?v=456',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })

    it('renders iframe when snapshotDark prop is provided', () => {
      const { wrapper } = renderInCanvas(
        <StoryWidget
          id="story-abc123"
          props={{
            storyId: 'button-patterns',
            snapshotDark: '/_storyboard/canvas/images/snapshot-story-abc123--dark.webp?v=1',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })

    it('renders iframe when no snapshot exists', () => {
      const { wrapper } = renderInCanvas(
        <StoryWidget
          id="story-xyz"
          props={{
            storyId: 'button-patterns',
            exportName: 'Primary',
            width: 400,
            height: 300,
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(wrapper.querySelector('img')).not.toBeInTheDocument()
      expect(wrapper.querySelector('iframe')).toBeInTheDocument()
    })
  })
})
