import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia — stub it for modules that call it at
// import time (e.g. themeStore.ts).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })
}

// jsdom doesn't support adoptedStyleSheets — stub it for @oddbird/popover-polyfill
if (!document.adoptedStyleSheets) {
  document.adoptedStyleSheets = []
}
if (typeof ShadowRoot !== 'undefined' && !ShadowRoot.prototype.adoptedStyleSheets) {
  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    get() { return this._adoptedStyleSheets || [] },
    set(v) { this._adoptedStyleSheets = v },
  })
}

// Reset URL hash and localStorage between tests
beforeEach(() => {
  window.location.hash = ''
  localStorage.clear()
})
