---
"@dfosco/storyboard": patch
---

**feat(prototype): wire template/recipe picker into Viewfinder + Command Palette create forms.** Both the simple Viewfinder modal and the schema-driven Command Palette dialog now fetch `/_storyboard/workshop/prototypes` and render an optgrouped Template/Recipe select alongside the existing fields. The artifact endpoint (`POST /_storyboard/artifact/`) now honors `partial` for prototypes — previously it was silently ignored, so only the Workshop sidebar form could actually create a templated prototype. The Workshop form's UI is unchanged.
