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

let banner = null
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
  overlay.className = 'sb-comment-overlay absolute top-0 right-0 bottom-0 left-0 pe-none'
  overlay.style.zIndex = '99998'
  container.appendChild(overlay)

  overlay.addEventListener('click', (e) => {
    if (!isCommentModeActive()) return
    handleOverlayClick(e)
  })

  return overlay
}

function showBanner() {
  if (banner) return
  banner = document.createElement('div')
  banner.className = 'fixed flex items-center pe-none sans-serif sb-shadow'
  banner.style.cssText = 'bottom:12px;left:50%;transform:translateX(-50%);z-index:99999;background:var(--sb-bg);color:var(--sb-fg);padding:6px 16px;border-radius:8px;font-size:13px;line-height:1.4;backdrop-filter:blur(12px)'
  banner.innerHTML = 'Comment mode — click to place a comment. Press <kbd style="display:inline-block;padding:1px 6px;font-size:11px;font-family:inherit;border:1px solid rgba(255,255,255,0.3);border-radius:4px;background:rgba(255,255,255,0.1)">C</kbd> or <kbd style="display:inline-block;padding:1px 6px;font-size:11px;font-family:inherit;border:1px solid rgba(255,255,255,0.3);border-radius:4px;background:rgba(255,255,255,0.1)">Esc</kbd> to exit.'
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
  pin.className = 'sb-comment-pin absolute br-100 sb-bg pointer sb-shadow pe-auto overflow-hidden'
  pin.style.cssText = 'z-index:100000;width:32px;height:32px;margin-left:-16px;margin-top:-16px;transition:transform 100ms ease-in-out'
  pin.style.left = `${comment.meta?.x ?? 0}%`
  pin.style.top = `${comment.meta?.y ?? 0}%`

  const hue = (index * 137.5) % 360
  pin.style.setProperty('--pin-hue', String(Math.round(hue)))

  if (comment.author?.avatarUrl) {
    const img = document.createElement('img')
    img.className = 'br-100 db'
    img.style.cssText = 'width:100%;height:100%;object-fit:cover'
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
    ov.classList.remove('pe-none')
    ov.classList.add('pe-auto')
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
    if (overlay) {
      overlay.classList.remove('pe-auto')
      overlay.classList.add('pe-none')
    }
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

  // Initialize Alpine.js for comments UI
  window.Alpine = Alpine
  Alpine.start()

  subscribeToCommentMode(setBodyCommentMode)

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
