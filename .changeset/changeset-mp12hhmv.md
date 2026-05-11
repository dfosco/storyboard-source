---
"@dfosco/storyboard": patch
---

fix(runtime): set Origin header on Caddy admin API requests

Caddy v2.11+ rejects Node fetch() requests with HTTP 403 unless Origin matches an allowed origin. The runtime daemon's CaddyAdminClient was sending no Origin, so every admin call failed silently — `caddyReachable` was always false, no proxy routes were ever pushed, and consumers got a white-screen-of-death because Caddy answered with empty 200 responses (no upstream configured for the host).
