import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { init } from '@dfosco/storyboard-core'
import StoryboardProvider, { StoryboardContext } from './context.jsx'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: vi.fn(() => ({})) }
})

beforeEach(() => {
  init({
    scenes: {
      default: { title: 'Default Scene' },
      other: { title: 'Other Scene' },
    },
    objects: {},
    records: {},
  })
})

/** Helper component that reads context and renders it. */
function ContextReader({ path }) {
  const ctx = useContext(StoryboardContext)
  if (!ctx) return <span>no context</span>
  if (ctx.error) return <span>error: {ctx.error}</span>
  const value = path ? ctx.data?.[path] : JSON.stringify(ctx)
  return <span data-testid="ctx">{String(value)}</span>
}

describe('StoryboardProvider', () => {
  it('renders children when scene loads successfully', () => {
    render(
      <StoryboardProvider>
        <span>child content</span>
      </StoryboardProvider>,
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('provides scene data via context', () => {
    render(
      <StoryboardProvider>
        <ContextReader path="title" />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('ctx')).toHaveTextContent('Default Scene')
  })

  it('uses sceneName prop when provided', () => {
    render(
      <StoryboardProvider sceneName="other">
        <ContextReader path="title" />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('ctx')).toHaveTextContent('Other Scene')
  })

  it("falls back to 'default' scene when no ?scene= param", () => {
    render(
      <StoryboardProvider>
        <ContextReader path="title" />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('ctx')).toHaveTextContent('Default Scene')
  })

  it('shows error message when scene fails to load', () => {
    render(
      <StoryboardProvider sceneName="nonexistent">
        <ContextReader />
      </StoryboardProvider>,
    )
    expect(screen.getByText(/Error loading scene/)).toBeInTheDocument()
  })

  it('provides sceneName in context value', () => {
    function SceneNameReader() {
      const ctx = useContext(StoryboardContext)
      return <span data-testid="name">{ctx?.sceneName}</span>
    }
    render(
      <StoryboardProvider sceneName="other">
        <SceneNameReader />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('name')).toHaveTextContent('other')
  })

  it('provides loading: false in context value', () => {
    function LoadingReader() {
      const ctx = useContext(StoryboardContext)
      return <span data-testid="loading">{String(ctx?.loading)}</span>
    }
    render(
      <StoryboardProvider>
        <LoadingReader />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })
})
