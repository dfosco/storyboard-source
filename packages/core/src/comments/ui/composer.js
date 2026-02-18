/**
 * Comment composer — vanilla JS inline text input that appears at click position.
 *
 * Positioned absolutely within the comment overlay. Submits to the comments API.
 * Coordinates are %-based relative to the content container.
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
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
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
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-composer-username {
      font-size: 12px;
      color: #8b949e;
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
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 13px;
      font-family: inherit;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-composer-textarea:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-composer-textarea::placeholder {
      color: #484f58;
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
      color: #8b949e;
      border-color: #30363d;
    }
    .sb-composer-btn-cancel:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-composer-btn-submit {
      background: #238636;
      color: #fff;
    }
    .sb-composer-btn-submit:hover {
      background: #2ea043;
    }
    .sb-composer-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-composer-hint {
      padding: 0 12px 8px;
      font-size: 11px;
      color: #484f58;
    }
    .sb-composer-hint kbd {
      display: inline-block;
      padding: 0 4px;
      font-size: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      font-family: inherit;
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

  // Offset so it doesn't cover the click point
  composer.style.transform = 'translate(12px, -50%)'

  composer.innerHTML = `
    ${user ? `
      <div class="sb-composer-header">
        <img class="sb-composer-avatar" src="${user.avatarUrl}" alt="${user.login}" />
        <span class="sb-composer-username">${user.login}</span>
      </div>
    ` : ''}
    <div class="sb-composer-body">
      <textarea class="sb-composer-textarea" placeholder="Leave a comment…" autofocus></textarea>
    </div>
    <div class="sb-composer-footer">
      <button class="sb-composer-btn sb-composer-btn-cancel" data-action="cancel">Cancel</button>
      <button class="sb-composer-btn sb-composer-btn-submit" data-action="submit">Comment</button>
    </div>
  `

  container.appendChild(composer)

  const textarea = composer.querySelector('.sb-composer-textarea')
  const submitBtn = composer.querySelector('[data-action="submit"]')

  function destroy() {
    composer.remove()
  }

  function cancel() {
    destroy()
    callbacks.onCancel?.()
  }

  async function submit() {
    const text = textarea.value.trim()
    if (!text) {
      textarea.focus()
      return
    }

    submitBtn.disabled = true
    submitBtn.textContent = 'Posting…'

    try {
      const comment = await createComment(route, xPct, yPct, text)
      destroy()
      callbacks.onSubmit?.(comment)
    } catch (err) {
      submitBtn.disabled = false
      submitBtn.textContent = 'Comment'
      console.error('[storyboard] Failed to post comment:', err)
      // Show inline error
      let errEl = composer.querySelector('.sb-composer-error')
      if (!errEl) {
        errEl = document.createElement('div')
        errEl.className = 'sb-composer-error'
        errEl.style.cssText = 'padding: 4px 12px 8px; font-size: 12px; color: #f85149;'
        composer.querySelector('.sb-composer-footer').before(errEl)
      }
      errEl.textContent = err.message
    }
  }

  // Cancel button
  composer.querySelector('[data-action="cancel"]').addEventListener('click', cancel)

  // Submit button
  submitBtn.addEventListener('click', submit)

  // Keyboard: Cmd/Ctrl+Enter to submit, Escape to cancel
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    }
  })

  // Stop click from propagating (prevents placing another composer)
  composer.addEventListener('click', (e) => e.stopPropagation())

  // Focus textarea
  requestAnimationFrame(() => textarea.focus())

  return { el: composer, destroy }
}
