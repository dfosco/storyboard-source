import '@testing-library/jest-dom/vitest'

// Reset URL hash and localStorage between tests
beforeEach(() => {
  window.location.hash = ''
  localStorage.clear()
})
