import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import storyboardDataPlugin from './data-plugin.js'

const RESOLVED_ID = '\0virtual:storyboard-data-index'

let tmpDir

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), 'sb-test-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

function createPlugin(root) {
  const plugin = storyboardDataPlugin()
  plugin.configResolved({ root: root ?? tmpDir })
  return plugin
}

function writeDataFiles(dir) {
  writeFileSync(
    path.join(dir, 'default.scene.json'),
    JSON.stringify({ title: 'Test' }),
  )
  writeFileSync(
    path.join(dir, 'user.object.json'),
    JSON.stringify({ name: 'Jane' }),
  )
  writeFileSync(
    path.join(dir, 'posts.record.json'),
    JSON.stringify([{ id: '1', title: 'First' }]),
  )
}

describe('storyboardDataPlugin', () => {
  it("has name 'storyboard-data'", () => {
    const plugin = storyboardDataPlugin()
    expect(plugin.name).toBe('storyboard-data')
  })

  it("has enforce 'pre'", () => {
    const plugin = storyboardDataPlugin()
    expect(plugin.enforce).toBe('pre')
  })

  it('config() excludes @dfosco/storyboard-react from optimizeDeps', () => {
    const plugin = storyboardDataPlugin()
    const config = plugin.config()
    expect(config.optimizeDeps.exclude).toContain('@dfosco/storyboard-react')
  })

  it("resolveId returns resolved ID for 'virtual:storyboard-data-index'", () => {
    const plugin = createPlugin()
    expect(plugin.resolveId('virtual:storyboard-data-index')).toBe(RESOLVED_ID)
  })

  it('resolveId returns undefined for other IDs', () => {
    const plugin = createPlugin()
    expect(plugin.resolveId('some-other-module')).toBeUndefined()
  })

  it('load generates valid module code with init() call', () => {
    writeDataFiles(tmpDir)
    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain("import { init } from '@dfosco/storyboard-core'")
    expect(code).toContain('init({ scenes, objects, records })')
    expect(code).toContain('"Test"')
    expect(code).toContain('"Jane"')
    expect(code).toContain('"First"')
  })

  it('load returns null for other IDs', () => {
    const plugin = createPlugin()
    expect(plugin.load('other-id')).toBeNull()
  })

  it('duplicate data files throw an error', () => {
    writeFileSync(
      path.join(tmpDir, 'dup.scene.json'),
      JSON.stringify({ a: 1 }),
    )
    const subDir = path.join(tmpDir, 'nested')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(
      path.join(subDir, 'dup.scene.json'),
      JSON.stringify({ a: 2 }),
    )

    const plugin = createPlugin()
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/Duplicate data file/)
  })

  it('handles JSONC files (with comments)', () => {
    writeFileSync(
      path.join(tmpDir, 'commented.scene.jsonc'),
      '{\n  // This is a comment\n  "title": "JSONC Scene"\n}\n',
    )
    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"JSONC Scene"')
  })

  it('buildStart resets the index cache', () => {
    writeDataFiles(tmpDir)
    const plugin = createPlugin()

    // First load builds the index
    const code1 = plugin.load(RESOLVED_ID)
    expect(code1).toContain('"Test"')

    // Add a new file
    writeFileSync(
      path.join(tmpDir, 'extra.scene.json'),
      JSON.stringify({ title: 'Extra' }),
    )

    // Without buildStart, cached index is used — "Extra" won't appear
    const code2 = plugin.load(RESOLVED_ID)
    expect(code2).not.toContain('"Extra"')

    // After buildStart, index is rebuilt
    plugin.buildStart()
    const code3 = plugin.load(RESOLVED_ID)
    expect(code3).toContain('"Extra"')
  })
})
