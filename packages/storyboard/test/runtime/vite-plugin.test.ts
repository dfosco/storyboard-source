import { describe, expect, it } from 'vitest'
import { decideRedirect, storyboardRuntimePlugin } from '../../src/runtime/vite-plugin/index.js'

describe('decideRedirect (H1 base-redirect hardening)', () => {
  describe('on /branch--0.5.0/', () => {
    const ownBase = '/branch--0.5.0/'

    it('passes /@vite assets through', () => {
      expect(decideRedirect('/@vite/client', ownBase)).toEqual({ kind: 'pass' })
      expect(decideRedirect('/node_modules/foo', ownBase)).toEqual({ kind: 'pass' })
    })

    it('passes own-branch requests through', () => {
      expect(decideRedirect('/branch--0.5.0/', ownBase)).toEqual({ kind: 'pass' })
      expect(decideRedirect('/branch--0.5.0/foo/bar', ownBase)).toEqual({ kind: 'pass' })
      expect(decideRedirect('/branch--0.5.0', ownBase)).toEqual({ kind: 'pass' })
    })

    it('REFUSES foreign /branch--<other>/ — closes H1', () => {
      expect(decideRedirect('/branch--dfosco/foo', ownBase)).toEqual({
        kind: 'refuse', foreignBranch: 'dfosco',
      })
      expect(decideRedirect('/branch--dfosco', ownBase)).toEqual({
        kind: 'refuse', foreignBranch: 'dfosco',
      })
    })

    it('redirects bare paths (Vite convenience preserved)', () => {
      expect(decideRedirect('/foo/bar', ownBase)).toEqual({
        kind: 'redirect', to: '/branch--0.5.0/foo/bar',
      })
    })
  })

  describe('on / (main)', () => {
    const ownBase = '/'
    it('treats /branch--<x>/ as foreign (main has no branch)', () => {
      expect(decideRedirect('/branch--anything/x', ownBase)).toEqual({
        kind: 'refuse', foreignBranch: 'anything',
      })
    })
    it('passes everything else', () => {
      expect(decideRedirect('/foo', ownBase)).toEqual({ kind: 'pass' })
    })
  })
})

describe('storyboardRuntimePlugin', () => {
  it('is a no-op when no env / opts present', () => {
    const p = storyboardRuntimePlugin()
    expect(p.config?.({}, { command: 'serve', mode: 'development' } as never)).toBeUndefined()
  })

  it('sets server.hmr.path under /branch--<branch>/__vite_hmr (H6 fix)', () => {
    const p = storyboardRuntimePlugin({ branch: '0.5.0', devDomain: 'storyboard-core' })
    const cfg = p.config?.({}, { command: 'serve', mode: 'development' } as never)
    expect(cfg).toEqual({
      server: { hmr: { path: '/branch--0.5.0/__vite_hmr' } },
    })
  })

  it('does NOT set hmr.path on main (no branch prefix to namespace under)', () => {
    const p = storyboardRuntimePlugin({ branch: 'main', devDomain: 'storyboard-core' })
    const cfg = p.config?.({}, { command: 'serve', mode: 'development' } as never)
    expect(cfg).toBeUndefined()
  })

  it('reads STORYBOARD_RUNTIME_BRANCH/_DOMAIN from env', () => {
    const orig = { b: process.env.STORYBOARD_RUNTIME_BRANCH, d: process.env.STORYBOARD_RUNTIME_DOMAIN }
    process.env.STORYBOARD_RUNTIME_BRANCH = '0.5.0'
    process.env.STORYBOARD_RUNTIME_DOMAIN = 'storyboard-core'
    try {
      const p = storyboardRuntimePlugin()
      const cfg = p.config?.({}, { command: 'serve', mode: 'development' } as never)
      expect(cfg).toEqual({
        server: { hmr: { path: '/branch--0.5.0/__vite_hmr' } },
      })
    } finally {
      if (orig.b === undefined) delete process.env.STORYBOARD_RUNTIME_BRANCH
      else process.env.STORYBOARD_RUNTIME_BRANCH = orig.b
      if (orig.d === undefined) delete process.env.STORYBOARD_RUNTIME_DOMAIN
      else process.env.STORYBOARD_RUNTIME_DOMAIN = orig.d
    }
  })
})

describe('plugin middleware (H1 integration)', () => {
  it('returns 421 with HTML on foreign branch request', async () => {
    const p = storyboardRuntimePlugin({ branch: '0.5.0', devDomain: 'storyboard-core' })
    const headers: Record<string, string> = {}
    let statusCode = 0
    let body = ''
    const middlewares: Array<(req: unknown, res: unknown, next: () => void) => void> = []
    const fakeServer = {
      middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => middlewares.push(fn) },
    } as never
    p.configureServer?.(fakeServer)
    expect(middlewares).toHaveLength(1)

    const req = { url: '/branch--dfosco/foo' }
    const res = {
      statusCode: 0,
      setHeader: (k: string, v: string) => { headers[k] = v },
      end: (b: string) => { body = b; statusCode = res.statusCode },
    }
    let nextCalled = false
    middlewares[0]!(req, res, () => { nextCalled = true })
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(421)
    expect(headers['Content-Type']).toContain('text/html')
    expect(body).toContain('421')
    expect(body).toContain('branch--dfosco')
    expect(body).toContain('storyboard-core.localhost')
  })

  it('passes own-branch request through', () => {
    const p = storyboardRuntimePlugin({ branch: '0.5.0', devDomain: 'storyboard-core' })
    const middlewares: Array<(req: unknown, res: unknown, next: () => void) => void> = []
    const fakeServer = {
      middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => middlewares.push(fn) },
    } as never
    p.configureServer?.(fakeServer)
    let nextCalled = false
    middlewares[0]!({ url: '/branch--0.5.0/foo' }, { statusCode: 0 }, () => { nextCalled = true })
    expect(nextCalled).toBe(true)
  })
})
