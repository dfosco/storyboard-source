import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import InlineStoryRenderer from './InlineStoryRenderer.jsx'

vi.mock('../../../core/index.js', () => ({
  getStoryData: vi.fn(),
}))

import { getStoryData } from '../../../core/index.js'

function GoodComponent() { return <div data-testid="good">hello</div> }
function ThrowingComponent() { throw new Error('boom') }

describe('InlineStoryRenderer', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    getStoryData.mockReset()
  })

  it('renders the named export when found', async () => {
    getStoryData.mockReturnValue({
      _storyImport: () => Promise.resolve({ Default: GoodComponent }),
    })
    render(<InlineStoryRenderer storyId="my-story" exportName="Default" />)
    await waitFor(() => expect(screen.getByTestId('good')).toBeTruthy())
  })

  it('reports missing story', () => {
    getStoryData.mockReturnValue(null)
    render(<InlineStoryRenderer storyId="missing" exportName="Default" />)
    expect(screen.getByText(/Story "missing" not found/)).toBeTruthy()
  })

  it('reports missing export', async () => {
    getStoryData.mockReturnValue({
      _storyImport: () => Promise.resolve({ Other: GoodComponent }),
    })
    render(<InlineStoryRenderer storyId="s" exportName="Default" />)
    await waitFor(() => expect(screen.getByText(/Export "Default" not found/)).toBeTruthy())
  })

  it('contains thrown render errors via error boundary', async () => {
    getStoryData.mockReturnValue({
      _storyImport: () => Promise.resolve({ Default: ThrowingComponent }),
    })
    render(<InlineStoryRenderer storyId="bad" exportName="Default" />)
    await waitFor(() => expect(screen.getByText(/boom/)).toBeTruthy())
  })

  it('re-imports on storyboard:story-index-changed', async () => {
    let calls = 0
    getStoryData.mockImplementation(() => ({
      _storyImport: () => {
        calls += 1
        return Promise.resolve({ Default: GoodComponent })
      },
    }))
    render(<InlineStoryRenderer storyId="s" exportName="Default" />)
    await waitFor(() => expect(calls).toBe(1))
    act(() => {
      document.dispatchEvent(new Event('storyboard:story-index-changed'))
    })
    await waitFor(() => expect(calls).toBe(2))
  })
})
