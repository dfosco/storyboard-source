# Object References Design Discussion

## Context
Exploring alternatives to the `$import` mechanism for referencing reusable data objects in scenes.

---

## Original Proposal (User)

Add a `data/objects` folder containing reusable files/folders. Objects can be imported using `$object` syntax:

```json
{
  "user": { "$user" },
  "$global": ["$global/navigation", "$global/footer"]
}
```

This would replace the awkward `$import` mechanism.

---

## Critique

### Issues with the proposal:

**1. Redundant syntax in `$global`**
```json
"$global": ["$global/navigation", "$global/footer"]
```
`$global` appears twice—once as the key, once in the path. Confusing.

**2. Ambiguous inline syntax**
```json
"user": { "$user" }
```
Is `$user` a key? A value? Does it replace the whole object or merge? What about:
```json
"user": "$user"  // vs
"user": { "$user" }  // vs  
"user": { "profile": "$user" }
```

**3. Two mechanisms for the same thing**
`$global` (root-level merge) and `$object` (inline replacement) are different operations with similar syntax—cognitive overhead.

---

## Counter-proposal: Single `$ref` Syntax

Use a single, explicit reference mechanism:

```json
{
  "navigation": { "$ref": "objects/navigation" },
  "user": { "$ref": "objects/user" },
  "settings": {
    "theme": "dark",
    "owner": { "$ref": "objects/user" }
  }
}
```

### Benefits:
- **One mechanism**: `$ref` always means "replace this object with that file's contents"
- **Works anywhere**: Root level or nested
- **Explicit**: No ambiguity about what happens
- **Familiar pattern**: JSON Schema uses `$ref`

### For root-level merging (current `$import`):

Option A - Use `$spread`:
```json
{
  "$spread": ["objects/navigation", "objects/footer"],
  "user": { "$ref": "objects/user" }
}
```

Option B - Drop root-level merging entirely. Reference objects where you need them.

---

## Decision
TBD - prototype the `$ref` approach to evaluate ergonomics.

---

## File Structure (Proposed)

```
/src/data/
  ├── objects/           # reusable data objects
  │   ├── user.json
  │   ├── navigation.json
  │   └── projects/
  │       ├── primer-react.json
  │       └── storyboard.json
  └── scenes/
      ├── default.json
      └── empty-state.json
```
