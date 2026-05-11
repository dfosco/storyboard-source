---
"@dfosco/storyboard": patch
---

fix(dev): allow explicit `devDomain: "storyboard"`

The runtime's FORBIDDEN_DEFAULT_DOMAIN guard was rejecting projects that legitimately picked "storyboard" as their devDomain (e.g. the canonical storyboard repo). The CLI now passes `allowDefaultDomain=true` when the field is explicitly set in `storyboard.config.json`. The guard still catches missing fields with a helpful suggestion.
