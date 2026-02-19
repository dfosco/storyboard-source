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
import { fetchRouteCommentsSummary, fetchCommentDetail, moveComment } from '../api.js'
import { getCachedComments, setCachedComments, clearCachedComments } from '../commentCache.js'
import { showComposer } from './composer.js'
import { openAuthModal } from './authModal.js'
import { showCommentWindow, closeCommentWindow } from './commentWindow.js'

let banner = null
let overlay = null
let activeComposer = null
let renderedPins = []
let cachedDiscussion = null

function esc(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}

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
  container.appendChild(overlay)

  return overlay
}

function showBanner() {
  if (banner) return
  banner = document.createElement('div')
  banner.className = 'sb-banner fixed flex items-center pe-none sans-serif sb-shadow'
  banner.innerHTML = `
    Comment mode — click to place a comment. Press
    <kbd class="sb-kbd">C</kbd> or
    <kbd class="sb-kbd">Esc</kbd> to exit.
  `
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

function reloadComments() {
  clearCachedComments(getCurrentRoute())
  loadAndRenderComments()
}

function renderPin(ov, comment, index) {
  const hue = Math.round((index * 137.5) % 360)
  const pin = document.createElement('div')
  pin.className = 'sb-comment-pin absolute br-100 sb-bg pointer sb-shadow pe-auto overflow-hidden'
  pin.style.left = `${comment.meta?.x ?? 0}%`
  pin.style.top = `${comment.meta?.y ?? 0}%`
  pin.style.setProperty('--pin-hue', String(hue))

  if (comment.meta?.resolved) pin.setAttribute('data-resolved', 'true')
  pin.title = `${comment.author?.login ?? 'unknown'}: ${comment.text?.slice(0, 80) ?? ''}`

  pin.innerHTML = comment.author?.avatarUrl
    ? `<img class="br-100 db sb-pin-img" src="${esc(comment.author.avatarUrl)}" alt="${esc(comment.author.login)}" draggable="false" />`
    : ''

  pin._commentId = comment.id
  comment._rawBody = comment.body

  let dragged = false

  pin.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    dragged = false
    const container = getContentContainer()
    const containerRect = container.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startLeft = (parseFloat(pin.style.left) / 100) * containerRect.width
    const startTop = (parseFloat(pin.style.top) / 100) * containerRect.height

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!dragged && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      dragged = true
      const cr = container.getBoundingClientRect()
      const xPct = Math.round(((startLeft + dx) / cr.width) * 1000) / 10
      const yPct = Math.round(((startTop + dy) / cr.height) * 1000) / 10
      pin.style.left = `${xPct}%`
      pin.style.top = `${yPct}%`
    }

    const onUp = async (ev) => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (!dragged) return

      const cr = container.getBoundingClientRect()
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const xPct = Math.round(((startLeft + dx) / cr.width) * 1000) / 10
      const yPct = Math.round(((startTop + dy) / cr.height) * 1000) / 10
      comment.meta = { ...comment.meta, x: xPct, y: yPct }

      try {
        await moveComment(comment.id, comment._rawBody ?? comment.body ?? '', xPct, yPct)
        comment._rawBody = null
        clearCachedComments(getCurrentRoute())
      } catch (err) {
        console.error('[storyboard] Failed to move pin:', err)
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    e.preventDefault()
  })

  pin.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (dragged) return
    if (activeComposer) {
      activeComposer.destroy()
      activeComposer = null
    }
    // Lazy-load full comment detail (replies, reactions, createdAt)
    try {
      const detail = await fetchCommentDetail(comment.id)
      if (detail) {
        detail._rawBody = detail.body
        showCommentWindow(ov, detail, cachedDiscussion, {
          onClose: () => {},
          onMove: () => reloadComments(),
        })
      }
    } catch (err) {
      console.warn('[storyboard] Could not load comment detail:', err.message)
      // Fall back to summary data
      showCommentWindow(ov, comment, cachedDiscussion, {
        onClose: () => {},
        onMove: () => reloadComments(),
      })
    }
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
  const route = getCurrentRoute()

  // 1. Render from cache — skip API if cache is fresh
  const cached = getCachedComments(route)
  if (cached) {
    cachedDiscussion = cached
    renderCachedPins()
    return
  }

  // 2. Cache miss/expired — fetch lightweight summary
  try {
    const discussion = await fetchRouteCommentsSummary(route)
    cachedDiscussion = discussion
    if (discussion) {
      setCachedComments(route, discussion)
    }
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

async function autoOpenCommentFromUrl(ov, discussion) {
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

  // Lazy-load full detail before opening window
  try {
    const detail = await fetchCommentDetail(commentId)
    if (detail) {
      detail._rawBody = detail.body
      showCommentWindow(ov, detail, discussion, {
        onClose: () => {},
        onMove: () => reloadComments(),
      })
      return
    }
  } catch (err) {
    console.warn('[storyboard] Could not load comment detail:', err.message)
  }

  // Fallback to summary data
  comment._rawBody = comment.body
  showCommentWindow(ov, comment, discussion, {
    onClose: () => {},
    onMove: () => reloadComments(),
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
      reloadComments()
    },
  })
}

function setBodyCommentMode(active) {
  if (active) {
    document.body.classList.add('sb-comment-mode')
    showBanner()
    ensureOverlay()
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
      overlay.remove()
      overlay = null
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

  // Click handler for placing comments — uses document so devtools/modals can be excluded
  document.addEventListener('click', (e) => {
    if (!isCommentModeActive()) return
    // Let devtools, modals, drawers, and existing comment UI handle their own clicks
    if (e.target.closest('.sb-devtools-wrapper') || e.target.closest('.sb-auth-backdrop') ||
        e.target.closest('.sb-comments-drawer') || e.target.closest('.sb-comments-drawer-backdrop') ||
        e.target.closest('.sb-composer') || e.target.closest('.sb-comment-pin') ||
        e.target.closest('.sb-comment-window')) return
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
