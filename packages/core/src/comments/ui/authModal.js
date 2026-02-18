/**
 * Auth modal — Alpine.js modal for entering a GitHub PAT.
 *
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { setToken, validateToken, clearToken, getCachedUser } from '../auth.js'

const MODAL_ID = 'sb-auth-modal'

/**
 * Open the auth modal. Returns a promise that resolves with the user info
 * on successful sign-in, or null if cancelled.
 * @returns {Promise<{ login: string, avatarUrl: string }|null>}
 */
export function openAuthModal() {
  return new Promise((resolve) => {
    const existing = document.getElementById(MODAL_ID)
    if (existing) existing.remove()

    const backdrop = document.createElement('div')
    backdrop.id = MODAL_ID
    backdrop.className = 'sb-auth-backdrop fixed top-0 right-0 bottom-0 left-0 flex items-center justify-center sans-serif'
    backdrop.style.cssText = 'z-index:100000;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);'

    backdrop.innerHTML = `
      <div class="sb-bg ba sb-b-default br3 sb-shadow sb-fg overflow-hidden" style="width:420px;max-width:calc(100vw - 32px)" x-data="sbAuthModal">
        <div class="flex items-center justify-between ph4 pv3 bb sb-b-muted">
          <h2 class="ma0 f5 fw6 sb-fg">Sign in for comments</h2>
          <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer" style="width:28px;height:28px;font-size:18px;line-height:1" @click="close()" aria-label="Close">×</button>
        </div>
        <div class="pa4">
          <p class="ma0 mb3 lh-copy sb-fg-muted" style="font-size:13px">
            Enter a <a class="sb-fg-accent no-underline" href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">GitHub Personal Access Token</a>
            to leave comments on this prototype. Your token is stored locally in your browser.
          </p>
          <label class="db mb1 fw5 sb-fg" style="font-size:13px" for="sb-auth-token-input">Personal Access Token</label>
          <input class="sb-input w-100 ph3 pv2 br2 f6 code db" style="box-sizing:border-box" id="sb-auth-token-input" type="password"
                 placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" spellcheck="false"
                 x-model="token" @keydown.enter="submit()" />
          <div class="mt2 ph3 pv2 sb-bg-inset ba sb-b-muted br2 f7 sb-fg-muted lh-copy">Required scopes: <code class="dib ph1 sb-bg-muted br1 code sb-fg" style="font-size:11px;padding-top:1px;padding-bottom:1px">repo</code> <code class="dib ph1 sb-bg-muted br1 code sb-fg" style="font-size:11px;padding-top:1px;padding-bottom:1px">read:user</code></div>
          <template x-if="error">
            <div class="mt2 ph3 pv2 br2 sb-fg-danger" style="font-size:13px;background:color-mix(in srgb, var(--sb-fg-danger) 10%, transparent);border:1px solid color-mix(in srgb, var(--sb-fg-danger) 30%, transparent)" x-text="error"></div>
          </template>
          <template x-if="user">
            <div class="flex items-center pv1">
              <img class="br-100 ba sb-b-default mr3" style="width:40px;height:40px;border-width:2px" :src="user.avatarUrl" :alt="user.login" />
              <div class="f6 sb-fg">
                <span x-text="user.login"></span>
                <span class="db f7 sb-fg-success mt1">✓ Signed in</span>
              </div>
            </div>
          </template>
        </div>
        <div class="flex items-center justify-end ph4 pv3 bt sb-b-muted">
          <button class="sb-btn-cancel ph3 pv1 br2 fw5 sans-serif pointer mr2" style="font-size:13px" @click="close()">Cancel</button>
          <button class="sb-btn-success ph3 pv1 br2 fw5 sans-serif pointer bn" style="font-size:13px" :disabled="submitting"
                  @click="user ? done() : submit()" x-text="user ? 'Done' : (submitting ? 'Validating…' : 'Sign in')">
            Sign in
          </button>
        </div>
      </div>
    `

    document.body.appendChild(backdrop)

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
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
          const user = this.user
          backdrop.remove()
          resolve(user)
        },

        close() {
          window.removeEventListener('keydown', onKeyDown, true)
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
