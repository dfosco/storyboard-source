/**
 * Mount the comments system — keyboard shortcut, cursor overlay, click-to-comment.
 *
 * Uses Alpine.js for reactive UI. Call mountComments() once at app startup
 * (after initCommentsConfig).
 */

import Alpine from 'alpinejs'
import { isCommentsEnabled } from '../config.js'
import { isAuthenticated } from '../auth.js'
import { toggleCommentMode, setCommentMode, isCommentModeActive, subscribeToCommentMode } from '../commentMode.js'
import { fetchRouteDiscussion } from '../api.js'
import { showComposer } from './composer.js'
import { openAuthModal } from './authModal.js'
import { showCommentWindow, closeCommentWindow } from './commentWindow.js'
import { applyTheme } from './themeBridge.js'

const CURSOR_SVG_LIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%231f2328" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>`
const CURSOR_SVG_DARK = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>`

const STYLE_ID = 'sb-comment-mode-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    [data-color-mode="dark"] .sb-comment-mode,
    [data-dark-theme] .sb-comment-mode {
      cursor: url("data:image/svg+xml,${CURSOR_SVG_DARK}") 4 2, crosshair;
    }
    [data-color-mode="light"] .sb-comment-mode,
    [data-light-theme] .sb-comment-mode {
      cursor: url("data:image/svg+xml,${CURSOR_SVG_LIGHT}") 4 2, crosshair;
    }
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${CURSOR_SVG_DARK}") 4 2, crosshair;
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
      background: var(--bgColor-emphasis);
      color: var(--fgColor-onEmphasis);
      padding: 6px 16px;
      border-radius: 8px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      backdrop-filter: blur(8px);
      box-shadow: var(--shadow-overlay, 0 2px 8px rgba(0,0,0,0.3));
    }
    .sb-comment-mode-banner kbd {
      display: inline-block;
      padding: 1px 5px;
      font-size: 11px;
      font-family: inherit;
      border: 1px solid var(--borderColor-muted);
      border-radius: 4px;
      background: var(--bgColor-muted);
    }
    .sb-comment-pin {
      position: absolute;
      z-index: 100000;
      width: 32px;
      height: 32px;
      margin-left: -16px;
      margin-top: -16px;
      border-radius: 50%;
      background: var(--bgColor-default);
      border: 3px solid hsl(var(--pin-hue, 140), 50%, 38%);
      cursor: pointer;
      box-shadow: var(--shadow-overlay, 0 2px 8px rgba(0,0,0,0.4));
      pointer-events: auto;
      transition: transform 100ms ease;
      overflow: hidden;
    }
    .sb-comment-pin img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    .sb-comment-pin:hover {
      transform: scale(1.15);
    }
    .sb-comment-pin[data-resolved="true"] {
      border-color: var(--fgColor-muted);
      opacity: 0.5;
    }
  `
  document.head.appendChild(style)
}

let banner = null
let bannerThemeCleanup = null
let overlay = null
let activeComposer = null
let renderedPins = []
let cachedDiscussion = null

function getContentContainer() {
  return document.querySelector('main') || document.body
}

function ensureOverlay() {
  if (overlay) return overlay
  const container = getContentContainer()
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
  bannerThemeCleanup = applyTheme(banner)
}

function hideBanner() {
  if (!banner) return
  bannerThemeCleanup?.()
  bannerThemeCleanup = null
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

  const hue = (index * 137.5) % 360
  pin.style.setProperty('--pin-hue', String(Math.round(hue)))

  if (comment.author?.avatarUrl) {
    const img = document.createElement('img')
    img.src = comment.author.avatarUrl
    img.alt = comment.author.login ?? ''
    pin.appendChild(img)
  }

  if (comment.meta?.resolved) pin.setAttribute('data-resolved', 'true')
  pin.title = `${comment.author?.login ?? 'unknown'}: ${comment.text?.slice(0, 80) ?? ''}`

  pin._commentId = comment.id
  comment._rawBody = comment.body

  pin.addEventListener('click', (e) => {
    e.stopPropagation()
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

function renderCachedPins() {
  if (!cachedDiscussion?.comments?.length) return
  const ov = ensureOverlay()
  clearPins()
  cachedDiscussion.comments.forEach((comment, i) => {
    if (comment.meta?.x != null && comment.meta?.y != null) {
      renderPin(ov, comment, i)
    }
  })
}

async function loadAndRenderComments() {
  if (!isAuthenticated()) return
  const ov = ensureOverlay()

  renderCachedPins()

  try {
    const discussion = await fetchRouteDiscussion(getCurrentRoute())
    cachedDiscussion = discussion
    clearPins()
    if (!discussion?.comments?.length) return

    discussion.comments.forEach((comment, i) => {
      if (comment.meta?.x != null && comment.meta?.y != null) {
        renderPin(ov, comment, i)
      }
    })

    autoOpenCommentFromUrl(ov, discussion)
  } catch (err) {
    console.warn('[storyboard] Could not load comments:', err.message)
  }
}

function autoOpenCommentFromUrl(ov, discussion) {
  const commentId = new URLSearchParams(window.location.search).get('comment')
  if (!commentId || !discussion?.comments?.length) return

  const comment = discussion.comments.find(c => c.id === commentId)
  if (!comment) return

  if (comment.meta?.y != null) {
    const container = getContentContainer()
    const yPx = (comment.meta.y / 100) * container.scrollHeight
    const viewTop = container.scrollTop || window.scrollY
    const viewBottom = viewTop + window.innerHeight
    if (yPx < viewTop || yPx > viewBottom) {
      const scrollTarget = Math.max(0, yPx - window.innerHeight / 3)
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
    }
  }

  comment._rawBody = comment.body
  showCommentWindow(ov, comment, discussion, {
    onClose: () => {},
    onMove: () => loadAndRenderComments(),
  })
}

function handleOverlayClick(e) {
  if (!isCommentModeActive()) return
  if (e.target.closest('.sb-composer') || e.target.closest('.sb-comment-pin') || e.target.closest('.sb-comment-window')) return

  closeCommentWindow()

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
    renderCachedPins()
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
 * Initializes Alpine.js for comments UI components.
 * Safe to call multiple times (idempotent).
 */
export function mountComments() {
  if (_mounted) return
  _mounted = true

  injectStyles()

  // Initialize Alpine.js for comments UI
  window.Alpine = Alpine
  Alpine.start()

  subscribeToCommentMode(setBodyCommentMode)

  document.addEventListener('click', (e) => {
    if (!isCommentModeActive()) return
    if (e.target.closest('.sb-devtools-wrapper') || e.target.closest('.sb-auth-backdrop') || e.target.closest('.sb-comments-drawer') || e.target.closest('.sb-comments-drawer-backdrop')) return
    handleOverlayClick(e)
  })

  window.addEventListener('keydown', (e) => {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
      return
    }

    if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!isCommentsEnabled()) return
      e.preventDefault()

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

  if (isCommentsEnabled() && isAuthenticated()) {
    const commentId = new URLSearchParams(window.location.search).get('comment')
    if (commentId) {
      setCommentMode(true)
    }
  }
}
