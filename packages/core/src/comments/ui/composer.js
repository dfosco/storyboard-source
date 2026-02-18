/**
 * Comment composer — Alpine.js inline text input that appears at click position.
 *
 * Positioned absolutely within the comment overlay. Submits to the comments API.
 * Themed with Primer CSS custom properties for light/dark mode support.
 */

import { createComment } from '../api.js'
import { getCachedUser } from '../auth.js'

const STYLE_ID = 'sb-composer-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .sb-composer {
      position: absolute;
      z-index: 100001;
      display: flex;
      flex-direction: column;
      width: 280px;
      background: var(--overlay-bgColor, var(--bgColor-default));
      border: 1px solid var(--borderColor-default);
      border-radius: 10px;
      box-shadow: var(--shadow-overlay, 0 8px 24px rgba(0, 0, 0, 0.3));
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .sb-composer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 0;
    }

    .sb-composer-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid var(--borderColor-default);
      flex-shrink: 0;
    }

    .sb-composer-username {
      font-size: 12px;
      color: var(--fgColor-muted);
      font-weight: 500;
    }

    .sb-composer-body {
      padding: 8px 12px 12px;
    }

    .sb-composer-textarea {
      width: 100%;
      min-height: 60px;
      max-height: 160px;
      padding: 8px 10px;
      background: var(--bgColor-inset, var(--bgColor-default));
      border: 1px solid var(--borderColor-default);
      border-radius: 6px;
      color: var(--fgColor-default);
      font-size: 13px;
      font-family: inherit;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-composer-textarea:focus {
      border-color: var(--fgColor-accent);
      box-shadow: 0 0 0 3px var(--borderColor-accent-muted, rgba(88, 166, 255, 0.15));
    }
    .sb-composer-textarea::placeholder {
      color: var(--fgColor-muted);
    }

    .sb-composer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding: 0 12px 10px;
    }

    .sb-composer-btn {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .sb-composer-btn-cancel {
      background: none;
      color: var(--fgColor-muted);
      border-color: var(--borderColor-default);
    }
    .sb-composer-btn-cancel:hover {
      background: var(--bgColor-muted);
      color: var(--fgColor-default);
    }

    .sb-composer-btn-submit {
      background: var(--bgColor-success-emphasis);
      color: var(--fgColor-onEmphasis);
    }
    .sb-composer-btn-submit:hover {
      filter: brightness(1.1);
    }
    .sb-composer-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-composer-error {
      padding: 4px 12px 8px;
      font-size: 12px;
      color: var(--fgColor-danger);
    }
  `
  document.head.appendChild(style)
}

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
  injectStyles()

  const user = getCachedUser()
  const composer = document.createElement('div')
  composer.className = 'sb-composer'
  composer.style.left = `${xPct}%`
  composer.style.top = `${yPct}%`
  composer.style.transform = 'translate(12px, -50%)'

  composer.innerHTML = `
    <div x-data="sbComposer" @keydown.escape.prevent.stop="cancel()">
      ${user ? `
        <div class="sb-composer-header">
          <img class="sb-composer-avatar" src="${user.avatarUrl}" alt="${user.login}" />
          <span class="sb-composer-username">${user.login}</span>
        </div>
      ` : ''}
      <div class="sb-composer-body">
        <textarea class="sb-composer-textarea" placeholder="Leave a comment…"
                  x-model="text"
                  @keydown.meta.enter="submit()"
                  @keydown.ctrl.enter="submit()"></textarea>
      </div>
      <template x-if="error">
        <div class="sb-composer-error" x-text="error"></div>
      </template>
      <div class="sb-composer-footer">
        <button class="sb-composer-btn sb-composer-btn-cancel" @click="cancel()">Cancel</button>
        <button class="sb-composer-btn sb-composer-btn-submit" :disabled="submitting"
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
    const textarea = composer.querySelector('.sb-composer-textarea')
    if (textarea) textarea.focus()
  })

  return { el: composer, destroy }
}
