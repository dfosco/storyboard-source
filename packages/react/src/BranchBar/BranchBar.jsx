/**
 * BranchBar — blue accent bar showing current branch and local dev status.
 *
 * Dev: always visible (main or branch). Shows "Local development" label.
 * Prod: shows on non-main branches only.
 */
import { useState, useEffect, useMemo } from 'react'
import { GitBranchIcon } from '@primer/octicons-react'
import css from './BranchBar.module.css'

/** Check if we're in local dev mode (respects ?prodMode simulation). */
function checkLocalDev() {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).has('prodMode')) return false
  return window.__SB_LOCAL_DEV__ === true
}

/** Read the dev domain color injected by the server plugin, validated via CSS.supports. */
function getDevDomainColor() {
  if (typeof window === 'undefined') return null
  const color = window.__SB_DEV_DOMAIN_COLOR__
  if (!color) return null
  if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('color', color)) return null
  return color
}

export default function BranchBar({ basePath }) {
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('storyboard-chrome-hidden')
  )

  const isHiddenByParam = useMemo(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return params.has('_sb_hide_branch_bar') || params.has('_sb_embed')
  }, [])

  const currentBranch = useMemo(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
    return m ? m[1] : 'main'
  }, [basePath])

  const isLocalDev = checkLocalDev()
  const isOnBranch = currentBranch !== 'main'
  const domainColor = isLocalDev ? getDevDomainColor() : null

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.documentElement.classList.contains('storyboard-chrome-hidden'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if ((!isOnBranch && !isLocalDev) || hidden || isHiddenByParam) return null

  function hideChrome() {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: '.', metaKey: true, bubbles: true,
    }))
  }

  return (
    <div className={css.bar} data-branch-bar>
      <div
        className={`${css.barInner}${isLocalDev ? '' : ` ${css.barProd}`}`}
        style={domainColor ? { '--sb-branch-bar-bg': domainColor } : undefined}
      >
        <span className={css.barLabel}>
          <GitBranchIcon size={12} />
          {isLocalDev && window.__SB_DEV_DOMAIN__ && <>
            <span className={css.barDomainName}>{window.__SB_DEV_DOMAIN__}</span>
            <span className={css.barSeparator}>·</span>
          </>}
          <span className={css.barBranchName}>{currentBranch}</span>
          {isLocalDev && <>
            <span className={css.barSeparator}>·</span>
            <span>Local development</span>
          </>}
        </span>
        <div className={css.barActions}>
          <button className={css.barAction} onClick={hideChrome}>Hide</button>
        </div>
      </div>
    </div>
  )
}
