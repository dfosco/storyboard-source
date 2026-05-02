import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
// Direct imports bypass the barrel re-export in @dfosco/storyboard/index.js.
// The barrel eagerly re-exports CanvasPage (3K lines), CommandPalette (1.3K lines),
// and Viewfinder (1.5K lines) — all resolved by Vite dev even though _app only
// needs StoryboardProvider and useFeatureFlag.
import StoryboardProvider from '@dfosco/storyboard/context'
import { useFeatureFlag } from '@dfosco/storyboard/hooks/useFeatureFlag'
import appStyles from './_app.module.css'
import '@dfosco/storyboard/canvas/style.css'

function PageLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bgColor-default, #0d1117)',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="var(--fgColor-muted, #484f58)" strokeWidth="2.5" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--fgColor-default, #e6edf3)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <StoryboardProvider>
      <FeatureFlagBanner />
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </StoryboardProvider>
  )
}

function FeatureFlagBanner() {
  const showBanner = useFeatureFlag('show-banner')
  if (!showBanner) return null
  return (
    <div className={appStyles.banner}>
      🚩 Feature flag <strong>show-banner</strong> is enabled — toggle it off in the Command Menu on the bottom right.
    </div>
  )
}
