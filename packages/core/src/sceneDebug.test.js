import { vi } from 'vitest'

const { mockLoadScene } = vi.hoisted(() => ({
  mockLoadScene: vi.fn(() => ({ hello: 'world', count: 42 })),
}))

vi.mock('./loader.js', () => ({
  loadScene: mockLoadScene,
}))

// We need a fresh module for each test since sceneDebug has a module-level
// `stylesInjected` boolean. We test style injection on the very first call,
// then subsequent tests just verify other behavior.
import { mountSceneDebug } from './sceneDebug.js'

afterEach(() => {
  document.body.innerHTML = ''
  mockLoadScene.mockReset()
  mockLoadScene.mockReturnValue({ hello: 'world', count: 42 })
})

describe('mountSceneDebug', () => {
  it('injects styles into document.head on first call', () => {
    // This MUST run first to capture the stylesInjected=false → true transition
    mountSceneDebug()

    const styles = document.head.querySelectorAll('style')
    const hasDebugStyle = Array.from(styles).some((el) =>
      el.textContent.includes('.sb-scene-debug')
    )
    expect(hasDebugStyle).toBe(true)
  })

  it('creates an element with class sb-scene-debug', () => {
    const el = mountSceneDebug()

    expect(el.classList.contains('sb-scene-debug')).toBe(true)
  })

  it('appends to document.body by default', () => {
    mountSceneDebug()

    expect(document.body.querySelector('.sb-scene-debug')).toBeInTheDocument()
  })

  it('appends to a custom container', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    mountSceneDebug(container)

    expect(container.querySelector('.sb-scene-debug')).not.toBeNull()
  })

  it('returns the created element', () => {
    const el = mountSceneDebug()

    expect(el).toBeInstanceOf(HTMLElement)
    expect(el.className).toBe('sb-scene-debug')
  })

  it('renders the scene name in the title', () => {
    mountSceneDebug(undefined, 'my-scene')

    const title = document.body.querySelector('.sb-scene-debug-title')
    expect(title).not.toBeNull()
    expect(title.textContent).toContain('my-scene')
  })

  it('defaults scene name to "default" when none is provided', () => {
    mountSceneDebug()

    const title = document.body.querySelector('.sb-scene-debug-title')
    expect(title.textContent).toContain('default')
    expect(mockLoadScene).toHaveBeenCalledWith('default')
  })

  it('renders JSON data in a pre element', () => {
    mountSceneDebug()

    const pre = document.body.querySelector('.sb-scene-debug-code')
    expect(pre).not.toBeNull()
    expect(pre.tagName).toBe('PRE')

    const parsed = JSON.parse(pre.textContent)
    expect(parsed).toEqual({ hello: 'world', count: 42 })
  })

  it('shows error when loadScene throws', () => {
    mockLoadScene.mockImplementation(() => {
      throw new Error('Scene not found')
    })

    const el = mountSceneDebug()

    const errorTitle = el.querySelector('.sb-scene-debug-error-title')
    expect(errorTitle).not.toBeNull()
    expect(errorTitle.textContent).toContain('Error')

    const errorMsg = el.querySelector('.sb-scene-debug-error-message')
    expect(errorMsg.textContent).toContain('Scene not found')

    // Should NOT render the normal title/pre
    expect(el.querySelector('.sb-scene-debug-title')).toBeNull()
    expect(el.querySelector('.sb-scene-debug-code')).toBeNull()
  })

  it('uses ?scene query param when no sceneName argument is given', () => {
    window.history.pushState(null, '', '?scene=overview')

    mountSceneDebug()

    expect(mockLoadScene).toHaveBeenCalledWith('overview')
    const title = document.body.querySelector('.sb-scene-debug-title')
    expect(title.textContent).toContain('overview')

    // Clean up
    window.history.pushState(null, '', '/')
  })

  it('allows multiple debug panels to be mounted', () => {
    mountSceneDebug()
    mountSceneDebug()

    const panels = document.body.querySelectorAll('.sb-scene-debug')
    expect(panels).toHaveLength(2)
  })
})
