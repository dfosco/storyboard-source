import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'
import { ThemeProvider, BaseStyles } from '@primer/react'
import './reset.css'
import './fonts.css'
import './globals.css'
import './tailwind.css'

import ThemeSync from './components/ThemeSync/ThemeSync.jsx'
import { installHashPreserver } from '@dfosco/storyboard/hash-preserver'
import { mountStoryboardCore } from '@dfosco/storyboard/core'
import '@dfosco/storyboard/comments/ui/comment-layout.css'
import storyboardConfig from '../storyboard.config.json'

// Redirect after canvas creation — Vite full-reloads when a new
// .canvas.jsonl is created. The form sets ?redirect=/canvas/name
// which survives the reload. We navigate once the route is registered.
const redirectParam = new URLSearchParams(window.location.search).get('redirect')
if (redirectParam) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  window.location.replace(base + redirectParam)
}

const router = createBrowserRouter(routes, {
    basename: import.meta.env.BASE_URL,
})

installHashPreserver(router, import.meta.env.BASE_URL)
mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

root.render(
    <StrictMode>
        <ThemeProvider colorMode="auto">
            <BaseStyles>
                <ThemeSync />
                <RouterProvider router={router} />
            </BaseStyles>
        </ThemeProvider>
    </StrictMode>
)
