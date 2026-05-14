---
"@dfosco/storyboard": patch
---

Pre-bundle @primer/react and react-compiler-runtime in Vite optimizeDeps so the CJS named export `c` resolves correctly in the browser (fixes "does not provide an export named 'c'" runtime error in consumer apps).
