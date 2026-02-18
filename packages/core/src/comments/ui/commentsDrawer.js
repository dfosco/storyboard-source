/**
 * Comments drawer — Alpine.js right-side panel listing all comments across all routes.
 *
 * Opened from the DevTools "See all comments" menu item.
 * Clicking a comment navigates to its route and opens it.
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { listDiscussions, fetchRouteDiscussion } from '../api.js'
import { parseMetadata } from '../metadata.js'
import { isAuthenticated } from '../auth.js'
import { setCommentMode } from '../commentMode.js'

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

  const backdrop = document.createElement('div')
  backdrop.className = 'sb-comments-drawer-backdrop fixed top-0 right-0 bottom-0 left-0'
  backdrop.style.cssText = 'z-index:99997;background:rgba(0,0,0,0.4)'
  backdrop.addEventListener('click', closeCommentsDrawer)

  const drawer = document.createElement('div')
  drawer.className = 'sb-comments-drawer sb-drawer-animate fixed top-0 right-0 bottom-0 flex flex-column sb-bg bl sb-b-default sb-shadow sans-serif'
  drawer.style.cssText = 'z-index:99998;width:420px;max-width:90vw'

  // Header
  const header = document.createElement('div')
  header.className = 'flex items-center justify-between ph4 pv3 bb sb-b-muted flex-shrink-0'

  const title = document.createElement('h2')
  title.className = 'f5 fw6 sb-fg ma0'
  title.textContent = 'All Comments'
  header.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.className = 'flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer'
  closeBtn.style.cssText = 'width:28px;height:28px;font-size:18px;line-height:1'
  closeBtn.innerHTML = '×'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.addEventListener('click', closeCommentsDrawer)
  header.appendChild(closeBtn)

  drawer.appendChild(header)

  // Body
  const body = document.createElement('div')
  body.className = 'flex-auto overflow-y-auto pa0'

  const loading = document.createElement('div')
  loading.className = 'pv4 ph4 tc sb-fg-muted'
  loading.style.fontSize = '13px'
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
      empty.className = 'pv4 ph4 tc sb-fg-muted'
      empty.style.fontSize = '13px'
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
      group.className = 'bb sb-b-muted'

      const routeHeader = document.createElement('div')
      routeHeader.className = 'flex items-center ph4 pv2 sb-bg-inset f7 fw6 sb-fg-muted'
      routeHeader.innerHTML = `<span class="code sb-fg-accent">${route}</span><span class="ml-auto fw4 flex flex-nowrap" style="font-size:11px;min-width:max-content">${discussion.comments.length} comment${discussion.comments.length !== 1 ? 's' : ''}</span>`
      group.appendChild(routeHeader)

      for (const comment of discussion.comments) {
        const btn = document.createElement('button')
        btn.className = 'flex ph4 pv2 pointer bn bg-transparent w-100 tl sans-serif'
        btn.style.cssText = 'font:inherit;transition:background 100ms'

        const avatar = comment.author?.avatarUrl
          ? `<img class="br-100 ba sb-b-default flex-shrink-0 mr2" style="width:24px;height:24px" src="${comment.author.avatarUrl}" alt="${comment.author?.login ?? ''}" />`
          : ''

        const resolvedBadge = comment.meta?.resolved
          ? '<span class="sb-fg-success br-pill ph1" style="font-size:10px;background:color-mix(in srgb, var(--sb-fg-success) 10%, transparent)">Resolved</span>'
          : ''

        const replyCount = comment.replies?.length ?? 0
        const repliesText = replyCount > 0
          ? `<div class="sb-fg-muted mt1" style="font-size:11px">💬 ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</div>`
          : ''

        btn.innerHTML = `
          ${avatar}
          <div class="flex-auto" style="min-width:0">
            <div class="flex items-center mb1">
              <span class="f7 fw6 sb-fg mr1">${comment.author?.login ?? 'unknown'}</span>
              ${comment.createdAt ? `<span class="sb-fg-muted mr1" style="font-size:11px">${timeAgo(comment.createdAt)}</span>` : ''}
              ${resolvedBadge}
            </div>
            <p class="sb-fg ma0 overflow-hidden nowrap truncate lh-copy" style="font-size:13px;text-overflow:ellipsis">${comment.text?.slice(0, 100) ?? ''}</p>
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
      empty.className = 'pv4 ph4 tc sb-fg-muted'
      empty.style.fontSize = '13px'
      empty.textContent = 'No comments yet'
      body.appendChild(empty)
    }
  } catch (err) {
    body.innerHTML = ''
    const errEl = document.createElement('div')
    errEl.className = 'pv4 ph4 tc sb-fg-muted'
    errEl.style.fontSize = '13px'
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
