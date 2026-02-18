/**
 * Comment window — Alpine.js popup that shows a comment thread with replies and reactions.
 *
 * Opens when clicking a comment pin. Shows comment body, author, replies,
 * reply input, reactions, and supports drag-to-move.
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { replyToComment, addReaction, removeReaction, moveComment, resolveComment, fetchRouteDiscussion } from '../api.js'
import { getCachedUser } from '../auth.js'

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
  bar.className = item.replies
    ? 'flex items-center flex-wrap mb2'
    : 'flex items-center flex-wrap mt1'

  function render() {
    bar.innerHTML = ''
    const groups = item.reactionGroups ?? []

    for (const group of groups) {
      if (group.users?.totalCount === 0 && !group.viewerHasReacted) continue
      const count = group.users?.totalCount ?? 0
      if (count === 0) continue

      const pill = document.createElement('button')
      pill.className = 'sb-reaction-pill dib flex items-center ph2 br-pill sb-pill pointer sans-serif mr1 mb1' 
      pill.style.cssText = 'padding-top:2px;padding-bottom:2px;font-size:12px'
      pill.dataset.active = String(!!group.viewerHasReacted)
      if (group.viewerHasReacted) {
        pill.className = 'sb-reaction-pill dib flex items-center ph2 br-pill sb-pill sb-pill-active pointer sans-serif mr1 mb1'
        pill.style.cssText = 'padding-top:2px;padding-bottom:2px;font-size:12px'
      }
      pill.innerHTML = `<span class="mr1">${REACTION_EMOJI[group.content] ?? group.content}</span><span>${count}</span>`
      pill.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleReaction(item, group.content, group, render)
      })
      bar.appendChild(pill)
    }

    // Add reaction button
    const addBtn = document.createElement('button')
    addBtn.className = 'dib flex items-center ph1 br-pill ba sb-b-default sb-bg-muted sb-fg-muted f7 pointer sans-serif relative mr1 mb1'
    addBtn.style.cssText = 'padding-top:2px;padding-bottom:2px'
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
  const existing = anchorBtn.querySelector('.sb-reaction-picker')
  if (existing) { existing.remove(); return }

  const picker = document.createElement('div')
  picker.className = 'sb-reaction-picker absolute left-0 flex pa1 sb-bg ba sb-b-default br3 sb-shadow'
  picker.style.cssText = 'bottom:100%;margin-bottom:4px;z-index:10'

  for (const [content, emoji] of Object.entries(REACTION_EMOJI)) {
    const groups = item.reactionGroups ?? []
    const reacted = groups.some(r => r.content === content && r.viewerHasReacted)

    const btn = document.createElement('button')
    btn.className = reacted
      ? 'flex items-center justify-center br2 bn f6 pointer mr1'
      : 'flex items-center justify-center br2 bn bg-transparent f6 pointer mr1'
    btn.style.cssText = reacted
      ? 'width:28px;height:28px;background:color-mix(in srgb, var(--sb-fg-accent) 10%, transparent);box-shadow:inset 0 0 0 1px var(--sb-fg-accent);transition:background 100ms'
      : 'width:28px;height:28px;transition:background 100ms'
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
  // Close any existing window
  if (activeWindow) {
    activeWindow.destroy()
    activeWindow = null
  }

  const user = getCachedUser()
  const win = document.createElement('div')
  win.className = 'sb-comment-window absolute flex flex-column sb-bg ba sb-b-default br3 sb-shadow sans-serif overflow-hidden'
  win.style.zIndex = '100001'
  win.style.width = '360px'
  win.style.maxHeight = '480px'
  win.style.left = `${comment.meta?.x ?? 0}%`
  win.style.top = `${comment.meta?.y ?? 0}%`
  win.style.transform = 'translate(12px, -50%)'

  // --- Header (draggable) ---
  const header = document.createElement('div')
  header.className = 'flex items-center justify-between ph3 pv2 bb sb-b-muted'
  header.style.cssText = 'cursor:grab;user-select:none'
  header.addEventListener('mousedown', () => { header.style.cursor = 'grabbing' })
  header.addEventListener('mouseup', () => { header.style.cursor = 'grab' })

  const headerLeft = document.createElement('div')
  headerLeft.className = 'flex items-center'

  if (comment.author?.avatarUrl) {
    const avatar = document.createElement('img')
    avatar.className = 'br-100 ba sb-b-default flex-shrink-0 mr2'
    avatar.style.cssText = 'width:24px;height:24px'
    avatar.src = comment.author.avatarUrl
    avatar.alt = comment.author.login ?? ''
    headerLeft.appendChild(avatar)
  }

  const authorSpan = document.createElement('span')
  authorSpan.className = 'f7 fw6 sb-fg'
  authorSpan.textContent = comment.author?.login ?? 'unknown'
  headerLeft.appendChild(authorSpan)

  if (comment.createdAt) {
    const timeSpan = document.createElement('span')
    timeSpan.className = 'sb-fg-muted ml1'
    timeSpan.style.fontSize = '11px'
    timeSpan.textContent = timeAgo(comment.createdAt)
    headerLeft.appendChild(timeSpan)
  }

  header.appendChild(headerLeft)

  const headerActions = document.createElement('div')
  headerActions.className = 'sb-comment-window-header-actions flex items-center flex-shrink-0'

  const ACTION_BTN = 'flex items-center justify-center pa2 bg-transparent bn br2 pointer fw5 sans-serif flex-shrink-0 nowrap'
  const ACTION_BTN_STYLE = 'font-size:11px;line-height:1'
  const ACTION_BTN_DEFAULT = `${ACTION_BTN} sb-fg-muted`
  const ACTION_BTN_SUCCESS = `${ACTION_BTN} sb-fg-success`

  // Resolve button
  const resolveBtn = document.createElement('button')
  resolveBtn.className = comment.meta?.resolved ? ACTION_BTN_SUCCESS : ACTION_BTN_DEFAULT
  resolveBtn.style.cssText = ACTION_BTN_STYLE
  resolveBtn.setAttribute('aria-label', comment.meta?.resolved ? 'Resolved' : 'Resolve')
  resolveBtn.title = comment.meta?.resolved ? 'Resolved' : 'Resolve'
  resolveBtn.textContent = comment.meta?.resolved ? 'Resolved' : 'Resolve'
  if (comment.meta?.resolved) resolveBtn.dataset.resolved = 'true'
  resolveBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (comment.meta?.resolved) return
    resolveBtn.dataset.resolved = 'true'
    resolveBtn.className = ACTION_BTN_SUCCESS
    resolveBtn.textContent = 'Resolved'
    resolveBtn.title = 'Resolved'
    try {
      await resolveComment(comment.id, comment._rawBody ?? comment.body ?? '')
      comment.meta = { ...comment.meta, resolved: true }
      callbacks.onMove?.()
    } catch (err) {
      console.error('[storyboard] Failed to resolve comment:', err)
      resolveBtn.dataset.resolved = 'false'
      resolveBtn.className = ACTION_BTN_DEFAULT
      resolveBtn.textContent = 'Resolve'
      resolveBtn.title = 'Resolve'
    }
  })
  headerActions.appendChild(resolveBtn)

  // Share button
  const shareBtn = document.createElement('button')
  shareBtn.className = ACTION_BTN_DEFAULT
  shareBtn.style.cssText = ACTION_BTN_STYLE
  shareBtn.setAttribute('aria-label', 'Copy link')
  shareBtn.title = 'Copy link'
  shareBtn.textContent = 'Copy link'
  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    url.searchParams.set('comment', comment.id)
    navigator.clipboard.writeText(url.toString()).then(() => {
      shareBtn.dataset.copied = 'true'
      shareBtn.className = ACTION_BTN_SUCCESS
      shareBtn.textContent = 'Copied!'
      shareBtn.title = 'Copied!'
      setTimeout(() => {
        shareBtn.dataset.copied = 'false'
        shareBtn.className = ACTION_BTN_DEFAULT
        shareBtn.textContent = 'Copy link'
        shareBtn.title = 'Copy link'
      }, 2000)
    }).catch(() => {
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
  closeBtn.className = 'flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer flex-shrink-0'
  closeBtn.style.cssText = 'width:24px;height:24px;font-size:16px;line-height:1'
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
  body.className = 'flex-auto overflow-y-auto pa3'

  const textP = document.createElement('p')
  textP.className = 'lh-copy sb-fg ma0 mb2 word-wrap'
  textP.style.fontSize = '13px'
  textP.textContent = comment.text ?? ''
  body.appendChild(textP)

  // Reactions for the main comment
  body.appendChild(buildReactionBar(comment))

  // --- Replies ---
  const replies = comment.replies ?? []
  if (replies.length > 0) {
    const repliesSection = document.createElement('div')
    repliesSection.className = 'bt sb-b-muted pt2 mt1'

    const repliesLabel = document.createElement('div')
    repliesLabel.className = 'fw6 sb-fg-muted ttu tracked mb2'
    repliesLabel.style.fontSize = '11px'
    repliesLabel.textContent = `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}`
    repliesSection.appendChild(repliesLabel)

    for (const reply of replies) {
      const replyEl = document.createElement('div')
      replyEl.className = 'flex mb2'

      if (reply.author?.avatarUrl) {
        const avatar = document.createElement('img')
        avatar.className = 'br-100 ba sb-b-default flex-shrink-0 mr2'
        avatar.style.cssText = 'width:20px;height:20px'
        avatar.src = reply.author.avatarUrl
        avatar.alt = reply.author.login ?? ''
        replyEl.appendChild(avatar)
      }

      const content = document.createElement('div')
      content.className = 'flex-auto'
      content.style.minWidth = '0'

      const meta = document.createElement('div')
      meta.className = 'flex items-center mb1'

      const authorEl = document.createElement('span')
      authorEl.className = 'f7 fw6 sb-fg mr1'
      authorEl.textContent = reply.author?.login ?? 'unknown'
      meta.appendChild(authorEl)

      if (reply.createdAt) {
        const timeEl = document.createElement('span')
        timeEl.className = 'sb-fg-muted'
        timeEl.style.fontSize = '11px'
        timeEl.textContent = timeAgo(reply.createdAt)
        meta.appendChild(timeEl)
      }

      content.appendChild(meta)

      const replyText = document.createElement('p')
      replyText.className = 'lh-copy sb-fg ma0 word-wrap'
      replyText.style.fontSize = '13px'
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
    form.className = 'bt sb-b-muted ph3 pv3 flex flex-column'

    const textarea = document.createElement('textarea')
    textarea.className = 'sb-input w-100 ph2 pv1 br2 f7 sans-serif lh-copy db mb1'
    textarea.style.cssText = 'min-height:40px;max-height:100px;resize:vertical;box-sizing:border-box'
    textarea.placeholder = 'Reply…'
    form.appendChild(textarea)

    const actions = document.createElement('div')
    actions.className = 'flex justify-end mt2'

    const submitBtn = document.createElement('button')
    submitBtn.className = 'sb-btn-success ph2 pv1 br2 f7 fw5 sans-serif pointer bn'
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
    if (e.target.closest('.sb-comment-window-header-actions')) return
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY

    const containerRect = container.getBoundingClientRect()
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

    const containerRect = container.getBoundingClientRect()
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    const newLeft = winStartLeft + dx
    const newTop = winStartTop + dy
    const xPct = Math.round((newLeft / containerRect.width) * 1000) / 10
    const yPct = Math.round((newTop / containerRect.height) * 1000) / 10

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      comment.meta = { ...comment.meta, x: xPct, y: yPct }

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
        comment._rawBody = null
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
