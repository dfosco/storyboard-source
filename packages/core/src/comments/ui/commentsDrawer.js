/**
 * Comments drawer — a right-side panel listing all comments across all routes.
 *
 * Opened from the DevTools "See all comments" menu item.
 * Clicking a comment navigates to its route and opens it.
 */

import { listDiscussions, fetchRouteDiscussion } from '../api.js'
import { parseMetadata } from '../metadata.js'
import { isAuthenticated } from '../auth.js'
import { setCommentMode } from '../commentMode.js'

const STYLE_ID = 'sb-comments-drawer-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .sb-comments-drawer-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99997;
      background: rgba(0, 0, 0, 0.4);
    }

    .sb-comments-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 99998;
      width: 380px;
      max-width: 90vw;
      background: #161b22;
      border-left: 1px solid #30363d;
      box-shadow: -8px 0 24px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      animation: sb-drawer-slide-in 150ms ease;
    }

    @keyframes sb-drawer-slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .sb-comments-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #21262d;
      flex-shrink: 0;
    }

    .sb-comments-drawer-title {
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
      margin: 0;
    }

    .sb-comments-drawer-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .sb-comments-drawer-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-comments-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .sb-comments-drawer-loading {
      padding: 32px 20px;
      text-align: center;
      color: #8b949e;
      font-size: 13px;
    }

    .sb-comments-drawer-empty {
      padding: 32px 20px;
      text-align: center;
      color: #484f58;
      font-size: 13px;
    }

    .sb-comments-drawer-route-group {
      border-bottom: 1px solid #21262d;
    }

    .sb-comments-drawer-route-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: #0d1117;
      font-size: 12px;
      font-weight: 600;
      color: #8b949e;
      text-transform: none;
    }

    .sb-comments-drawer-route-path {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      color: #58a6ff;
    }

    .sb-comments-drawer-route-count {
      margin-left: auto;
      font-size: 11px;
      color: #484f58;
      font-weight: 400;
    }

    .sb-comments-drawer-comment {
      display: flex;
      gap: 10px;
      padding: 10px 20px;
      cursor: pointer;
      transition: background 100ms;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-family: inherit;
    }
    .sb-comments-drawer-comment:hover {
      background: #21262d;
    }

    .sb-comments-drawer-comment-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-comments-drawer-comment-content {
      flex: 1;
      min-width: 0;
    }

    .sb-comments-drawer-comment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .sb-comments-drawer-comment-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-comments-drawer-comment-time {
      font-size: 11px;
      color: #484f58;
    }

    .sb-comments-drawer-comment-resolved {
      font-size: 10px;
      color: #3fb950;
      background: rgba(63, 185, 80, 0.1);
      border-radius: 999px;
      padding: 0 6px;
    }

    .sb-comments-drawer-comment-text {
      font-size: 13px;
      line-height: 1.4;
      color: #c9d1d9;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sb-comments-drawer-comment-replies {
      font-size: 11px;
      color: #8b949e;
      margin-top: 2px;
    }
  `
  document.head.appendChild(style)
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

let activeDrawer = null

/**
 * Open the comments drawer, listing all comments across all routes.
 */
export async function openCommentsDrawer() {
  if (!isAuthenticated()) return
  if (activeDrawer) { closeCommentsDrawer(); return }

  injectStyles()

  const backdrop = document.createElement('div')
  backdrop.className = 'sb-comments-drawer-backdrop'
  backdrop.addEventListener('click', closeCommentsDrawer)

  const drawer = document.createElement('div')
  drawer.className = 'sb-comments-drawer'

  // Header
  const header = document.createElement('div')
  header.className = 'sb-comments-drawer-header'

  const title = document.createElement('h2')
  title.className = 'sb-comments-drawer-title'
  title.textContent = 'All Comments'
  header.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.className = 'sb-comments-drawer-close'
  closeBtn.innerHTML = '×'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.addEventListener('click', closeCommentsDrawer)
  header.appendChild(closeBtn)

  drawer.appendChild(header)

  // Body
  const body = document.createElement('div')
  body.className = 'sb-comments-drawer-body'

  const loading = document.createElement('div')
  loading.className = 'sb-comments-drawer-loading'
  loading.textContent = 'Loading comments…'
  body.appendChild(loading)

  drawer.appendChild(body)

  document.body.appendChild(backdrop)
  document.body.appendChild(drawer)

  activeDrawer = { backdrop, drawer }

  // Escape to close
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeCommentsDrawer()
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }
  window.addEventListener('keydown', onKeyDown, true)
  activeDrawer.onKeyDown = onKeyDown

  // Load all discussions
  try {
    const discussions = await listDiscussions()
    body.innerHTML = ''

    if (!discussions || discussions.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'sb-comments-drawer-empty'
      empty.textContent = 'No comments yet'
      body.appendChild(empty)
      return
    }

    // For each discussion, fetch full comments
    for (const disc of discussions) {
      const routeMatch = disc.title?.match(/^Comments:\s*(.+)$/)
      if (!routeMatch) continue
      const route = routeMatch[1]

      let discussion
      try {
        discussion = await fetchRouteDiscussion(route)
      } catch {
        continue
      }
      if (!discussion?.comments?.length) continue

      const group = document.createElement('div')
      group.className = 'sb-comments-drawer-route-group'

      const routeHeader = document.createElement('div')
      routeHeader.className = 'sb-comments-drawer-route-header'
      routeHeader.innerHTML = `<span class="sb-comments-drawer-route-path">${route}</span><span class="sb-comments-drawer-route-count">${discussion.comments.length} comment${discussion.comments.length !== 1 ? 's' : ''}</span>`
      group.appendChild(routeHeader)

      for (const comment of discussion.comments) {
        const btn = document.createElement('button')
        btn.className = 'sb-comments-drawer-comment'

        const avatar = comment.author?.avatarUrl
          ? `<img class="sb-comments-drawer-comment-avatar" src="${comment.author.avatarUrl}" alt="${comment.author?.login ?? ''}" />`
          : ''

        const resolvedBadge = comment.meta?.resolved
          ? '<span class="sb-comments-drawer-comment-resolved">Resolved</span>'
          : ''

        const replyCount = comment.replies?.length ?? 0
        const repliesText = replyCount > 0
          ? `<div class="sb-comments-drawer-comment-replies">💬 ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</div>`
          : ''

        btn.innerHTML = `
          ${avatar}
          <div class="sb-comments-drawer-comment-content">
            <div class="sb-comments-drawer-comment-meta">
              <span class="sb-comments-drawer-comment-author">${comment.author?.login ?? 'unknown'}</span>
              ${comment.createdAt ? `<span class="sb-comments-drawer-comment-time">${timeAgo(comment.createdAt)}</span>` : ''}
              ${resolvedBadge}
            </div>
            <p class="sb-comments-drawer-comment-text">${comment.text?.slice(0, 100) ?? ''}</p>
            ${repliesText}
          </div>
        `

        btn.addEventListener('click', () => {
          closeCommentsDrawer()
          // Navigate to route if different
          if (window.location.pathname !== route) {
            const url = new URL(window.location.href)
            url.pathname = route
            url.searchParams.set('comment', comment.id)
            window.location.href = url.toString()
          } else {
            // Same route — activate comment mode and open comment
            const url = new URL(window.location.href)
            url.searchParams.set('comment', comment.id)
            window.history.replaceState(null, '', url.toString())
            setCommentMode(true)
          }
        })

        group.appendChild(btn)
      }

      body.appendChild(group)
    }

    if (body.children.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'sb-comments-drawer-empty'
      empty.textContent = 'No comments yet'
      body.appendChild(empty)
    }
  } catch (err) {
    body.innerHTML = ''
    const errEl = document.createElement('div')
    errEl.className = 'sb-comments-drawer-empty'
    errEl.textContent = `Failed to load comments: ${err.message}`
    body.appendChild(errEl)
  }
}

/**
 * Close the comments drawer if open.
 */
export function closeCommentsDrawer() {
  if (!activeDrawer) return
  if (activeDrawer.onKeyDown) {
    window.removeEventListener('keydown', activeDrawer.onKeyDown, true)
  }
  activeDrawer.backdrop.remove()
  activeDrawer.drawer.remove()
  activeDrawer = null
}
