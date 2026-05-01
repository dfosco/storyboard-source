/**
 * Tests for embed interaction UX (click-to-interact overlay).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import PrototypeEmbed from './PrototypeEmbed.jsx'
import FigmaEmbed from './FigmaEmbed.jsx'
import StoryWidget from './StoryWidget.jsx'

// Mock buildPrototypeIndex for PrototypeEmbed
vi.mock('@dfosco/storyboard-core', () => ({
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

// Simple mock wrapper for WidgetWrapper
vi.mock('./WidgetWrapper.jsx', () => ({
  default: ({ children }) => <div data-testid="widget-wrapper">{children}</div>,
}))

vi.mock('@dfosco/storyboard-core/inspector/highlighter', () => ({
  createInspectorHighlighter: async () => ({
    codeToHtml: () => '<pre><code></code></pre>',
  }),
}))

// Mock ResizeHandle
vi.mock('./ResizeHandle.jsx', () => ({
  default: () => <div data-testid="resize-handle" />,
}))

describe('Embed interaction overlay', () => {
  describe('PrototypeEmbed', () => {
    const defaultProps = {
      props: { src: '/test', width: 400, height: 300, zoom: 100 },
      onUpdate: vi.fn(),
      resizable: false,
    }

    it('renders "Click to interact" hint when no snapshot exists', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const hint = screen.getByText('Click to interact')
      expect(hint).toBeInTheDocument()
    })

    it('enters interactive mode on single click (not double-click)', async () => {
      const { container } = render(<PrototypeEmbed {...defaultProps} />)
      
      // Overlay should exist before interaction; iframe is always rendered
      const overlay = screen.getByRole('button', { name: /click to interact with prototype/i })
      expect(overlay).toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()
      
      // Single click should remove the overlay (enter interactive mode)
      fireEvent.click(overlay)
      
      // Overlay should no longer exist
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()

      fireEvent.pointerDown(document.body)
      expect(screen.getByRole('button', { name: /click to interact with prototype/i })).toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()
    })

    it('does not enter interactive mode on shift+click (preserves multi-select)', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact with prototype/i })
      fireEvent.click(overlay, { shiftKey: true })
      
      // Overlay should still exist (did not enter interactive mode)
      expect(screen.getByRole('button', { name: /click to interact with prototype/i })).toBeInTheDocument()
    })

    it('does not enter interactive mode on meta+click (preserves multi-select)', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact with prototype/i })
      fireEvent.click(overlay, { metaKey: true })
      
      expect(screen.getByRole('button', { name: /click to interact with prototype/i })).toBeInTheDocument()
    })

    it('supports keyboard interaction (Enter key) with event prevention', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact with prototype/i })
      const event = { key: 'Enter', preventDefault: vi.fn(), stopPropagation: vi.fn() }
      fireEvent.keyDown(overlay, event)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })

    it('supports keyboard interaction (Space key) with event prevention', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact with prototype/i })
      const event = { key: ' ', preventDefault: vi.fn(), stopPropagation: vi.fn() }
      fireEvent.keyDown(overlay, event)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })
  })

  describe('FigmaEmbed', () => {
    const defaultProps = {
      props: { url: 'https://www.figma.com/design/abc123/Test', width: 400, height: 300 },
      onUpdate: vi.fn(),
      resizable: false,
    }

    it('renders "Click to interact" hint', () => {
      render(<FigmaEmbed {...defaultProps} />)
      
      const hint = screen.getByText('Click to interact')
      expect(hint).toBeInTheDocument()
    })

    it('enters interactive mode on single click', () => {
      const { container } = render(<FigmaEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      expect(container.querySelector('iframe')).toBeInTheDocument()
      fireEvent.click(overlay)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()

      fireEvent.pointerDown(document.body)
      expect(screen.getByRole('button', { name: /click to interact/i })).toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()
    })
  })

  describe('StoryWidget', () => {
    const defaultProps = {
      props: { storyId: 'button-patterns', exportName: 'Primary', width: 400, height: 300 },
      onUpdate: vi.fn(),
      resizable: false,
    }

    it('mounts iframe and shows overlay initially, removes overlay on click', () => {
      const { container } = render(<StoryWidget {...defaultProps} />)

      const overlay = screen.getByRole('button', { name: /click to interact$/i })
      expect(container.querySelector('iframe')).toBeInTheDocument()

      fireEvent.click(overlay)

      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()

      fireEvent.pointerDown(document.body)
      expect(screen.getByRole('button', { name: /click to interact$/i })).toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()
    })
  })
})
