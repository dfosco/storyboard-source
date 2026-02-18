/**
 * Auth modal — Alpine.js modal for entering a GitHub PAT.
 *
 * Themed with Primer CSS custom properties for light/dark mode support.
 */

import { setToken, validateToken, clearToken, getCachedUser } from '../auth.js'
import { applyTheme } from './themeBridge.js'

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
      background: var(--overlay-bgColor, rgba(0, 0, 0, 0.5));
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .sb-auth-modal {
      width: 420px;
      max-width: calc(100vw - 32px);
      background: var(--overlay-bgColor, var(--bgColor-default));
      border: 1px solid var(--borderColor-default);
      border-radius: 12px;
      box-shadow: var(--shadow-overlay, 0 16px 48px rgba(0, 0, 0, 0.3));
      color: var(--fgColor-default);
      overflow: hidden;
    }

    .sb-auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--borderColor-muted);
    }

    .sb-auth-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--fgColor-default);
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
      color: var(--fgColor-muted);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .sb-auth-close:hover {
      background: var(--bgColor-muted);
      color: var(--fgColor-default);
    }

    .sb-auth-body {
      padding: 20px;
    }

    .sb-auth-description {
      margin: 0 0 16px;
      font-size: 13px;
      color: var(--fgColor-muted);
      line-height: 1.5;
    }

    .sb-auth-description a {
      color: var(--fgColor-accent);
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
      color: var(--fgColor-default);
    }

    .sb-auth-input {
      width: 100%;
      padding: 8px 12px;
      background: var(--bgColor-inset, var(--bgColor-default));
      border: 1px solid var(--borderColor-default);
      border-radius: 6px;
      color: var(--fgColor-default);
      font-size: 14px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      outline: none;
      box-sizing: border-box;
    }
    .sb-auth-input:focus {
      border-color: var(--fgColor-accent);
      box-shadow: 0 0 0 3px var(--borderColor-accent-muted, rgba(88, 166, 255, 0.15));
    }
    .sb-auth-input::placeholder {
      color: var(--fgColor-muted);
    }

    .sb-auth-scopes {
      margin: 12px 0 0;
      padding: 10px 12px;
      background: var(--bgColor-inset, var(--bgColor-default));
      border: 1px solid var(--borderColor-muted);
      border-radius: 6px;
      font-size: 12px;
      color: var(--fgColor-muted);
      line-height: 1.6;
    }
    .sb-auth-scopes code {
      display: inline-block;
      padding: 1px 5px;
      background: var(--bgColor-muted);
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-size: 11px;
      color: var(--fgColor-default);
    }

    .sb-auth-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid var(--borderColor-muted);
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
      background: var(--bgColor-muted);
      border-color: var(--borderColor-default);
      color: var(--fgColor-default);
    }
    .sb-auth-btn-cancel:hover {
      background: var(--bgColor-neutral-muted, var(--bgColor-muted));
    }

    .sb-auth-btn-submit {
      background: var(--bgColor-success-emphasis);
      color: var(--fgColor-onEmphasis);
    }
    .sb-auth-btn-submit:hover {
      filter: brightness(1.1);
    }
    .sb-auth-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-auth-error {
      margin: 10px 0 0;
      padding: 8px 12px;
      background: var(--bgColor-danger-muted, rgba(248, 81, 73, 0.1));
      border: 1px solid var(--borderColor-danger-muted, rgba(248, 81, 73, 0.3));
      border-radius: 6px;
      font-size: 13px;
      color: var(--fgColor-danger);
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
      border: 2px solid var(--borderColor-default);
    }

    .sb-auth-user-info {
      font-size: 14px;
      color: var(--fgColor-default);
    }
    .sb-auth-user-info span {
      display: block;
      font-size: 12px;
      color: var(--fgColor-success);
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
    const existing = document.getElementById(MODAL_ID)
    if (existing) existing.remove()

    const backdrop = document.createElement('div')
    backdrop.id = MODAL_ID
    backdrop.className = 'sb-auth-backdrop'

    backdrop.innerHTML = `
      <div class="sb-auth-modal" x-data="sbAuthModal">
        <div class="sb-auth-header">
          <h2>Sign in for comments</h2>
          <button class="sb-auth-close" @click="close()" aria-label="Close">×</button>
        </div>
        <div class="sb-auth-body">
          <p class="sb-auth-description">
            Enter a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">GitHub Personal Access Token</a>
            to leave comments on this prototype. Your token is stored locally in your browser.
          </p>
          <label class="sb-auth-label" for="sb-auth-token-input">Personal Access Token</label>
          <input class="sb-auth-input" id="sb-auth-token-input" type="password"
                 placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" spellcheck="false"
                 x-model="token" @keydown.enter="submit()" />
          <div class="sb-auth-scopes">Required scopes: <code>repo</code> <code>read:user</code></div>
          <template x-if="error">
            <div class="sb-auth-error" x-text="error"></div>
          </template>
          <template x-if="user">
            <div class="sb-auth-success">
              <img class="sb-auth-avatar" :src="user.avatarUrl" :alt="user.login" />
              <div class="sb-auth-user-info">
                <span x-text="user.login"></span>
                <span>✓ Signed in</span>
              </div>
            </div>
          </template>
        </div>
        <div class="sb-auth-footer">
          <button class="sb-auth-btn sb-auth-btn-cancel" @click="close()">Cancel</button>
          <button class="sb-auth-btn sb-auth-btn-submit" :disabled="submitting"
                  @click="user ? done() : submit()" x-text="user ? 'Done' : (submitting ? 'Validating…' : 'Sign in')">
            Sign in
          </button>
        </div>
      </div>
    `

    document.body.appendChild(backdrop)

    const cleanupTheme = applyTheme(backdrop)

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanupTheme()
        backdrop.remove()
        resolve(null)
      }
    })

    // Escape key
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        window.removeEventListener('keydown', onKeyDown, true)
        cleanupTheme()
        backdrop.remove()
        resolve(null)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)

    // Register Alpine component
    if (!window.Alpine._sbAuthRegistered) {
      window.Alpine.data('sbAuthModal', () => ({
        token: '',
        submitting: false,
        error: null,
        user: null,

        async submit() {
          const val = this.token.trim()
          if (!val) return

          this.submitting = true
          this.error = null

          try {
            const user = await validateToken(val)
            setToken(val)
            this.user = user
          } catch (err) {
            this.error = err.message
          } finally {
            this.submitting = false
          }
        },

        done() {
          window.removeEventListener('keydown', onKeyDown, true)
          cleanupTheme()
          const user = this.user
          backdrop.remove()
          resolve(user)
        },

        close() {
          window.removeEventListener('keydown', onKeyDown, true)
          cleanupTheme()
          backdrop.remove()
          resolve(null)
        },
      }))
      window.Alpine._sbAuthRegistered = true
    }

    // Initialize Alpine on the new DOM
    window.Alpine.initTree(backdrop)

    // Auto-focus the input
    requestAnimationFrame(() => {
      const input = backdrop.querySelector('#sb-auth-token-input')
      if (input) input.focus()
    })
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
