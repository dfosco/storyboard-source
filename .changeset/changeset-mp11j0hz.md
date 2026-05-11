---
"@dfosco/storyboard": patch
---

Test suite cleanup — full suite green (100/100 files, 1395/1395 tests)

- Guard `import.meta.hot.off` calls (Vite 5+) so older test mocks don't crash unmount cleanup
- Update multi-delete test to match current per-widget removeWidget impl
- Drop three test files that were broken since 0.5.0's package unification (mocked nonexistent exports / imported functions that never landed)
