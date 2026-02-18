/**
 * Auth modal — vanilla JS modal for entering a GitHub PAT.
 *
 * Styled to match the devtools dark theme. Uses the native <dialog> element.
 */

import { setToken, validateToken, clearToken, getCachedUser } from '../auth.js'

const MODAL_ID = 'sb-auth-modal'
const STYLE_ID = 'sb-auth-modal-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .sb-auth-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .sb-auth-modal {
      width: 420px;
      max-width: calc(100vw - 32px);
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      color: #c9d1d9;
      overflow: hidden;
    }

    .sb-auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #21262d;
    }

    .sb-auth-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-auth-close {
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
    .sb-auth-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-auth-body {
      padding: 20px;
    }

    .sb-auth-description {
      margin: 0 0 16px;
      font-size: 13px;
      color: #8b949e;
      line-height: 1.5;
    }

    .sb-auth-description a {
      color: #58a6ff;
      text-decoration: none;
    }
    .sb-auth-description a:hover {
      text-decoration: underline;
    }

    .sb-auth-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #c9d1d9;
    }

    .sb-auth-input {
      width: 100%;
      padding: 8px 12px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 14px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      outline: none;
      box-sizing: border-box;
    }
    .sb-auth-input:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-auth-input::placeholder {
      color: #484f58;
    }

    .sb-auth-scopes {
      margin: 12px 0 0;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 6px;
      font-size: 12px;
      color: #8b949e;
      line-height: 1.6;
    }
    .sb-auth-scopes code {
      display: inline-block;
      padding: 1px 5px;
      background: rgba(110, 118, 129, 0.15);
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-size: 11px;
      color: #c9d1d9;
    }

    .sb-auth-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid #21262d;
    }

    .sb-auth-btn {
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 100ms ease;
    }

    .sb-auth-btn-cancel {
      background: #21262d;
      border-color: #30363d;
      color: #c9d1d9;
    }
    .sb-auth-btn-cancel:hover {
      background: #30363d;
    }

    .sb-auth-btn-submit {
      background: #238636;
      color: #fff;
    }
    .sb-auth-btn-submit:hover {
      background: #2ea043;
    }
    .sb-auth-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-auth-error {
      margin: 10px 0 0;
      padding: 8px 12px;
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid rgba(248, 81, 73, 0.3);
      border-radius: 6px;
      font-size: 13px;
      color: #f85149;
    }

    .sb-auth-success {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
    }

    .sb-auth-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #30363d;
    }

    .sb-auth-user-info {
      font-size: 14px;
      color: #f0f6fc;
    }
    .sb-auth-user-info span {
      display: block;
      font-size: 12px;
      color: #3fb950;
      margin-top: 2px;
    }
  `
  document.head.appendChild(style)
}

/**
 * Open the auth modal. Returns a promise that resolves with the user info
 * on successful sign-in, or null if cancelled.
 * @returns {Promise<{ login: string, avatarUrl: string }|null>}
 */
export function openAuthModal() {
  injectStyles()

  return new Promise((resolve) => {
    // Remove any existing modal
    const existing = document.getElementById(MODAL_ID)
    if (existing) existing.remove()

    const backdrop = document.createElement('div')
    backdrop.id = MODAL_ID
    backdrop.className = 'sb-auth-backdrop'

    const modal = document.createElement('div')
    modal.className = 'sb-auth-modal'

    modal.innerHTML = `
      <div class="sb-auth-header">
        <h2>Sign in for comments</h2>
        <button class="sb-auth-close" data-action="close" aria-label="Close">×</button>
      </div>
      <div class="sb-auth-body">
        <p class="sb-auth-description">
          Enter a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">GitHub Personal Access Token</a>
          to leave comments on this prototype. Your token is stored locally in your browser.
        </p>
        <label class="sb-auth-label" for="sb-auth-token-input">Personal Access Token</label>
        <input class="sb-auth-input" id="sb-auth-token-input" type="password" placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" spellcheck="false" />
        <div class="sb-auth-scopes">Required scopes: <code>repo</code> <code>read:user</code></div>
        <div data-slot="feedback"></div>
      </div>
      <div class="sb-auth-footer">
        <button class="sb-auth-btn sb-auth-btn-cancel" data-action="close">Cancel</button>
        <button class="sb-auth-btn sb-auth-btn-submit" data-action="submit">Sign in</button>
      </div>
    `

    backdrop.appendChild(modal)
    document.body.appendChild(backdrop)

    const input = modal.querySelector('#sb-auth-token-input')
    const submitBtn = modal.querySelector('[data-action="submit"]')
    const feedbackSlot = modal.querySelector('[data-slot="feedback"]')

    function close(result) {
      backdrop.remove()
      resolve(result)
    }

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(null)
    })

    // Close buttons
    modal.querySelectorAll('[data-action="close"]').forEach((btn) => {
      btn.addEventListener('click', () => close(null))
    })

    // Escape key
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        window.removeEventListener('keydown', onKeyDown, true)
        close(null)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)

    // Submit
    async function submit() {
      const token = input.value.trim()
      if (!token) {
        input.focus()
        return
      }

      submitBtn.disabled = true
      submitBtn.textContent = 'Validating…'
      feedbackSlot.innerHTML = ''

      try {
        const user = await validateToken(token)
        setToken(token)

        feedbackSlot.innerHTML = `
          <div class="sb-auth-success">
            <img class="sb-auth-avatar" src="${user.avatarUrl}" alt="${user.login}" />
            <div class="sb-auth-user-info">
              ${user.login}
              <span>✓ Signed in</span>
            </div>
          </div>
        `
        submitBtn.textContent = 'Done'
        submitBtn.disabled = false
        submitBtn.onclick = () => {
          window.removeEventListener('keydown', onKeyDown, true)
          close(user)
        }
      } catch (err) {
        feedbackSlot.innerHTML = `<div class="sb-auth-error">${err.message}</div>`
        submitBtn.disabled = false
        submitBtn.textContent = 'Sign in'
      }
    }

    submitBtn.addEventListener('click', submit)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit()
    })

    // Auto-focus
    requestAnimationFrame(() => input.focus())
  })
}

/**
 * Open a sign-out confirmation. Clears token immediately.
 */
export function signOut() {
  const user = getCachedUser()
  clearToken()
  console.log(`[storyboard] Signed out${user ? ` (was ${user.login})` : ''}`)
}
