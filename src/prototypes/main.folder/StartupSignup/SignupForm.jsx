import { useEffect, useRef } from 'react'
import { useOverride } from '@dfosco/storyboard'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.3C41.4 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.9-.39.99 0 1.98.13 2.9.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.77 1.06.77 2.14v3.17c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  )
}

export default function SignupForm() {
  const [fullName, setFullName] = useOverride('signup.fullName', '')
  const [email, setEmail] = useOverride('signup.email', '')
  const [company, setCompany] = useOverride('signup.company', '')
  const [password, setPassword] = useOverride('signup.password', '')
  const [agreedToTerms, setAgreedToTerms] = useOverride('signup.agreedToTerms', false)
  const [status, setStatus] = useOverride('signup.status', 'idle')
  const [oauthProvider, setOauthProvider] = useOverride('signup.oauthProvider', '')

  const oauthMocks = {
    google: {
      fullName: 'Ada Lovelace',
      email: 'ada.lovelace@gmail.com',
      company: 'Analytical Engines',
    },
    github: {
      fullName: 'Ada Lovelace',
      email: 'ada@users.noreply.github.com',
      company: 'analytical-engines',
    },
  }

  const handleOAuth = (provider) => {
    const mock = oauthMocks[provider]
    if (!mock) return
    setOauthProvider(provider)
    setStatus('oauth')
    setFullName(mock.fullName)
    setEmail(mock.email)
    setCompany(mock.company)
    setPassword('oauth-no-password')
    setAgreedToTerms(true)
    setTimeout(() => setStatus('success'), 900)
  }

  const isOauth = status === 'oauth'

  const safeName = fullName ?? ''
  const safeEmail = email ?? ''
  const safeCompany = company ?? ''
  const safePassword = password ?? ''
  const safeAgreed = Boolean(agreedToTerms)
  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'

  const canSubmit =
    safeName.trim() &&
    safeEmail.trim() &&
    safeCompany.trim() &&
    safePassword.trim() &&
    safeAgreed &&
    !isSubmitting

  const userSubmittedRef = useRef(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    userSubmittedRef.current = true
    setStatus('submitting')
  }

  useEffect(() => {
    if (status !== 'submitting' || !userSubmittedRef.current) return
    const t = setTimeout(() => setStatus('success'), 2500)
    return () => clearTimeout(t)
  }, [status, setStatus])

  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        {isSuccess ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-semibold text-gray-900">You're in!</h2>
            <p className="mt-1 text-sm text-gray-600">
              Welcome aboard, {safeName || 'friend'}.{' '}
              {oauthProvider
                ? `Signed in with ${oauthProvider === 'google' ? 'Google' : 'GitHub'}.`
                : 'Check your inbox to verify your email.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Start closing the feedback loop in minutes. No credit card required.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isOauth || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                {isOauth && oauthProvider === 'google' ? 'Connecting…' : 'Google'}
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={isOauth || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GitHubIcon />
                {isOauth && oauthProvider === 'github' ? 'Connecting…' : 'GitHub'}
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs uppercase tracking-wider text-gray-400">
                  or with email
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={safeName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={safeEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  autoComplete="organization"
                  value={safeCompany}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Analytical Engines"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={safePassword}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={safeAgreed}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
