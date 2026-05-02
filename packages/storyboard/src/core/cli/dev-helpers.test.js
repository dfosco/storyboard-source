import { describe, it, expect } from 'vitest'
import { hasUncommittedChanges, localBranchExists, resolveDefaultBranch } from './dev-helpers.js'
import { execSync } from 'child_process'

// These tests run against the real git repo — they verify the helpers
// work correctly with actual git state.

const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()

describe('hasUncommittedChanges', () => {
  it('returns a boolean', () => {
    const result = hasUncommittedChanges(repoRoot)
    expect(typeof result).toBe('boolean')
  })

  it('returns false for non-existent directory', () => {
    expect(hasUncommittedChanges('/tmp/nonexistent-repo-12345')).toBe(false)
  })
})

describe('localBranchExists', () => {
  it('returns true for a branch that exists', () => {
    // The current branch must exist
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim()
    expect(localBranchExists(branch, repoRoot)).toBe(true)
  })

  it('returns false for a branch that does not exist', () => {
    expect(localBranchExists('__nonexistent-branch-xyz-99999__', repoRoot)).toBe(false)
  })

  it('returns false for invalid cwd', () => {
    expect(localBranchExists('main', '/tmp/nonexistent-repo-12345')).toBe(false)
  })
})

describe('resolveDefaultBranch', () => {
  it('returns a string or null', () => {
    const result = resolveDefaultBranch(repoRoot)
    expect(result === null || typeof result === 'string').toBe(true)
  })

  it('prefers main over master when main exists', () => {
    // If main exists in this repo, it should be the default
    if (localBranchExists('main', repoRoot)) {
      expect(resolveDefaultBranch(repoRoot)).toBe('main')
    }
  })

  it('returns null for non-git directory', () => {
    expect(resolveDefaultBranch('/tmp')).toBe(null)
  })
})
