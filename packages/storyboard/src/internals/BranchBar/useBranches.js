/**
 * useBranches — shared hook for branch data across BranchBar and BranchDropdown.
 * Fetches live branch list from /_storyboard/worktrees API on mount.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'

const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true

export function useBranches(basePath) {
  const [branches, setBranches] = useState(() => {
    if (typeof window !== 'undefined' && Array.isArray(window.__SB_BRANCHES__)) {
      return window.__SB_BRANCHES__
    }
    return null
  })

  const [gitUser, setGitUser] = useState(null)
  const branchBasePath = (basePath || '/').replace(/\/branch--[^/]*\/?$/, '/')

  useEffect(() => {
    const apiBase = (basePath || '/').replace(/\/$/, '')
    const branchManifestUrl = `${branchBasePath.replace(/\/$/, '')}/branches.json`

    fetch(`${apiBase}/_storyboard/git-user`).then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.name) setGitUser(data.name) })
      .catch(() => {})

    // Keep dev behavior: prefer live branch list from server API.
    // On static deployments (GitHub Pages), fallback to branches.json.
    fetch(`${apiBase}/_storyboard/worktrees`).then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data)
          return true
        }
        return false
      })
      .catch(() => false)
      .then((hasLiveData) => {
        if (hasLiveData || isLocalDev) return
        return fetch(branchManifestUrl)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (Array.isArray(data) && data.length > 0) setBranches(data) })
          .catch(() => {})
      })
  }, [basePath, branchBasePath])

  const currentBranch = useMemo(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
    return m ? m[1] : 'main'
  }, [basePath])

  return { branches, currentBranch, branchBasePath, gitUser }
}

export function useSwitchBranch(basePath, branchBasePath) {
  const [switching, setSwitching] = useState(null)
  const [switchError, setSwitchError] = useState(null)

  const switchBranch = useCallback(async (branch, folder, url) => {
    if (switching) return
    setSwitching(branch)
    setSwitchError(null)

    // Dev: each worktree has its own Vite on its own port — navigate directly.
    if (isLocalDev && url) {
      window.location.href = url
      return
    }

    // Prod / static deploy: use folder path within the same origin.
    if (!isLocalDev) {
      window.location.href = `${branchBasePath}${folder || (branch === 'main' ? '' : `branch--${branch}/`)}`
      return
    }

    // Dev fallback: target worktree isn't running. Surface a hint.
    setSwitchError(`No dev server running for "${branch}". Start it with: storyboard dev`)
    setSwitching(null)
  }, [branchBasePath, switching])

  return { switching, switchError, switchBranch }
}
