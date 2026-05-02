# Plan: Connector Anchor Optimization

## Problem

Connectors between canvas widgets currently default to `right` → `left` anchors regardless of spatial layout. When widgets are arranged vertically, diagonally, or in complex layouts, this produces connectors that overlap widgets and cross each other. Agents need a systematic way to choose optimal anchor points.

## Specification

### Relative Orientation

Every pair of connected widgets (A → B) has a `relativeOrientation` — a value derived from where widget A sits relative to widget B on a 3×3 spatial grid.

Widget B occupies the center cell. Widget A can be in any of the 8 surrounding cells:

```
 ┌──────────────┬──────────────┬──────────────┐
 │   top-left   │  top-center  │  top-right   │
 ├──────────────┼──────────────┼──────────────┤
 │ center-left  │      B       │ center-right │
 ├──────────────┼──────────────┼──────────────┤
 │ bottom-left  │bottom-center │ bottom-right │
 └──────────────┴──────────────┴──────────────┘
```

### Grid Sector Boundaries

The sector boundaries come from **B's `bounds`**:

- **Left boundary:** `B.bounds.startX`
- **Right boundary:** `B.bounds.endX`
- **Top boundary:** `B.bounds.startY`
- **Bottom boundary:** `B.bounds.endY`

**A's test point** is its **center**: `(A.bounds.startX + A.bounds.width / 2, A.bounds.startY + A.bounds.height / 2)`. Using the center avoids edge cases where large widgets straddle sector boundaries based on their top-left corner alone.

To determine A's sector (where `Ax` and `Ay` are A's center coordinates):

| Condition | Horizontal sector |
|-----------|------------------|
| `Ax < B.startX` | left |
| `Ax >= B.startX && Ax <= B.endX` | center |
| `Ax > B.endX` | right |

| Condition | Vertical sector |
|-----------|----------------|
| `Ay < B.startY` | top |
| `Ay >= B.startY && Ay <= B.endY` | center |
| `Ay > B.endY` | bottom |

Combine them: `{vertical}-{horizontal}` → e.g. `top-left`, `center-right`, `bottom-center`.

### Orientation → Anchor Mapping

Each grid position for A produces a `relativeOrientation` which maps to an ideal anchor pair. The goal is **inverse anchor matchups** — the connector exits the side of A facing B, and enters the side of B facing A:

```
 ┌──────────────────┬──────────────────┬──────────────────┐
 │    top-left      │   top-center     │    top-right     │
 │                  │                  │                  │
 │  orientation:    │  orientation:    │  orientation:    │
 │  top-to-right    │  top-to-bottom   │  top-to-left     │
 │                  │                  │                  │
 │  A anchor: right │  A anchor: bottom│  A anchor: left  │
 │  B anchor: top   │  B anchor: top   │  B anchor: top   │
 ├──────────────────┼──────────────────┼──────────────────┤
 │   center-left    │        B         │   center-right   │
 │                  │                  │                  │
 │  orientation:    │                  │  orientation:    │
 │  left-to-right   │                  │  right-to-left   │
 │                  │                  │                  │
 │  A anchor: right │                  │  A anchor: left  │
 │  B anchor: left  │                  │  B anchor: right │
 ├──────────────────┼──────────────────┼──────────────────┤
 │   bottom-left    │  bottom-center   │   bottom-right   │
 │                  │                  │                  │
 │  orientation:    │  orientation:    │  orientation:    │
 │  bottom-to-right │  bottom-to-top   │  bottom-to-left  │
 │                  │                  │                  │
 │  A anchor: right │  A anchor: top   │  A anchor: left  │
 │  B anchor: bottom│  B anchor: bottom│  B anchor: bottom│
 └──────────────────┴──────────────────┴──────────────────┘
```

**Summary table:**

| A's grid position | relativeOrientation | A anchor (start) | B anchor (end) |
|-------------------|---------------------|------------------|----------------|
| top-left          | top-to-right        | right            | top            |
| top-center        | top-to-bottom       | bottom           | top            |
| top-right         | top-to-left         | left             | top            |
| center-left       | left-to-right       | right            | left           |
| center-right      | right-to-left       | left             | right          |
| bottom-left       | bottom-to-right     | right            | bottom         |
| bottom-center     | bottom-to-top       | top              | bottom         |
| bottom-right      | bottom-to-left      | left             | bottom         |

### Key Directive

**Connector positioning is calculated AFTER all widgets have been positioned.** Widgets themselves should never be repositioned to accommodate better connector layout. Only anchors are adjusted.

### When to Recalculate

Anchors must be recalculated in two scenarios:

1. **After creating new connectors** — compute orientation for each new A→B pair and set anchors accordingly
2. **After moving any widget that has connectors** — re-read all connectors attached to the moved widget, recompute orientations, and PATCH any whose ideal anchors have changed

### Updating Anchors (PATCH API)

Anchors can be updated in-place without deleting the connector:

```
PATCH /_storyboard/canvas/connector
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Canvas name |
| `connectorId` | string | ✅ | Connector to update |
| `startAnchor` | string | ❌ | New anchor on start widget (`top`/`right`/`bottom`/`left`) |
| `endAnchor` | string | ❌ | New anchor on end widget (`top`/`right`/`bottom`/`left`) |
| `meta` | object | ❌ | Metadata updates (e.g. messagingMode) |

This preserves the connector's identity — same ID, same `meta`, same messaging state. Only the anchor points change.

## Implementation Todos

1. **Document PATCH `/connector`** — Add "Updating a connector" subsection to Connectors section of SKILL.md with the `startAnchor`/`endAnchor` fields

2. **Add "Anchor Optimization" section** — After the existing "Direction" subsection in SKILL.md:
   - Define `relativeOrientation` concept
   - Document the 3×3 grid model with B's `bounds` as sector boundaries and A's top-left corner as the test point
   - Full orientation → anchor mapping table
   - ASCII grid diagram
   - Key directive: never reposition widgets for connector layout

3. **Add "When to recalculate" subsection** — Two triggers (new connections, widget moves), procedure to read connectors, recompute orientations, PATCH changed anchors

4. **Update existing pattern examples** — Replace static `right` → `left` defaults in 1→n, n→1, n→n patterns with orientation-based anchor selection
