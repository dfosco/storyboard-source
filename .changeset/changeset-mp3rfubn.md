---
"@dfosco/storyboard": patch
---

**feat(artifact-form): basic/advanced field tiers with a collapsible toggle.** The Command Palette / `ArtifactForm` create dialog now shows only essential fields by default (name, title, description, URL, template/recipe for prototypes) and tucks the rest behind a "+ Advanced fields" toggle. Each field in `artifactSchemas.js` is annotated `tier: 'basic' | 'advanced'`; fields without `tier` default to basic for back-compat. Validation still runs against all fields regardless of visibility.
