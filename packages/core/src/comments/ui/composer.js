/**
 * Comment composer — Alpine.js inline text input that appears at click position.
 *
 * Positioned absolutely within the comment overlay. Submits to the comments API.
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { createComment } from '../api.js'
import { getCachedUser } from '../auth.js'

/**
 * Show the comment composer at a given position within a container.
 * @param {HTMLElement} container - The positioned container element
 * @param {number} xPct - X coordinate as percentage of container width
 * @param {number} yPct - Y coordinate as percentage of container height
 * @param {string} route - Current route path
 * @param {object} [callbacks] - Optional callbacks
 * @param {() => void} [callbacks.onCancel] - Called when composer is dismissed
 * @param {(comment: object) => void} [callbacks.onSubmit] - Called after successful submit
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function showComposer(container, xPct, yPct, route, callbacks = {}) {
  const user = getCachedUser()
  const composer = document.createElement('div')
  composer.className = 'sb-composer absolute flex flex-column sb-bg ba sb-b-default br3 sb-shadow sans-serif overflow-hidden'
  composer.style.zIndex = '100001'
  composer.style.width = '280px'
  composer.style.left = `${xPct}%`
  composer.style.top = `${yPct}%`
  composer.style.transform = 'translate(12px, -50%)'

  composer.innerHTML = `
    <div x-data="sbComposer" @keydown.escape.prevent.stop="cancel()">
      ${user ? `
        <div class="flex items-center ph3 pt2">
          <img class="br-100 ba sb-b-default flex-shrink-0 mr2" style="width:24px;height:24px" src="${user.avatarUrl}" alt="${user.login}" />
          <span class="f7 sb-fg-muted fw5">${user.login}</span>
        </div>
      ` : ''}
      <div class="ph3 pt2 pb3">
        <textarea class="sb-input w-100 ph2 pv2 br2 f6 sans-serif lh-copy db" style="min-height:60px;max-height:160px;resize:vertical;box-sizing:border-box;font-size:13px"
                  placeholder="Leave a comment…"
                  x-model="text"
                  @keydown.meta.enter="submit()"
                  @keydown.ctrl.enter="submit()"></textarea>
      </div>
      <template x-if="error">
        <div class="ph3 pb2 f7 sb-fg-danger" x-text="error"></div>
      </template>
      <div class="flex items-center justify-end ph3 pb2">
        <button class="sb-btn-cancel ph3 pv1 br2 f7 fw5 pointer mr1" style="font-size:12px" @click="cancel()">Cancel</button>
        <button class="sb-btn-success ph3 pv1 br2 f7 fw5 pointer bn" style="font-size:12px" :disabled="submitting"
                @click="submit()" x-text="submitting ? 'Posting…' : 'Comment'">Comment</button>
      </div>
    </div>
  `

  container.appendChild(composer)

  // Stop click from propagating (prevents placing another composer)
  composer.addEventListener('click', (e) => e.stopPropagation())

  function destroy() {
    window.removeEventListener('keydown', onEscape, true)
    composer.remove()
  }

  // Global Escape handler for when focus is outside the composer
  function onEscape(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      destroy()
      callbacks.onCancel?.()
    }
  }
  window.addEventListener('keydown', onEscape, true)

  // Register Alpine component
  if (!window.Alpine._sbComposerRegistered) {
    window.Alpine.data('sbComposer', () => ({
      text: '',
      submitting: false,
      error: null,

      async submit() {
        const val = this.text.trim()
        if (!val) return

        this.submitting = true
        this.error = null

        try {
          const comment = await createComment(route, xPct, yPct, val)
          destroy()
          callbacks.onSubmit?.(comment)
        } catch (err) {
          this.error = err.message
          this.submitting = false
          console.error('[storyboard] Failed to post comment:', err)
        }
      },

      cancel() {
        destroy()
        callbacks.onCancel?.()
      },
    }))
    window.Alpine._sbComposerRegistered = true
  }

  // Initialize Alpine on the new DOM
  window.Alpine.initTree(composer)

  // Focus textarea
  requestAnimationFrame(() => {
    const textarea = composer.querySelector('textarea')
    if (textarea) textarea.focus()
  })

  return { el: composer, destroy }
}
