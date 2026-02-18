/**
 * Mount the comments system — keyboard shortcut, cursor overlay, click-to-comment.
 *
 * Call mountComments() once at app startup (after initCommentsConfig).
 */

import { isCommentsEnabled } from '../config.js'
import { isAuthenticated } from '../auth.js'
import { toggleCommentMode, setCommentMode, isCommentModeActive, subscribeToCommentMode } from '../commentMode.js'
import { fetchRouteDiscussion } from '../api.js'
import { showComposer } from './composer.js'
import { openAuthModal } from './authModal.js'
import { showCommentWindow, closeCommentWindow } from './commentWindow.js'

const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>`

const STYLE_ID = 'sb-comment-mode-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${CURSOR_SVG}") 4 2, crosshair;
    }
    .sb-comment-overlay {
      position: absolute;
      inset: 0;
      z-index: 99998;
      pointer-events: none;
    }
    .sb-comment-overlay.active {
      pointer-events: auto;
    }
    .sb-comment-mode-banner {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 6px 16px;
      border-radius: 8px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .sb-comment-mode-banner kbd {
      display: inline-block;
      padding: 1px 5px;
      font-size: 11px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
    }
  `
  document.head.appendChild(style)
}

let banner = null
let overlay = null
let activeComposer = null
let renderedPins = []
let cachedDiscussion = null

function getContentContainer() {
  // Per plan: coordinates relative to <main> or nearest positioned parent
  return document.querySelector('main') || document.body
}

function ensureOverlay() {
  if (overlay) return overlay
  const container = getContentContainer()
  // Ensure container is positioned so absolute children work
  const pos = getComputedStyle(container).position
  if (pos === 'static') container.style.position = 'relative'

  overlay = document.createElement('div')
  overlay.className = 'sb-comment-overlay'
  container.appendChild(overlay)
  return overlay
}

function showBanner() {
  if (banner) return
  banner = document.createElement('div')
  banner.className = 'sb-comment-mode-banner'
  banner.innerHTML = 'Comment mode — click to place a comment. Press <kbd>C</kbd> or <kbd>Esc</kbd> to exit.'
  document.body.appendChild(banner)
}

function hideBanner() {
  if (!banner) return
  banner.remove()
  banner = null
}

function getCurrentRoute() {
  return window.location.pathname
}

function clearPins() {
  for (const pin of renderedPins) pin.remove()
  renderedPins = []
}

function renderPin(ov, comment, index) {
  const pin = document.createElement('div')
  pin.className = 'sb-comment-pin'
  pin.style.left = `${comment.meta?.x ?? 0}%`
  pin.style.top = `${comment.meta?.y ?? 0}%`
  pin.textContent = index + 1
  if (comment.meta?.resolved) pin.setAttribute('data-resolved', 'true')
  pin.title = `${comment.author?.login ?? 'unknown'}: ${comment.text?.slice(0, 80) ?? ''}`

  // Store raw body for move operations
  comment._rawBody = comment.body

  // Click pin to open comment window
  pin.addEventListener('click', (e) => {
    e.stopPropagation()
    // Dismiss any open composer
    if (activeComposer) {
      activeComposer.destroy()
      activeComposer = null
    }
    showCommentWindow(ov, comment, cachedDiscussion, {
      onClose: () => {},
      onMove: () => loadAndRenderComments(),
    })
  })

  ov.appendChild(pin)
  renderedPins.push(pin)
  return pin
}

async function loadAndRenderComments() {
  if (!isAuthenticated()) return
  const ov = ensureOverlay()
  clearPins()

  try {
    const discussion = await fetchRouteDiscussion(getCurrentRoute())
    cachedDiscussion = discussion
    if (!discussion?.comments?.length) return

    discussion.comments.forEach((comment, i) => {
      if (comment.meta?.x != null && comment.meta?.y != null) {
        renderPin(ov, comment, i)
      }
    })
  } catch (err) {
    console.warn('[storyboard] Could not load comments:', err.message)
  }
}

function handleOverlayClick(e) {
  if (!isCommentModeActive()) return
  // Don't place if clicking on an existing composer, pin, or comment window
  if (e.target.closest('.sb-composer') || e.target.closest('.sb-comment-pin') || e.target.closest('.sb-comment-window')) return

  // Close any open comment window
  closeCommentWindow()

  // Dismiss any open composer
  if (activeComposer) {
    activeComposer.destroy()
    activeComposer = null
  }

  const container = getContentContainer()
  const rect = container.getBoundingClientRect()
  const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
  const yPct = Math.round(((e.clientY - rect.top + container.scrollTop) / container.scrollHeight) * 1000) / 10

  const ov = ensureOverlay()
  activeComposer = showComposer(ov, xPct, yPct, getCurrentRoute(), {
    onCancel: () => { activeComposer = null },
    onSubmit: () => {
      activeComposer = null
      // Re-fetch and render all pins to get correct numbering
      loadAndRenderComments()
    },
  })
}

function setBodyCommentMode(active) {
  if (active) {
    document.body.classList.add('sb-comment-mode')
    showBanner()
    const ov = ensureOverlay()
    ov.classList.add('active')
    loadAndRenderComments()
  } else {
    document.body.classList.remove('sb-comment-mode')
    hideBanner()
    if (activeComposer) {
      activeComposer.destroy()
      activeComposer = null
    }
    closeCommentWindow()
    clearPins()
    if (overlay) overlay.classList.remove('active')
  }
}

let _mounted = false

/**
 * Mount the comments system — registers keyboard shortcuts, cursor overlay, and click handler.
 * Safe to call multiple times (idempotent).
 */
export function mountComments() {
  if (_mounted) return
  _mounted = true

  injectStyles()

  // React to comment mode changes
  subscribeToCommentMode(setBodyCommentMode)

  // Click handler for placing comments
  document.addEventListener('click', (e) => {
    if (!isCommentModeActive()) return
    // Ignore clicks on devtools, modals, etc.
    if (e.target.closest('.sb-devtools-wrapper') || e.target.closest('.sb-auth-backdrop')) return
    handleOverlayClick(e)
  })

  // C key toggles comment mode, Escape exits
  window.addEventListener('keydown', (e) => {
    // Don't trigger when typing in inputs
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
      return
    }

    if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!isCommentsEnabled()) return
      e.preventDefault()

      // If not authenticated, open auth modal instead of toggling
      if (!isCommentModeActive() && !isAuthenticated()) {
        openAuthModal()
        return
      }

      toggleCommentMode()
    }

    if (e.key === 'Escape') {
      if (isCommentModeActive()) {
        e.preventDefault()
        setCommentMode(false)
      }
    }
  })
}
