/**
 * Comment window — vanilla JS popup that shows a comment thread with replies and reactions.
 *
 * Opens when clicking a comment pin. Shows comment body, author, replies,
 * reply input, reactions, and supports drag-to-move.
 */

import { replyToComment, addReaction, removeReaction, moveComment, resolveComment, fetchRouteDiscussion } from '../api.js'
import { getCachedUser } from '../auth.js'

const STYLE_ID = 'sb-comment-window-style'

const REACTION_EMOJI = {
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  LAUGH: '😄',
  HOORAY: '🎉',
  CONFUSED: '😕',
  HEART: '❤️',
  ROCKET: '🚀',
  EYES: '👀',
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .sb-comment-window {
      position: absolute;
      z-index: 100001;
      width: 320px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .sb-comment-window-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #21262d;
      cursor: grab;
      user-select: none;
    }
    .sb-comment-window-header:active {
      cursor: grabbing;
    }

    .sb-comment-window-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sb-comment-window-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-comment-window-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-comment-window-time {
      font-size: 11px;
      color: #484f58;
      margin-left: 4px;
    }

    .sb-comment-window-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    }
    .sb-comment-window-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-comment-window-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .sb-comment-window-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .sb-comment-window-action-btn:hover {
      background: #21262d;
      color: #c9d1d9;
    }
    .sb-comment-window-action-btn[data-resolved="true"] {
      color: #3fb950;
    }
    .sb-comment-window-action-btn[data-copied="true"] {
      color: #3fb950;
    }

    .sb-comment-window-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .sb-comment-window-text {
      font-size: 13px;
      line-height: 1.5;
      color: #c9d1d9;
      margin: 0 0 8px;
      word-break: break-word;
    }

    .sb-comment-window-reactions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .sb-reaction-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #30363d;
      background: none;
      color: #8b949e;
      cursor: pointer;
      // font-size: 12px;
      font-family: inherit;
      transition: border-color 100ms, background 100ms;
    }
    .sb-reaction-pill span {
      // font-size: 12px;
   }
    .sb-reaction-pill:hover {
      border-color: #8b949e;
    }
    .sb-reaction-pill[data-active="true"] {
      border-color: rgba(88, 166, 255, 0.4);
      background: rgba(88, 166, 255, 0.1);
      color: #58a6ff;
    }

    .sb-reaction-add-btn {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      gap: 4px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: none;
      color: #8b949e;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      position: relative;
      border-color: #30363d;
      background: #21262d;
    }
    .sb-reaction-add-btn:hover {
      border: 1px solid rgba(88, 166, 255, 0.4);
      background: rgba(88, 166, 255, 0.1);
    }

    .sb-reaction-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: 4px;
      z-index: 10;
      display: flex;
      gap: 2px;
      padding: 4px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .sb-reaction-picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: none;
      font-size: 14px;
      cursor: pointer;
      transition: background 100ms;
    }
    .sb-reaction-picker-btn:hover {
      background: #21262d;
    }
    .sb-reaction-picker-btn[data-active="true"] {
      background: rgba(88, 166, 255, 0.15);
      box-shadow: inset 0 0 0 1px rgba(88, 166, 255, 0.4);
    }

    .sb-comment-window-replies {
      border-top: 1px solid #21262d;
      padding-top: 10px;
      margin-top: 4px;
    }

    .sb-comment-window-replies-label {
      font-size: 11px;
      font-weight: 600;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .sb-reply-item {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }

    .sb-reply-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-reply-content {
      flex: 1;
      min-width: 0;
    }

    .sb-reply-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }

    .sb-reply-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-reply-time {
      font-size: 11px;
      color: #484f58;
    }

    .sb-reply-text {
      font-size: 13px;
      line-height: 1.4;
      color: #c9d1d9;
      margin: 0;
      word-break: break-word;
    }

    .sb-reply-reactions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .sb-comment-window-reply-form {
      border-top: 1px solid #21262d;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sb-reply-textarea {
      width: 100%;
      min-height: 40px;
      max-height: 100px;
      padding: 6px 8px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 12px;
      font-family: inherit;
      line-height: 1.4;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-reply-textarea:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-reply-textarea::placeholder {
      color: #484f58;
    }

    .sb-reply-form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .sb-reply-submit-btn {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: none;
      background: #238636;
      color: #fff;
    }
    .sb-reply-submit-btn:hover {
      background: #2ea043;
    }
    .sb-reply-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `
  document.head.appendChild(style)
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Build a reaction bar for a comment or reply.
 * @param {object} item - The comment/reply object with reactionGroups
 * @returns {HTMLElement}
 */
function buildReactionBar(item) {
  const bar = document.createElement('div')
  bar.className = item.replies ? 'sb-comment-window-reactions' : 'sb-reply-reactions'

  function render() {
    bar.innerHTML = ''
    const groups = item.reactionGroups ?? []

    for (const group of groups) {
      if (group.users?.totalCount === 0 && !group.viewerHasReacted) continue
      const count = group.users?.totalCount ?? 0
      if (count === 0) continue

      const pill = document.createElement('button')
      pill.className = 'sb-reaction-pill'
      pill.dataset.active = String(!!group.viewerHasReacted)
      pill.innerHTML = `<span>${REACTION_EMOJI[group.content] ?? group.content}</span><span>${count}</span>`
      pill.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleReaction(item, group.content, group, render)
      })
      bar.appendChild(pill)
    }

    // Add reaction button
    const addBtn = document.createElement('button')
    addBtn.className = 'sb-reaction-add-btn'
    addBtn.textContent = '😀 +'
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      showPicker(addBtn, item, render)
    })
    bar.appendChild(addBtn)
  }

  render()
  return bar
}

function showPicker(anchorBtn, item, rerenderBar) {
  // Remove any existing picker
  const existing = anchorBtn.querySelector('.sb-reaction-picker')
  if (existing) { existing.remove(); return }

  const picker = document.createElement('div')
  picker.className = 'sb-reaction-picker'

  for (const [content, emoji] of Object.entries(REACTION_EMOJI)) {
    const groups = item.reactionGroups ?? []
    const reacted = groups.some(r => r.content === content && r.viewerHasReacted)

    const btn = document.createElement('button')
    btn.className = 'sb-reaction-picker-btn'
    btn.dataset.active = String(reacted)
    btn.textContent = emoji
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const group = groups.find(r => r.content === content)
      toggleReaction(item, content, group, rerenderBar)
      picker.remove()
    })
    picker.appendChild(btn)
  }

  anchorBtn.appendChild(picker)

  // Close picker on next click outside
  function onClickOutside(e) {
    if (!picker.contains(e.target) && e.target !== anchorBtn) {
      picker.remove()
      document.removeEventListener('click', onClickOutside, true)
    }
  }
  setTimeout(() => document.addEventListener('click', onClickOutside, true), 0)
}

async function toggleReaction(item, content, existingGroup, rerenderBar) {
  const wasReacted = existingGroup?.viewerHasReacted ?? false

  // Optimistic update
  if (!item.reactionGroups) item.reactionGroups = []

  if (wasReacted && existingGroup) {
    existingGroup.users = { totalCount: Math.max(0, (existingGroup.users?.totalCount ?? 1) - 1) }
    existingGroup.viewerHasReacted = false
    if (existingGroup.users.totalCount === 0) {
      item.reactionGroups = item.reactionGroups.filter(r => r.content !== content)
    }
  } else if (existingGroup) {
    existingGroup.users = { totalCount: (existingGroup.users?.totalCount ?? 0) + 1 }
    existingGroup.viewerHasReacted = true
  } else {
    item.reactionGroups.push({
      content,
      users: { totalCount: 1 },
      viewerHasReacted: true,
    })
  }

  rerenderBar()

  try {
    if (wasReacted) {
      await removeReaction(item.id, content)
    } else {
      await addReaction(item.id, content)
    }
  } catch (err) {
    console.error('[storyboard] Reaction toggle failed:', err)
  }
}

// Track the currently open window so only one is open at a time
let activeWindow = null

/**
 * Show a comment window for a given comment.
 * @param {HTMLElement} container - The positioned container element (overlay)
 * @param {object} comment - The parsed comment object (with meta, text, replies, reactionGroups, author, etc.)
 * @param {object} discussion - The discussion object (id needed for replies)
 * @param {object} [callbacks] - Optional callbacks
 * @param {() => void} [callbacks.onClose] - Called when window is closed
 * @param {() => void} [callbacks.onMove] - Called after comment is moved (for re-rendering pins)
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function showCommentWindow(container, comment, discussion, callbacks = {}) {
  injectStyles()

  // Close any existing window
  if (activeWindow) {
    activeWindow.destroy()
    activeWindow = null
  }

  const user = getCachedUser()
  const win = document.createElement('div')
  win.className = 'sb-comment-window'
  win.style.left = `${comment.meta?.x ?? 0}%`
  win.style.top = `${comment.meta?.y ?? 0}%`
  win.style.transform = 'translate(12px, -50%)'

  // --- Header (draggable) ---
  const header = document.createElement('div')
  header.className = 'sb-comment-window-header'

  const headerLeft = document.createElement('div')
  headerLeft.className = 'sb-comment-window-header-left'

  if (comment.author?.avatarUrl) {
    const avatar = document.createElement('img')
    avatar.className = 'sb-comment-window-avatar'
    avatar.src = comment.author.avatarUrl
    avatar.alt = comment.author.login ?? ''
    headerLeft.appendChild(avatar)
  }

  const authorSpan = document.createElement('span')
  authorSpan.className = 'sb-comment-window-author'
  authorSpan.textContent = comment.author?.login ?? 'unknown'
  headerLeft.appendChild(authorSpan)

  if (comment.createdAt) {
    const timeSpan = document.createElement('span')
    timeSpan.className = 'sb-comment-window-time'
    timeSpan.textContent = timeAgo(comment.createdAt)
    headerLeft.appendChild(timeSpan)
  }

  header.appendChild(headerLeft)

  const headerActions = document.createElement('div')
  headerActions.className = 'sb-comment-window-header-actions'

  // Resolve button
  const resolveBtn = document.createElement('button')
  resolveBtn.className = 'sb-comment-window-action-btn'
  resolveBtn.setAttribute('aria-label', comment.meta?.resolved ? 'Resolved' : 'Resolve')
  resolveBtn.title = comment.meta?.resolved ? 'Resolved' : 'Resolve'
  resolveBtn.textContent = comment.meta?.resolved ? 'Resolved' : 'Resolve'
  if (comment.meta?.resolved) resolveBtn.dataset.resolved = 'true'
  resolveBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (comment.meta?.resolved) return
    resolveBtn.dataset.resolved = 'true'
    resolveBtn.textContent = 'Resolved'
    resolveBtn.title = 'Resolved'
    try {
      await resolveComment(comment.id, comment._rawBody ?? comment.body ?? '')
      comment.meta = { ...comment.meta, resolved: true }
      callbacks.onMove?.()
    } catch (err) {
      console.error('[storyboard] Failed to resolve comment:', err)
      resolveBtn.dataset.resolved = 'false'
      resolveBtn.textContent = 'Resolve'
      resolveBtn.title = 'Resolve'
    }
  })
  headerActions.appendChild(resolveBtn)

  // Share button
  const shareBtn = document.createElement('button')
  shareBtn.className = 'sb-comment-window-action-btn'
  shareBtn.setAttribute('aria-label', 'Copy link')
  shareBtn.title = 'Copy link'
  shareBtn.textContent = 'Copy link'
  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    url.searchParams.set('comment', comment.id)
    navigator.clipboard.writeText(url.toString()).then(() => {
      shareBtn.dataset.copied = 'true'
      shareBtn.textContent = 'Copied!'
      shareBtn.title = 'Copied!'
      setTimeout(() => {
        shareBtn.dataset.copied = 'false'
        shareBtn.textContent = 'Copy link'
        shareBtn.title = 'Copy link'
      }, 2000)
    }).catch(() => {
      // Fallback: select text in a temp input
      const input = document.createElement('input')
      input.value = url.toString()
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    })
  })
  headerActions.appendChild(shareBtn)

  // Close button
  const closeBtn = document.createElement('button')
  closeBtn.className = 'sb-comment-window-close'
  closeBtn.innerHTML = '×'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    destroy()
  })
  headerActions.appendChild(closeBtn)

  header.appendChild(headerActions)
  win.appendChild(header)

  // --- Body ---
  const body = document.createElement('div')
  body.className = 'sb-comment-window-body'

  const textP = document.createElement('p')
  textP.className = 'sb-comment-window-text'
  textP.textContent = comment.text ?? ''
  body.appendChild(textP)

  // Reactions for the main comment
  body.appendChild(buildReactionBar(comment))

  // --- Replies ---
  const replies = comment.replies ?? []
  if (replies.length > 0) {
    const repliesSection = document.createElement('div')
    repliesSection.className = 'sb-comment-window-replies'

    const repliesLabel = document.createElement('div')
    repliesLabel.className = 'sb-comment-window-replies-label'
    repliesLabel.textContent = `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}`
    repliesSection.appendChild(repliesLabel)

    for (const reply of replies) {
      const replyEl = document.createElement('div')
      replyEl.className = 'sb-reply-item'

      if (reply.author?.avatarUrl) {
        const avatar = document.createElement('img')
        avatar.className = 'sb-reply-avatar'
        avatar.src = reply.author.avatarUrl
        avatar.alt = reply.author.login ?? ''
        replyEl.appendChild(avatar)
      }

      const content = document.createElement('div')
      content.className = 'sb-reply-content'

      const meta = document.createElement('div')
      meta.className = 'sb-reply-meta'

      const authorEl = document.createElement('span')
      authorEl.className = 'sb-reply-author'
      authorEl.textContent = reply.author?.login ?? 'unknown'
      meta.appendChild(authorEl)

      if (reply.createdAt) {
        const timeEl = document.createElement('span')
        timeEl.className = 'sb-reply-time'
        timeEl.textContent = timeAgo(reply.createdAt)
        meta.appendChild(timeEl)
      }

      content.appendChild(meta)

      const replyText = document.createElement('p')
      replyText.className = 'sb-reply-text'
      replyText.textContent = reply.text ?? reply.body ?? ''
      content.appendChild(replyText)

      // Reply reactions
      content.appendChild(buildReactionBar(reply))

      replyEl.appendChild(content)
      repliesSection.appendChild(replyEl)
    }

    body.appendChild(repliesSection)
  }

  win.appendChild(body)

  // --- Reply form ---
  if (user && discussion) {
    const form = document.createElement('div')
    form.className = 'sb-comment-window-reply-form'

    const textarea = document.createElement('textarea')
    textarea.className = 'sb-reply-textarea'
    textarea.placeholder = 'Reply…'
    form.appendChild(textarea)

    const actions = document.createElement('div')
    actions.className = 'sb-reply-form-actions'

    const submitBtn = document.createElement('button')
    submitBtn.className = 'sb-reply-submit-btn'
    submitBtn.textContent = 'Reply'
    submitBtn.disabled = true

    textarea.addEventListener('input', () => {
      submitBtn.disabled = !textarea.value.trim()
    })

    async function submitReply() {
      const text = textarea.value.trim()
      if (!text) return

      submitBtn.disabled = true
      submitBtn.textContent = 'Posting…'

      try {
        await replyToComment(discussion.id, comment.id, text)
        textarea.value = ''
        submitBtn.textContent = 'Reply'
        // Refresh the window with new data
        callbacks.onMove?.()
      } catch (err) {
        console.error('[storyboard] Failed to post reply:', err)
        submitBtn.textContent = 'Reply'
        submitBtn.disabled = false
      }
    }

    submitBtn.addEventListener('click', submitReply)

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        submitReply()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    })

    actions.appendChild(submitBtn)
    form.appendChild(actions)
    win.appendChild(form)
  }

  // --- Drag to move ---
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let winStartLeft = 0
  let winStartTop = 0

  function onMouseDown(e) {
    // Only drag from header, not action buttons
    if (e.target.closest('.sb-comment-window-header-actions')) return
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY

    const containerRect = container.getBoundingClientRect()
    // Parse current position from percentage
    winStartLeft = (parseFloat(win.style.left) / 100) * containerRect.width
    winStartTop = (parseFloat(win.style.top) / 100) * containerRect.height

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    e.preventDefault()
  }

  function onMouseMove(e) {
    if (!isDragging) return
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY

    const containerRect = container.getBoundingClientRect()
    const newLeft = winStartLeft + dx
    const newTop = winStartTop + dy

    const xPct = Math.round((newLeft / containerRect.width) * 1000) / 10
    const yPct = Math.round((newTop / containerRect.height) * 1000) / 10

    win.style.left = `${xPct}%`
    win.style.top = `${yPct}%`
  }

  async function onMouseUp(e) {
    if (!isDragging) return
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // Calculate final position percentage
    const containerRect = container.getBoundingClientRect()
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    const newLeft = winStartLeft + dx
    const newTop = winStartTop + dy
    const xPct = Math.round((newLeft / containerRect.width) * 1000) / 10
    const yPct = Math.round((newTop / containerRect.height) * 1000) / 10

    // Only update if actually moved
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      // Update the pin position
      comment.meta = { ...comment.meta, x: xPct, y: yPct }

      // Move the corresponding pin element without re-rendering everything
      const pins = container.querySelectorAll('.sb-comment-pin')
      for (const pin of pins) {
        if (pin._commentId === comment.id) {
          pin.style.left = `${xPct}%`
          pin.style.top = `${yPct}%`
          break
        }
      }

      try {
        await moveComment(comment.id, comment._rawBody ?? '', xPct, yPct)
        // Update raw body with new metadata for future moves
        comment._rawBody = null // force re-fetch on next move
      } catch (err) {
        console.error('[storyboard] Failed to move comment:', err)
      }
    }
  }

  header.addEventListener('mousedown', onMouseDown)

  // Stop clicks from propagating to overlay
  win.addEventListener('click', (e) => e.stopPropagation())

  // Set URL param for deep linking
  const url = new URL(window.location.href)
  url.searchParams.set('comment', comment.id)
  window.history.replaceState(null, '', url.toString())

  container.appendChild(win)

  function destroy() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    win.remove()
    if (activeWindow?.el === win) activeWindow = null
    // Clear URL param
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('comment')
    window.history.replaceState(null, '', currentUrl.toString())
    callbacks.onClose?.()
  }

  activeWindow = { el: win, destroy }
  return { el: win, destroy }
}

/**
 * Close the currently open comment window, if any.
 */
export function closeCommentWindow() {
  if (activeWindow) {
    activeWindow.destroy()
    activeWindow = null
  }
}
