import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from '@generouted/react-router'
import { ThemeProvider, BaseStyles } from '@primer/react'
import './reset.css'
import './globals.css'

import ColorModeSwitcher from './components/ColorModeSwitcher'
import { installHashPreserver } from '@storyboard/react/hash-preserver'
import { installHideParamListener, installHistorySync, mountDevTools } from '@storyboard/core'

const router = createBrowserRouter(routes, {
    basename: import.meta.env.BASE_URL,
})

installHashPreserver(router, import.meta.env.BASE_URL)
installHideParamListener()
installHistorySync()
if (import.meta.env.DEV) mountDevTools()

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

root.render(
    <StrictMode>
        <ThemeProvider colorMode="auto">
            <BaseStyles>
                <ColorModeSwitcher />
                <RouterProvider router={router} />
            </BaseStyles>
        </ThemeProvider>
    </StrictMode>
)
