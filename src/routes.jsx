/**
 * Custom generouted routes entry for src/prototypes/ directory.
 *
 * generouted hardcodes /src/pages/ in both its import.meta.glob patterns and
 * its route-path regex. This module mirrors the generouted runtime but uses
 * /src/prototypes/ so file-based routing works with the renamed directory.
 */
import { Fragment, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import PrototypeErrorBoundary, { ImportErrorFallback } from '@dfosco/storyboard/error-boundary'
import {
  generatePreservedRoutes,
  generateRegularRoutes,
  generateModalRoutes,
  patterns,
} from '@generouted/react-router/core'

// Patch the route regex to strip src/prototypes/ and .folder/ segments instead of src/pages/
patterns.route = [/^.*\/src\/prototypes\/|^\/prototypes\/|[^/]*\.folder\/|\.(jsx|tsx|mdx)$/g, '']

const PRESERVED = import.meta.glob('/src/prototypes/(_app|404).{jsx,tsx}', { eager: true })
const MODALS = import.meta.glob('/src/prototypes/**/[+]*.{jsx,tsx}', { eager: true })

// Lazy-load prototype routes — only the matched route's module is fetched.
// This prevents story/canvas URLs from paying for every prototype page's
// imports (Primer, Reshaped, user components, etc.) on first load.
const ROUTES = import.meta.glob(
  ['/src/prototypes/**/[\\w[-]*.{jsx,tsx,mdx}', '!/src/prototypes/**/(_!(layout)*(/*)?|_app|404)*'],
)

const preservedRoutes = generatePreservedRoutes(PRESERVED)
const modalRoutes = generateModalRoutes(MODALS)

const regularRoutes = generateRegularRoutes(ROUTES, (importFn, key) => {
  const index = /index\.(jsx|tsx|mdx)$/.test(key) && !key.includes('prototypes/index') ? { index: true } : {}
  return {
    ...index,
    lazy: async () => {
      try {
        const module = await importFn()
        const Default = module?.default || Fragment
        const Page = () =>
          module?.Pending ? (
            <Suspense fallback={<module.Pending />}>
              <Default />
            </Suspense>
          ) : (
            <Default />
          )
        return {
          Component: Page,
          ErrorBoundary: module?.Catch || PrototypeErrorBoundary,
          loader: module?.Loader,
          action: module?.Action,
        }
      } catch (err) {
        // Import itself failed (syntax error, broken dependency, etc.)
        return {
          Component: () => <ImportErrorFallback error={err} route={key} />,
        }
      }
    },
  }
})

const _app = preservedRoutes?.['_app']
const _404 = preservedRoutes?.['404']
const Default = _app?.default || Outlet

// eslint-disable-next-line react-refresh/only-export-components
const Modals_ = () => {
  const Modal = modalRoutes[useLocation().state?.modal] || Fragment
  return <Modal />
}

// eslint-disable-next-line react-refresh/only-export-components
const Layout = () => (
  <>
    <Default /> <Modals_ />
  </>
)

// eslint-disable-next-line react-refresh/only-export-components
const App = () =>
  _app?.Pending ? (
    <Suspense fallback={<_app.Pending />}>
      <Layout />
    </Suspense>
  ) : (
    <Layout />
  )

const app = { Component: _app?.default ? App : Layout, ErrorBoundary: _app?.Catch, loader: _app?.Loader }
const fallback = { path: '*', Component: _404?.default || Fragment }

export const routes = [{ ...app, children: [...regularRoutes, fallback] }]
