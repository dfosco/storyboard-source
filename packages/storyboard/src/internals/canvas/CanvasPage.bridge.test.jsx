import { fireEvent, render, screen, act, waitFor } from '@testing-library/react'
import CanvasPage from './CanvasPage.jsx'
import { getCanvasPrimerAttrs, getCanvasThemeVars } from './canvasTheme.js'
import { addWidget, checkGitHubCliAvailable, fetchGitHubEmbed, updateCanvas } from './canvasApi.js'

vi.mock('../../canvas/index.js', () => ({
  Canvas: ({ children, onDragEnd }) => (
    <div data-testid="tiny-canvas">
      {children}
      <button
        data-testid="drag-widget"
        onClick={() => onDragEnd?.('widget-1', { x: 111.4, y: 222.7 })}
      >
        drag widget
      </button>
      <button
        data-testid="drag-widget-negative"
        onClick={() => onDragEnd?.('widget-1', { x: -50, y: -30 })}
      >
        drag widget negative
      </button>
      <button
        data-testid="drag-source"
        onClick={() => onDragEnd?.('jsx-PrimaryButtons', { x: 333.2, y: 444.8 })}
      >
        drag source
      </button>
    </div>
  ),
}))

const mockCanvas = {
  title: 'Bridge Test Canvas',
  widgets: [{ id: 'widget-1', type: 'mock-widget', position: { x: 10, y: 20 }, props: {} }],
  sources: [{ export: 'PrimaryButtons', position: { x: 1, y: 2 } }],
  centered: false,
  dotted: false,
  grid: false,
  gridSize: 18,
  colorMode: 'auto',
}

vi.mock('./useCanvas.js', () => ({
  useCanvas: () => ({
    canvas: mockCanvas,
    jsxExports: {
      PrimaryButtons: () => <div data-testid="jsx-widget-content">jsx widget</div>,
    },
    loading: false,
  }),
}))

vi.mock('./widgets/index.js', () => ({
  getWidgetComponent: () => function MockWidget() { return <div>mock widget</div> },
}))

vi.mock('./widgets/WidgetChrome.jsx', () => ({
  default: ({ children }) => <div data-testid="widget-chrome">{children}</div>,
}))

vi.mock('./widgets/widgetProps.js', () => ({
  schemas: {},
  getDefaults: () => ({}),
}))

vi.mock('./widgets/widgetConfig.js', async () => {
  const actual = await vi.importActual('./widgets/widgetConfig.js')
  return {
    getFeatures: () => [],
    isResizable: () => false,
    schemas: {},
    getMenuWidgetTypes: () => [],
    getConnectorDefaults: actual.getConnectorDefaults,
  }
})

vi.mock('./widgets/figmaUrl.js', () => ({
  isFigmaUrl: () => false,
  sanitizeFigmaUrl: (url) => url,
}))

vi.mock('./canvasApi.js', () => ({
  addWidget: vi.fn(),
  checkGitHubCliAvailable: vi.fn(),
  fetchGitHubEmbed: vi.fn(),
  updateCanvas: vi.fn(() => Promise.resolve({ success: true })),
  removeWidget: vi.fn(),
  uploadImage: vi.fn(),
}))

vi.mock('./useUndoRedo.js', () => ({
  default: () => ({
    snapshot: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    reset: vi.fn(),
    canUndo: false,
    canRedo: false,
  }),
}))

describe('CanvasPage canvas bridge', () => {
  function dispatchTextPaste(text) {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: (type) => (type === 'text/plain' ? text : ''),
        items: [],
      },
    })
    document.dispatchEvent(event)
  }

  beforeEach(() => {
    delete window.__storyboardCanvasBridgeState
    vi.clearAllMocks()
    addWidget.mockResolvedValue({
      success: true,
      widget: { id: 'widget-link', type: 'link-preview', position: { x: 0, y: 0 }, props: {} },
    })
    checkGitHubCliAvailable.mockResolvedValue({ available: true })
    fetchGitHubEmbed.mockResolvedValue({ success: false })
  })

  it('publishes bridge state and responds to status requests', () => {
    const mountedHandler = vi.fn()
    const statusHandler = vi.fn()
    document.addEventListener('storyboard:canvas:mounted', mountedHandler)
    document.addEventListener('storyboard:canvas:status', statusHandler)

    const { unmount } = render(<CanvasPage canvasId="design-overview" />)

    expect(window.__storyboardCanvasBridgeState).toEqual({
      active: true,
      canvasId: 'design-overview',
      connectors: [],
      widgets: [{ id: 'widget-1', type: 'mock-widget', position: { x: 10, y: 20 }, props: {} }],
      zoom: 100,
    })
    expect(mountedHandler).toHaveBeenCalled()

    document.dispatchEvent(new CustomEvent('storyboard:canvas:status-request'))
    expect(statusHandler).toHaveBeenCalled()
    expect(statusHandler.mock.calls.at(-1)?.[0]?.detail).toEqual({
      active: true,
      canvasId: 'design-overview',
      connectors: [],
      widgets: [{ id: 'widget-1', type: 'mock-widget', position: { x: 10, y: 20 }, props: {} }],
      zoom: 100,
    })

    unmount()

    document.removeEventListener('storyboard:canvas:mounted', mountedHandler)
    document.removeEventListener('storyboard:canvas:status', statusHandler)
  })

  it('marks bridge inactive on unmount', () => {
    const unmountedHandler = vi.fn()
    document.addEventListener('storyboard:canvas:unmounted', unmountedHandler)

    const { unmount } = render(<CanvasPage canvasId="design-overview" />)
    unmount()

    expect(unmountedHandler).toHaveBeenCalled()
    expect(window.__storyboardCanvasBridgeState).toEqual({
      active: false,
      canvasId: '',
      zoom: 100,
    })

    document.removeEventListener('storyboard:canvas:unmounted', unmountedHandler)
  })

  it('shows gh install banner when gh is unavailable during GitHub URL paste', async () => {
    checkGitHubCliAvailable.mockResolvedValue({
      available: false,
      installUrl: 'https://github.com/cli/cli',
    })

    render(<CanvasPage name="design-overview" />)

    await act(async () => {
      dispatchTextPaste('https://github.com/dfosco/storyboard/issues/42')
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(addWidget).toHaveBeenCalled()
    })
    expect(fetchGitHubEmbed).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Install GitHub CLI' })).toHaveAttribute(
      'href',
      'https://github.com/cli/cli',
    )
  })

  it('hydrates GitHub metadata when gh is available during paste', async () => {
    checkGitHubCliAvailable.mockResolvedValue({ available: true })
    fetchGitHubEmbed.mockResolvedValue({
      success: true,
      snapshot: {
        kind: 'issue',
        parentKind: 'issue',
        context: 'GitHub · dfosco/storyboard · Issue #42',
        title: '#42 Ship GitHub embeds',
        body: 'Details from GitHub',
        authors: ['dfosco'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    })

    render(<CanvasPage name="design-overview" />)

    await act(async () => {
      dispatchTextPaste('https://github.com/dfosco/storyboard/issues/42')
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(fetchGitHubEmbed).toHaveBeenCalledWith('https://github.com/dfosco/storyboard/issues/42')
    })
    expect(addWidget).toHaveBeenCalledWith(
      'design-overview',
      expect.objectContaining({
        type: 'link-preview',
        props: expect.objectContaining({
          title: '#42 Ship GitHub embeds',
          width: 580,
          height: 400,
          github: expect.objectContaining({
            context: 'GitHub · dfosco/storyboard · Issue #42',
            body: 'Details from GitHub',
          }),
        }),
      }),
    )
  })

  it.skip('persists dragged JSON widgets and JSX sources to canvas JSONL via update API', async () => {
    render(<CanvasPage canvasId="design-overview" />)

    fireEvent.click(screen.getByTestId('drag-widget'))
    // Flush the promise-based write queue
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(updateCanvas).toHaveBeenCalledWith(
      'design-overview',
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            id: 'widget-1',
            position: { x: 111, y: 223 },
          }),
        ]),
      })
    )

    fireEvent.click(screen.getByTestId('drag-source'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(updateCanvas).toHaveBeenCalledWith(
      'design-overview',
      expect.objectContaining({
        sources: expect.arrayContaining([
          expect.objectContaining({
            export: 'PrimaryButtons',
            position: { x: 333, y: 445 },
          }),
        ]),
      })
    )
  })

  it.skip('clamps negative drag positions to zero', async () => {
    render(<CanvasPage canvasId="design-overview" />)

    fireEvent.click(screen.getByTestId('drag-widget-negative'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(updateCanvas).toHaveBeenCalledWith(
      'design-overview',
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            id: 'widget-1',
            position: { x: 0, y: 0 },
          }),
        ]),
      })
    )
  })
})

describe('getCanvasThemeVars', () => {
  it('returns correct tokens for each theme', () => {
    expect(getCanvasThemeVars('light')['--sb--canvas-bg']).toBe('#f6f8fa')
    expect(getCanvasThemeVars('light')['--tc-bg-muted']).toBe('#f6f8fa')
    expect(getCanvasThemeVars('dark')['--sb--canvas-bg']).toBe('#151b23')
    expect(getCanvasThemeVars('dark')['--bgColor-muted']).toBe('#151b23')
    expect(getCanvasThemeVars('dark')['--tc-bg-muted']).toBe('#151b23')
    expect(getCanvasThemeVars('dark_dimmed')['--sb--canvas-bg']).toBe('#262c36')
    expect(getCanvasThemeVars('dark_dimmed')['--bgColor-muted']).toBe('#262c36')
    expect(getCanvasThemeVars('dark_dimmed')['--tc-bg-muted']).toBe('#262c36')
    expect(getCanvasThemeVars('dark_dimmed')['--tc-dot-color']).toBe('rgba(209, 215, 224, 0.18)')
    expect(getCanvasThemeVars('dark_dimmed')['--overlay-backdrop-bgColor']).toBe('rgba(209, 215, 224, 0.18)')
  })

  it('returns distinct values for dark_high_contrast', () => {
    const vars = getCanvasThemeVars('dark_high_contrast')
    expect(vars['--bgColor-default']).toBe('#010409')
    expect(vars['--borderColor-default']).toBe('#b7bdc8')
    expect(vars['--fgColor-default']).toBe('#ffffff')
  })

  it('returns distinct values for dark_colorblind', () => {
    const vars = getCanvasThemeVars('dark_colorblind')
    expect(vars['--bgColor-default']).toBe('#0d1117')
    expect(vars['--fgColor-muted']).toBe('#9198a1')
  })

  it('returns distinct values for light_colorblind', () => {
    const vars = getCanvasThemeVars('light_colorblind')
    expect(vars['--bgColor-default']).toBe('#ffffff')
    expect(vars['--fgColor-muted']).toBe('#59636e')
  })

  it('falls back to light for unknown themes', () => {
    expect(getCanvasThemeVars('unknown')).toEqual(getCanvasThemeVars('light'))
  })
})

describe('getCanvasPrimerAttrs', () => {
  it('maps canvas theme to local Primer mode attrs', () => {
    expect(getCanvasPrimerAttrs('light')).toEqual({
      'data-color-mode': 'light',
      'data-dark-theme': 'dark',
      'data-light-theme': 'light',
    })
    expect(getCanvasPrimerAttrs('light_colorblind')).toEqual({
      'data-color-mode': 'light',
      'data-dark-theme': 'dark',
      'data-light-theme': 'light_colorblind',
    })
    expect(getCanvasPrimerAttrs('dark')).toEqual({
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark',
      'data-light-theme': 'light',
    })
    expect(getCanvasPrimerAttrs('dark_dimmed')).toEqual({
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark_dimmed',
      'data-light-theme': 'light',
    })
    expect(getCanvasPrimerAttrs('dark_high_contrast')).toEqual({
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark_high_contrast',
      'data-light-theme': 'light',
    })
    expect(getCanvasPrimerAttrs('dark_colorblind')).toEqual({
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark_colorblind',
      'data-light-theme': 'light',
    })
  })
})

describe('canvas target fallback', () => {
  it('stays light when canvas target is unchecked even if stale canvas attribute is dark', () => {
    localStorage.setItem('sb-theme-sync', JSON.stringify({
      prototype: true,
      toolbar: true,
      codeBoxes: true,
      canvas: false,
    }))
    localStorage.setItem('sb-color-scheme', 'dark')
    document.documentElement.setAttribute('data-sb-canvas-theme', 'dark')

    render(<CanvasPage canvasId="design-overview" />)

    const scroll = document.querySelector('[data-storyboard-canvas-scroll]')
    const jsxWidget = document.getElementById('jsx-PrimaryButtons')
    expect(scroll?.style.getPropertyValue('--sb--canvas-bg')).toBe('#f6f8fa')
    expect(scroll?.style.getPropertyValue('--tc-bg-muted')).toBe('#f6f8fa')
    expect(scroll?.getAttribute('data-color-mode')).toBe('light')
    expect(jsxWidget?.getAttribute('data-color-mode')).toBe('light')
    expect(jsxWidget?.style.getPropertyValue('--bgColor-default')).toBe('#ffffff')
  })
})
