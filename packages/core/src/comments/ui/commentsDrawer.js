/**
 * Comments drawer — Alpine.js right-side panel listing all comments across all routes.
 *
 * Opened from the DevTools "See all comments" menu item.
 * Clicking a comment navigates to its route and opens it.
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { listDiscussions, fetchRouteDiscussion } from '../api.js'
import { getCommentsConfig } from '../config.js'
import { isAuthenticated } from '../auth.js'
import { setCommentMode } from '../commentMode.js'

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function esc(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
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
  backdrop.addEventListener('click', closeCommentsDrawer)

  const drawer = document.createElement('div')
  drawer.className = 'sb-comments-drawer sb-drawer-animate fixed top-0 right-0 bottom-0 flex flex-column sb-bg bl sb-b-default sb-shadow sans-serif'

  drawer.innerHTML = `
    <div x-data="sbCommentsDrawer">
      <!-- Header -->
      <div class="flex items-center justify-between ph4 pv3 bb sb-b-muted flex-shrink-0">
        <h2 class="f5 fw6 sb-fg ma0">All Comments</h2>
        <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer sb-close-btn"
                aria-label="Close"
                @click="closeDrawer()">×</button>
      </div>

      <!-- Body -->
      <div class="flex-auto overflow-y-auto pa0">
        <!-- Loading state -->
        <template x-if="loading">
          <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">Loading comments…</div>
        </template>

        <!-- Error state -->
        <template x-if="error">
          <div class="pv4 ph4 tc sb-fg-muted sb-f-sm" x-text="'Failed to load comments: ' + error"></div>
        </template>

        <!-- Empty state -->
        <template x-if="!loading && !error && groups.length === 0">
          <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">No comments yet</div>
        </template>

        <!-- Comment groups by route -->
        <template x-for="group in groups" :key="group.route">
          <div class="bb sb-b-muted">
            <div class="flex items-center ph4 pv2 sb-bg-inset f7 fw6 sb-fg-muted">
              <span class="code sb-fg-accent" x-text="group.route"></span>
              <span class="ml-auto fw4 flex flex-nowrap sb-f-xs sb-min-w-max"
                    x-text="group.comments.length + (group.comments.length !== 1 ? ' comments' : ' comment')"></span>
            </div>
            <template x-for="comment in group.comments" :key="comment.id">
              <button class="flex ph4 pv2 pointer bn bg-transparent w-100 tl sans-serif sb-drawer-btn"
                      :class="comment.meta?.resolved ? 'sb-drawer-btn-resolved' : ''"
                      @click="navigateTo(group.route, comment.id)">
                <template x-if="comment.author?.avatarUrl">
                  <img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar"
                       :src="comment.author.avatarUrl"
                       :alt="comment.author?.login ?? ''" />
                </template>
                <div class="flex flex-column flex-auto sb-min-w-0 gap-2">
                  <div class="flex items-center">
                    <span class="f7 fw6 mr1"
                          :class="comment.meta?.resolved ? 'sb-fg-muted' : 'sb-fg'"
                          x-text="comment.author?.login ?? 'unknown'"></span>
                    <template x-if="comment.createdAt">
                      <span class="sb-fg-muted mr1 sb-f-xs" x-text="formatDate(comment.createdAt)"></span>
                    </template>
                    <template x-if="comment.meta?.resolved">
                      <span class="sb-fg-success br-pill ph1 sb-badge-resolved">Resolved</span>
                    </template>
                  </div>
                  <p class="ma0 overflow-hidden nowrap truncate lh-copy sb-f-sm"
                     :class="comment.meta?.resolved ? 'sb-fg-muted' : 'sb-fg'"
                     x-text="(comment.text ?? '').slice(0, 100)"></p>
                  <template x-if="(comment.replies?.length ?? 0) > 0">
                    <div class="sb-fg-muted mt1 sb-f-xs"
                         x-text="'💬 ' + comment.replies.length + ' ' + (comment.replies.length === 1 ? 'reply' : 'replies')"></div>
                  </template>
                </div>
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>
  `

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

  // Register Alpine component (once)
  if (!window.Alpine._sbDrawerRegistered) {
    window.Alpine.data('sbCommentsDrawer', () => ({
      loading: true,
      error: null,
      groups: [],

      async init() {
        try {
          const discussions = await listDiscussions()
          if (!discussions || discussions.length === 0) {
            this.loading = false
            return
          }

          const basePath = getCommentsConfig()?.basePath ?? '/'
          const result = []

          for (const disc of discussions) {
            const routeMatch = disc.title?.match(/^Comments:\s*(.+)$/)
            if (!routeMatch) continue
            const route = routeMatch[1]
            if (!route.startsWith(basePath)) continue

            let discussion
            try { discussion = await fetchRouteDiscussion(route) } catch { continue }
            if (!discussion?.comments?.length) continue

            result.push({ route, comments: discussion.comments })
          }

          this.groups = result
        } catch (err) {
          this.error = err.message
        } finally {
          this.loading = false
        }
      },

      formatDate(dateStr) { return timeAgo(dateStr) },

      closeDrawer() { closeCommentsDrawer() },

      navigateTo(route, commentId) {
        closeCommentsDrawer()
        if (window.location.pathname !== route) {
          const navUrl = new URL(window.location.href)
          navUrl.pathname = route
          navUrl.searchParams.set('comment', commentId)
          window.location.href = navUrl.toString()
        } else {
          const navUrl = new URL(window.location.href)
          navUrl.searchParams.set('comment', commentId)
          window.history.replaceState(null, '', navUrl.toString())
          setCommentMode(true)
        }
      },
    }))
    window.Alpine._sbDrawerRegistered = true
  }

  // Initialize Alpine on the new DOM
  window.Alpine.initTree(drawer)
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
