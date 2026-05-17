---
"@dfosco/storyboard": patch
---

Viewfinder and PrototypeEmbed polish.

- Viewfinder: hide the flows dropdown on the workspace when a prototype only has a single flow
- PrototypeEmbed: subtract the header height from the iframe so `position: fixed` elements inside the prototype aren't clipped or pushed out of view
