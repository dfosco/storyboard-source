/**
 * Storyboard SceneDebug — a vanilla JS debug panel that displays scene data.
 *
 * Framework-agnostic: creates a DOM element, no React/Vue/etc. needed.
 *
 * Usage:
 *   import { mountSceneDebug } from '@storyboard/core'
 *   mountSceneDebug(document.getElementById('debug'))
 *   // or
 *   mountSceneDebug() // appends to document.body
 */
import { loadScene } from './loader.js'

const STYLES = `
.sb-scene-debug {
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.sb-scene-debug-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #c9d1d9;
}
.sb-scene-debug-code {
  padding: 16px;
  background-color: #161b22;
  border-radius: 8px;
  overflow: auto;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  line-height: 1.5;
  max-height: 70vh;
  color: #c9d1d9;
  white-space: pre-wrap;
  word-break: break-word;
}
.sb-scene-debug-error {
  padding: 16px;
  background-color: rgba(248, 81, 73, 0.1);
  border-radius: 8px;
}
.sb-scene-debug-error-title {
  color: #f85149;
  font-weight: 600;
}
.sb-scene-debug-error-message {
  color: #f85149;
  margin-top: 4px;
}
`

let stylesInjected = false

/**
 * Mount a scene debug panel into the DOM.
 *
 * @param {HTMLElement} [container=document.body] - Where to mount
 * @param {string} [sceneName] - Scene name override (defaults to ?scene= param or "default")
 * @returns {HTMLElement} The created debug element
 */
export function mountSceneDebug(container, sceneName) {
  const target = container || document.body
  const activeSceneName = sceneName
    || new URLSearchParams(window.location.search).get('scene')
    || 'default'

  // Inject styles once
  if (!stylesInjected) {
    const styleEl = document.createElement('style')
    styleEl.textContent = STYLES
    document.head.appendChild(styleEl)
    stylesInjected = true
  }

  const el = document.createElement('div')
  el.className = 'sb-scene-debug'

  let data = null
  let error = null
  try {
    data = loadScene(activeSceneName)
  } catch (err) {
    error = err.message
  }

  if (error) {
    el.innerHTML = `
      <div class="sb-scene-debug-error">
        <div class="sb-scene-debug-error-title">Error loading scene</div>
        <p class="sb-scene-debug-error-message">${error}</p>
      </div>`
  } else {
    const title = document.createElement('h2')
    title.className = 'sb-scene-debug-title'
    title.textContent = `Scene: ${activeSceneName}`

    const pre = document.createElement('pre')
    pre.className = 'sb-scene-debug-code'
    pre.textContent = JSON.stringify(data, null, 2)

    el.appendChild(title)
    el.appendChild(pre)
  }

  target.appendChild(el)
  return el
}
