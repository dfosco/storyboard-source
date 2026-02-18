import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { init } from '@dfosco/storyboard-core'
import StoryboardProvider, { StoryboardContext } from './context.jsx'
import { useLocation } from 'react-router-dom'

const mockUseLocation = vi.fn(() => ({ pathname: '/', search: '', hash: '' }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
    useLocation: (...args) => mockUseLocation(...args),
  }
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

  it('auto-matches scene by pathname and resolves $ref data', () => {
    init({
      scenes: {
        default: { title: 'Default' },
        Repositories: {
          '$global': ['navigation'],
          heading: 'All repos',
        },
      },
      objects: {
        navigation: { topnav: [{ label: 'Home' }, { label: 'Repos' }] },
      },
      records: {},
    })

    // Simulate navigating to /base/Repositories
    mockUseLocation.mockReturnValue({ pathname: '/base/Repositories', search: '', hash: '' })

    render(
      <StoryboardProvider>
        <ContextReader path="heading" />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('ctx')).toHaveTextContent('All repos')
  })

  it('resolves $ref objects when auto-matching scene by pathname', () => {
    init({
      scenes: {
        default: { title: 'Default' },
        Repositories: {
          '$global': ['navigation'],
          heading: 'All repos',
        },
      },
      objects: {
        navigation: { topnav: [{ label: 'Home' }, { label: 'Repos' }] },
      },
      records: {},
    })

    mockUseLocation.mockReturnValue({ pathname: '/base/Repositories', search: '', hash: '' })

    function NavReader() {
      const ctx = useContext(StoryboardContext)
      const topnav = ctx?.data?.topnav
      return <span data-testid="nav">{topnav ? topnav.map(n => n.label).join(',') : 'none'}</span>
    }

    render(
      <StoryboardProvider>
        <NavReader />
      </StoryboardProvider>,
    )
    // $global navigation object should be resolved — topnav merged at root
    expect(screen.getByTestId('nav')).toHaveTextContent('Home,Repos')
  })

  it('reads ?scene= param from location.search', () => {
    mockUseLocation.mockReturnValue({ pathname: '/whatever', search: '?scene=other', hash: '' })

    render(
      <StoryboardProvider>
        <ContextReader path="title" />
      </StoryboardProvider>,
    )
    expect(screen.getByTestId('ctx')).toHaveTextContent('Other Scene')
  })
})
