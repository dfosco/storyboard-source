/**
 * Comment window — Alpine.js popup that shows a comment thread with replies and reactions.
 *
 * Opens when clicking a comment pin. Shows comment body, author, replies,
 * reply input, reactions, and supports drag-to-move.
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { replyToComment, addReaction, removeReaction, resolveComment, unresolveComment, editComment, editReply, deleteComment } from '../api.js'
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

function esc(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
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
  if (activeWindow) {
    activeWindow.destroy()
    activeWindow = null
  }

  const user = getCachedUser()
  const replies = comment.replies ?? []
  const canEdit = user && comment.author?.login === user.login
  const canReply = user && discussion

  const win = document.createElement('div')
  win.className = 'sb-comment-window absolute flex flex-column sb-bg ba sb-b-default br3 sb-shadow sans-serif overflow-hidden'
  win.style.cssText = `z-index:100001;width:360px;max-height:480px;left:${comment.meta?.x ?? 0}%;top:${comment.meta?.y ?? 0}%;transform:translate(12px,-50%)`
  win.setAttribute('x-data', 'sbCommentWindow')
  win.setAttribute('@click.stop', '')

  win.innerHTML = `
      <!-- Header (draggable) -->
      <div class="flex items-center justify-between ph3 pv3 bb sb-b-muted sb-draggable"
           @mousedown="startDrag($event)">
        <div class="flex items-center">
          ${comment.author?.avatarUrl ? `<img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar" src="${esc(comment.author.avatarUrl)}" alt="${esc(comment.author.login)}" />` : ''}
          <span class="f7 fw6 sb-fg">${esc(comment.author?.login ?? 'unknown')}</span>
          ${comment.createdAt ? `<span class="sb-fg-muted ml1 sb-f-xs">${esc(timeAgo(comment.createdAt))}</span>` : ''}
        </div>
        <div class="sb-comment-window-header-actions flex items-center flex-shrink-0" @mousedown.stop>
          <!-- Resolve -->
          <button class="flex items-center justify-center bg-transparent bn br2 pointer fw5 sans-serif flex-shrink-0 nowrap sb-action-btn"
                  :class="resolved ? 'sb-fg-success' : 'sb-fg-muted'"
                  :title="resolved ? 'Unresolve' : 'Resolve'"
                  :disabled="resolving"
                  @click="toggleResolve()"
                  x-text="resolving ? (resolved ? 'Unresolving…' : 'Resolving…') : (resolved ? 'Resolved ✓' : 'Resolve')"></button>
          <!-- Copy link -->
          <button class="flex items-center justify-center bg-transparent bn br2 pointer fw5 sans-serif flex-shrink-0 nowrap sb-action-btn"
                  :class="copied ? 'sb-fg-success' : 'sb-fg-muted'"
                  title="Copy link"
                  @click="copyLink()"
                  x-text="copied ? 'Copied!' : 'Copy link'"></button>
          <!-- Close -->
          <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer flex-shrink-0 sb-close-btn-sm"
                  aria-label="Close"
                  @click="close()">×</button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-auto overflow-y-auto ph3 pt3">
        <!-- Comment text / edit -->
        <template x-if="!editing">
          <div>
            <p class="lh-copy sb-fg ma0 mb2 word-wrap sb-f-sm">${esc(comment.text)}</p>
          </div>
        </template>
        <template x-if="editing">
          <div>
            <textarea class="sb-input sb-textarea w-100 ph2 pv1 br2 f7 sans-serif lh-copy db mb2"
                      x-model="editText" x-ref="editArea" x-init="$nextTick(() => $refs.editArea?.focus())"></textarea>
            <div class="flex justify-end mb2">
              <button class="sb-btn-cancel ph2 pv1 br2 f7 fw5 sans-serif pointer mr1" @click="editing = false">Cancel</button>
              <button class="sb-btn-success ph3 pv2 br2 f7 fw5 sans-serif pointer bn"
                      :disabled="saving" @click="saveEdit()"
                      x-text="saving ? 'Saving…' : 'Save'">Save</button>
            </div>
          </div>
        </template>

        <!-- Reactions -->
        <div class="flex items-center flex-wrap mb2" x-ref="reactionBar">
          <template x-for="(group, gi) in reactions" :key="group.content">
            <template x-if="(group.users?.totalCount ?? 0) > 0">
              <button class="f7 flex items-center ph2 br-pill pointer sans-serif mr1 mb1 pv1 hover:b--blue"
                      :class="group.viewerHasReacted ? 'sb-pill sb-pill-active' : 'sb-pill'"
                      @click.stop="toggleReaction(group.content, gi)">
                <span class="mr1 f7" x-text="emojiFor(group.content)"></span>
                <span class="f7" x-text="group.users?.totalCount ?? 0"></span>
              </button>
            </template>
          </template>
          <div class="relative mr1 mb1 dib">
            <button class="f7 flex items-center ph2 pv1 br-pill pointer sans-serif sb-pill"
                    @click.stop="pickerTarget = pickerTarget === 'comment' ? null : 'comment'"><span>😀 +</span></button>
            <template x-if="pickerTarget === 'comment'">
              <div class="sb-reaction-picker absolute left-0 flex pa1 sb-bg ba sb-b-default br3 sb-shadow" @click.outside="pickerTarget = null">
                <template x-for="[key, emoji] in emojiEntries" :key="key">
                  <button class="flex items-center justify-center br2 bn f6 pointer mr1"
                          :class="isReacted(key) ? 'sb-reaction-btn-active' : 'bg-transparent sb-reaction-btn'"
                          @click.stop="toggleReaction(key); pickerTarget = null"
                          x-text="emoji"></button>
                </template>
              </div>
            </template>
          </div>
          <template x-if="!editing">
            <div class="dib mb1 ml-auto">
            ${canEdit ? `<button class="sb-fg-muted bg-transparent bn pointer f7 underline-hover" @click="editing = true; editText = commentText">Edit</button>` : ''}
            </div>
          </template>
        </div>

        <!-- Replies -->
        ${replies.length > 0 ? `
        <div class="bt sb-b-muted pt2 mt1">
          <div class="fw6 sb-fg-muted ttu tracked mb2 sb-f-xs">${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}</div>
          ${replies.map((reply, ri) => `
          <div class="flex mb2" data-reply-index="${ri}">
            ${reply.author?.avatarUrl ? `<img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar-sm" src="${esc(reply.author.avatarUrl)}" alt="${esc(reply.author.login)}" />` : ''}
            <div class="flex-auto sb-min-w-0">
              <div class="flex items-center mb1">
                <span class="f7 fw6 sb-fg mr1">${esc(reply.author?.login ?? 'unknown')}</span>
                ${reply.createdAt ? `<span class="sb-fg-muted sb-f-xs">${esc(timeAgo(reply.createdAt))}</span>` : ''}
                ${user && reply.author?.login === user.login ? `
                <div class="flex gap-2 ml-auto flex-shrink-0">
                  <template x-if="editingReply !== ${ri}">
                    <button class="sb-fg-muted bg-transparent bn pointer underline-hover sb-f-xs"
                            @click="editingReply = ${ri}; editReplyText = replyTexts[${ri}]">Edit</button>
                  </template>
                  <template x-if="editingReply !== ${ri}">
                    <button class="sb-fg-danger bg-transparent bn pointer underline-hover sb-f-xs"
                            @click="deleteReplyAt(${ri})">Delete</button>
                  </template>
                </div>
                ` : ''}
              </div>
              <template x-if="editingReply !== ${ri}">
                <p class="lh-copy sb-fg ma0 word-wrap sb-f-sm">${esc(reply.text ?? reply.body)}</p>
              </template>
              <template x-if="editingReply === ${ri}">
                <div>
                  <textarea class="sb-input sb-textarea-sm w-100 ph2 pv1 br2 sans-serif lh-copy db mb1 f7"
                            x-model="editReplyText"></textarea>
                  <div class="flex justify-end mb1">
                    <button class="sb-btn-cancel ph2 pv1 br2 f7 fw5 sans-serif pointer mr1" @click="editingReply = -1">Cancel</button>
                    <button class="sb-btn-success ph3 pv2 br2 f7 fw5 sans-serif pointer bn"
                            :disabled="savingReply" @click="saveReply(${ri})"
                            x-text="savingReply ? 'Saving…' : 'Save'">Save</button>
                  </div>
                </div>
              </template>
              <!-- Reply reactions -->
              <div class="flex items-center flex-wrap mt1">
                <template x-for="(rg, rgi) in replyReactions[${ri}]" :key="rg.content">
                  <template x-if="(rg.users?.totalCount ?? 0) > 0">
                    <button class="dib flex f7 items-center ph2 br-pill pointer sans-serif mr1 mb1 "
                            :class="rg.viewerHasReacted ? 'sb-pill sb-pill-active' : 'sb-pill'"
                            @click.stop="toggleReplyReaction(${ri}, rg.content, rgi)">
                      <span class="mr1" x-text="emojiFor(rg.content)"></span>
                      <span x-text="rg.users?.totalCount ?? 0"></span>
                    </button>
                  </template>
                </template>
                <div class="relative mr1 mb1">
                  <button class="f7 flex items-center ph2 pv1 br-pill pointer sans-serif sb-pill"
                          @click.stop="pickerTarget = pickerTarget === 'reply-${ri}' ? null : 'reply-${ri}'">😀 +</button>
                  <template x-if="pickerTarget === 'reply-${ri}'">
                    <div class="sb-reaction-picker absolute left-0 flex pa1 sb-bg ba sb-b-default br3 sb-shadow" @click.outside="pickerTarget = null">
                      <template x-for="[key, emoji] in emojiEntries" :key="key">
                        <button class="flex items-center justify-center br2 bn f6 pointer mr1"
                                :class="isReplyReacted(${ri}, key) ? 'sb-reaction-btn-active' : 'bg-transparent sb-reaction-btn'"
                                @click.stop="toggleReplyReaction(${ri}, key); pickerTarget = null"
                                x-text="emoji"></button>
                      </template>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <!-- Reply form -->
      ${canReply ? `
      <div class="bt sb-b-muted ph3 pv3 flex flex-column">
        <textarea class="sb-input sb-textarea-sm w-100 ph2 pv1 br2 f7 sans-serif lh-copy db mb1"
                  placeholder="Reply…"
                  x-model="replyText"
                  @keydown.meta.enter="submitReply()"
                  @keydown.ctrl.enter="submitReply()"
                  @keydown.escape.prevent.stop></textarea>
        <div class="flex justify-end mt2">
          <button class="sb-btn-success ph3 pv2 br2 f7 fw5 sans-serif pointer bn"
                  :disabled="!replyText.trim() || submittingReply"
                  @click="submitReply()"
                  x-text="submittingReply ? 'Posting…' : 'Reply'">Reply</button>
        </div>
      </div>
      ` : ''}
  `

  // Set URL param for deep linking
  const url = new URL(window.location.href)
  url.searchParams.set('comment', comment.id)
  window.history.replaceState(null, '', url.toString())

  container.appendChild(win)

  function destroy() {
    win.remove()
    if (activeWindow?.el === win) activeWindow = null
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('comment')
    window.history.replaceState(null, '', currentUrl.toString())
    callbacks.onClose?.()
  }

  // Register Alpine component (once)
  if (!window.Alpine._sbCommentWindowRegistered) {
    window.Alpine.data('sbCommentWindow', () => ({
      // State
      resolved: false,
      resolving: false,
      copied: false,
      editing: false,
      editText: '',
      saving: false,
      commentText: '',
      replyText: '',
      submittingReply: false,
      editingReply: -1,
      editReplyText: '',
      savingReply: false,
      pickerTarget: null, // 'comment' | 'reply-N' | null
      reactions: [],
      replyReactions: [],
      replyTexts: [],
      emojiEntries: Object.entries(REACTION_EMOJI),

      // Closured refs (set per-instance via _sbInit)
      _comment: null,
      _discussion: null,
      _container: null,
      _callbacks: null,
      _destroy: null,
      _win: null,

      init() {
        // Read instance data stashed on the root element
        const init = this.$root._sbInit
        if (!init) return
        this._comment = init.comment
        this._discussion = init.discussion
        this._container = init.container
        this._callbacks = init.callbacks
        this._destroy = init.destroy
        this._win = init.win

        this.resolved = !!this._comment.meta?.resolved
        this.commentText = this._comment.text ?? ''
        this.reactions = [...(this._comment.reactionGroups ?? [])]
        this.replyTexts = (this._comment.replies ?? []).map(r => r.text ?? r.body ?? '')
        this.replyReactions = (this._comment.replies ?? []).map(r => [...(r.reactionGroups ?? [])])
      },

      emojiFor(content) { return REACTION_EMOJI[content] ?? content },

      isReacted(content) {
        return this.reactions.some(r => r.content === content && r.viewerHasReacted)
      },

      isReplyReacted(ri, content) {
        return (this.replyReactions[ri] ?? []).some(r => r.content === content && r.viewerHasReacted)
      },

      async toggleResolve() {
        this.resolving = true
        try {
          if (this.resolved) {
            await unresolveComment(this._comment.id, this._comment._rawBody ?? this._comment.body ?? '')
            this._comment.meta = { ...this._comment.meta }
            delete this._comment.meta.resolved
            this.resolved = false
            this.resolving = false
            this._callbacks.onMove?.()
          } else {
            await resolveComment(this._comment.id, this._comment._rawBody ?? this._comment.body ?? '')
            this._comment.meta = { ...this._comment.meta, resolved: true }
            this._callbacks.onMove?.()
            this._destroy()
          }
        } catch (err) {
          console.error('[storyboard] Failed to toggle resolve:', err)
          this.resolving = false
        }
      },

      copyLink() {
        const linkUrl = new URL(window.location.href)
        linkUrl.searchParams.set('comment', this._comment.id)
        navigator.clipboard.writeText(linkUrl.toString()).then(() => {
          this.copied = true
          setTimeout(() => { this.copied = false }, 2000)
        }).catch(() => {
          const input = document.createElement('input')
          input.value = linkUrl.toString()
          document.body.appendChild(input)
          input.select()
          document.execCommand('copy')
          input.remove()
        })
      },

      close() { this._destroy() },

      async saveEdit() {
        const newText = this.editText.trim()
        if (!newText) return
        this.saving = true
        try {
          await editComment(this._comment.id, this._comment._rawBody ?? this._comment.body ?? '', newText)
          this._comment.text = newText
          this._comment._rawBody = null
          this.commentText = newText
          // Update the visible text in the DOM
          const p = this.$root.querySelector('.word-wrap')
          if (p) p.textContent = newText
          this.editing = false
          this.saving = false
        } catch (err) {
          console.error('[storyboard] Failed to edit comment:', err)
          this.saving = false
        }
      },

      async toggleReaction(content, gi) {
        const group = gi !== undefined ? this.reactions[gi] : this.reactions.find(r => r.content === content)
        const wasReacted = group?.viewerHasReacted ?? false

        if (wasReacted && group) {
          group.users = { totalCount: Math.max(0, (group.users?.totalCount ?? 1) - 1) }
          group.viewerHasReacted = false
          if (group.users.totalCount === 0) {
            this.reactions = this.reactions.filter(r => r.content !== content)
          }
        } else if (group) {
          group.users = { totalCount: (group.users?.totalCount ?? 0) + 1 }
          group.viewerHasReacted = true
        } else {
          this.reactions.push({ content, users: { totalCount: 1 }, viewerHasReacted: true })
        }
        // Sync back to comment object
        this._comment.reactionGroups = this.reactions

        try {
          if (wasReacted) { await removeReaction(this._comment.id, content) }
          else { await addReaction(this._comment.id, content) }
        } catch (err) { console.error('[storyboard] Reaction toggle failed:', err) }
      },

      async toggleReplyReaction(ri, content, rgi) {
        const reply = (this._comment.replies ?? [])[ri]
        if (!reply) return
        const groups = this.replyReactions[ri] ?? []
        const group = rgi !== undefined ? groups[rgi] : groups.find(r => r.content === content)
        const wasReacted = group?.viewerHasReacted ?? false

        if (wasReacted && group) {
          group.users = { totalCount: Math.max(0, (group.users?.totalCount ?? 1) - 1) }
          group.viewerHasReacted = false
          if (group.users.totalCount === 0) {
            this.replyReactions[ri] = groups.filter(r => r.content !== content)
          }
        } else if (group) {
          group.users = { totalCount: (group.users?.totalCount ?? 0) + 1 }
          group.viewerHasReacted = true
        } else {
          groups.push({ content, users: { totalCount: 1 }, viewerHasReacted: true })
          this.replyReactions[ri] = groups
        }
        reply.reactionGroups = this.replyReactions[ri]

        try {
          if (wasReacted) { await removeReaction(reply.id, content) }
          else { await addReaction(reply.id, content) }
        } catch (err) { console.error('[storyboard] Reaction toggle failed:', err) }
      },

      async submitReply() {
        const text = this.replyText.trim()
        if (!text) return
        this.submittingReply = true
        try {
          await replyToComment(this._discussion.id, this._comment.id, text)
          this.replyText = ''
          this.submittingReply = false
          this._callbacks.onMove?.()
        } catch (err) {
          console.error('[storyboard] Failed to post reply:', err)
          this.submittingReply = false
        }
      },

      async saveReply(ri) {
        const newText = this.editReplyText.trim()
        if (!newText) return
        const reply = (this._comment.replies ?? [])[ri]
        if (!reply) return
        this.savingReply = true
        try {
          await editReply(reply.id, newText)
          reply.text = newText
          reply.body = newText
          this.replyTexts[ri] = newText
          this.editingReply = -1
          this.savingReply = false
        } catch (err) {
          console.error('[storyboard] Failed to edit reply:', err)
          this.savingReply = false
        }
      },

      async deleteReplyAt(ri) {
        const reply = (this._comment.replies ?? [])[ri]
        if (!reply || !confirm('Delete this reply?')) return
        try {
          await deleteComment(reply.id)
          this._callbacks.onMove?.()
        } catch (err) {
          console.error('[storyboard] Failed to delete reply:', err)
        }
      },

      // Drag-to-reposition window (temporary, view-only — does not move the pin)
      startDrag(e) {
        if (e.target.closest('.sb-comment-window-header-actions')) return
        const winEl = this._win
        const startX = e.clientX
        const startY = e.clientY
        const rect = winEl.getBoundingClientRect()
        const startWinX = rect.left
        const startWinY = rect.top

        e.target.style.cursor = 'grabbing'

        const onMove = (ev) => {
          const dx = ev.clientX - startX
          const dy = ev.clientY - startY
          winEl.style.position = 'fixed'
          winEl.style.left = `${startWinX + dx}px`
          winEl.style.top = `${startWinY + dy}px`
          winEl.style.transform = 'none'
        }

        const onUp = () => {
          e.target.style.cursor = 'grab'
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        e.preventDefault()
      },
    }))
    window.Alpine._sbCommentWindowRegistered = true
  }

  // Stash instance data on the win element so init() can read it
  win._sbInit = { comment, discussion, container, callbacks, destroy, win }

  // Initialize Alpine on the new DOM
  window.Alpine.initTree(win)

  // Adjust position to keep window within viewport
  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 8

    let tx = 12
    let ty = -(rect.height / 2)

    if (rect.left + rect.width > vw - pad) {
      tx = -(rect.width + 12)
    }

    const anchorY = rect.top + rect.height / 2
    const finalBottom = anchorY + ty + rect.height
    if (finalBottom > vh - pad) {
      ty -= (finalBottom - vh + pad)
    }
    if (anchorY + ty < pad) {
      ty = pad - anchorY
    }

    win.style.transform = `translate(${tx}px, ${ty}px)`
  })

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
