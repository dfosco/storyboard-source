/**
 * RadialMenu — SVG donut sectors + HTML labels.
 *
 * Surfaces all the behaviors agreed by the hub:
 *   - Donut geometry (innerRadius > 0 kills apex hit-overlap)
 *   - One <path> per sector with pointer-events: fill (free hit-test)
 *   - Roving tabindex + arrow-key navigation
 *   - aria-haspopup / role="menu" / role="menuitem"
 *   - transform+opacity-only animation, prefers-reduced-motion aware
 *   - linearFallback for keyboard / screen-reader / no-pointer users
 *   - tone="danger" + disabled per item
 *   - Nested ring via <RadialMenuGroup>
 *
 * The component is intentionally self-contained — no portal, no floating-ui
 * dependency — so the stories can show all states inline.
 */

import { Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import styles from './RadialMenu.module.css'

const TAU = Math.PI * 2

function polar(cx, cy, r, a) {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function donutSectorPath(cx, cy, rOuter, rInner, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [ox0, oy0] = polar(cx, cy, rOuter, a0)
  const [ox1, oy1] = polar(cx, cy, rOuter, a1)
  const [ix1, iy1] = polar(cx, cy, rInner, a1)
  const [ix0, iy0] = polar(cx, cy, rInner, a0)
  return [
    `M ${ox0} ${oy0}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${ox1} ${oy1}`,
    `L ${ix1} ${iy1}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${ix0} ${iy0}`,
    'Z',
  ].join(' ')
}

function collectItems(children) {
  const items = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === RadialMenuItem || child.type === RadialMenuGroup) {
      items.push(child)
    }
  })
  return items
}

export function RadialMenuItem() {
  // Marker component — rendered by the parent ring, never on its own.
  return null
}

export function RadialMenuGroup() {
  // Marker component — opens a nested ring when activated.
  return null
}

export default function RadialMenu({
  open = true,
  onOpenChange,
  radius = 120,
  innerRadius = 44,
  startAngle = -Math.PI / 2,
  sweep = TAU,
  gestureThreshold = 0,
  linearFallback = false,
  onSelect,
  children,
  ariaLabel = 'Radial menu',
}) {
  const items = useMemo(() => collectItems(children), [children])
  const N = items.length
  const step = N > 0 ? sweep / N : 0
  const cx = radius + 8
  const cy = radius + 8
  const svgSize = (radius + 8) * 2

  const [focusIdx, setFocusIdx] = useState(0)
  const [openGroupIdx, setOpenGroupIdx] = useState(null)
  const rootRef = useRef(null)
  const id = useId()

  // Reset focus + open submenu when the wheel itself opens.
  useEffect(() => {
    if (open) {
      setFocusIdx(0)
      setOpenGroupIdx(null)
    }
  }, [open])

  const activate = useCallback(
    (i) => {
      const child = items[i]
      if (!child) return
      const { disabled, value } = child.props
      if (disabled) return
      if (child.type === RadialMenuGroup) {
        setOpenGroupIdx(i)
        return
      }
      onSelect?.(value, child.props)
      onOpenChange?.(false)
    },
    [items, onSelect, onOpenChange]
  )

  const onKeyDown = useCallback(
    (e) => {
      if (N === 0) return
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          setFocusIdx((i) => (i + 1) % N)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          setFocusIdx((i) => (i - 1 + N) % N)
          break
        case 'Home':
          e.preventDefault()
          setFocusIdx(0)
          break
        case 'End':
          e.preventDefault()
          setFocusIdx(N - 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          activate(focusIdx)
          break
        case 'Escape':
          e.preventDefault()
          if (openGroupIdx !== null) setOpenGroupIdx(null)
          else onOpenChange?.(false)
          break
        case 'Backspace':
          if (openGroupIdx !== null) {
            e.preventDefault()
            setOpenGroupIdx(null)
          }
          break
        default:
      }
    },
    [N, activate, focusIdx, onOpenChange, openGroupIdx]
  )

  // Marking-menu gesture mode (pointerdown center → flick past threshold).
  const gestureStart = useRef(null)
  const onPointerDown = (e) => {
    if (!gestureThreshold) return
    gestureStart.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e) => {
    if (!gestureThreshold || !gestureStart.current) return
    const dx = e.clientX - gestureStart.current.x
    const dy = e.clientY - gestureStart.current.y
    gestureStart.current = null
    const dist = Math.hypot(dx, dy)
    if (dist < gestureThreshold) return
    // angle 0 at +x axis; normalize to sweep
    let a = Math.atan2(dy, dx)
    let rel = a - startAngle
    while (rel < 0) rel += TAU
    while (rel >= TAU) rel -= TAU
    const i = Math.min(N - 1, Math.floor(rel / step))
    activate(i)
  }

  // Linear fallback — also the AT-friendly view.
  const LinearList = (
    <ul role="menu" aria-label={`${ariaLabel} (list view)`} className={styles.linear}>
      {items.map((child, i) => {
        const { icon, disabled, tone, children: label } = child.props
        const isGroup = child.type === RadialMenuGroup
        return (
          <li key={`${id}-l-${i}`} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              data-tone={tone || undefined}
              className={styles.linearItem}
              onClick={() => activate(i)}
            >
              {icon ? <span className={styles.linearIcon}>{icon}</span> : null}
              <span>{label}</span>
              {isGroup ? <span className={styles.linearChevron}>›</span> : null}
            </button>
          </li>
        )
      })}
    </ul>
  )

  if (!open) return null

  return (
    <div className={styles.root} data-open={open ? 'true' : 'false'}>
      <div
        ref={rootRef}
        role="menu"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={styles.wheel}
        style={{ width: svgSize, height: svgSize }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className={styles.svg}
          aria-hidden="true"
        >
          {/* Dead-zone disc — pure visual; the menu wrapper handles cancel. */}
          <circle cx={cx} cy={cy} r={innerRadius - 2} className={styles.deadzone} />
          {items.map((child, i) => {
            const a0 = startAngle + i * step
            const a1 = a0 + step
            const d = donutSectorPath(cx, cy, radius, innerRadius, a0, a1)
            const { disabled, tone } = child.props
            const focused = i === focusIdx
            return (
              <path
                key={`${id}-s-${i}`}
                d={d}
                className={styles.sector}
                data-focused={focused ? 'true' : undefined}
                data-disabled={disabled ? 'true' : undefined}
                data-tone={tone || undefined}
                style={{ '--i': i }}
                onMouseEnter={() => !disabled && setFocusIdx(i)}
                onClick={() => activate(i)}
              />
            )
          })}
        </svg>

        {/* HTML labels positioned with the same trig — keeps RTL/ellipsis/i18n sane. */}
        {items.map((child, i) => {
          const a = startAngle + (i + 0.5) * step
          const labelR = (radius + innerRadius) / 2
          const [lx, ly] = polar(cx, cy, labelR, a)
          const { icon, disabled, tone, children: label } = child.props
          const isGroup = child.type === RadialMenuGroup
          const focused = i === focusIdx
          return (
            <button
              type="button"
              role="menuitem"
              tabIndex={focused ? 0 : -1}
              aria-haspopup={isGroup ? 'menu' : undefined}
              aria-disabled={disabled || undefined}
              data-tone={tone || undefined}
              key={`${id}-lbl-${i}`}
              className={styles.label}
              style={{ left: lx, top: ly }}
              ref={(el) => {
                if (focused && el && open && document.activeElement !== el) {
                  // Programmatic focus only when the wheel is open.
                  el.focus({ preventScroll: true })
                }
              }}
              onClick={() => activate(i)}
              onFocus={() => setFocusIdx(i)}
            >
              {icon ? <span className={styles.icon} aria-hidden="true">{icon}</span> : null}
              <span className={styles.text}>{label}</span>
              {isGroup ? <span className={styles.chevron} aria-hidden="true">›</span> : null}
            </button>
          )
        })}

        {/* Nested ring */}
        {openGroupIdx !== null && items[openGroupIdx]?.type === RadialMenuGroup ? (
          <div className={styles.nested}>
            <RadialMenu
              open
              radius={radius + 70}
              innerRadius={radius + 14}
              startAngle={startAngle}
              sweep={sweep}
              ariaLabel={`${items[openGroupIdx].props.children} submenu`}
              onSelect={(v, p) => {
                onSelect?.(v, p)
                onOpenChange?.(false)
              }}
              onOpenChange={(o) => {
                if (!o) setOpenGroupIdx(null)
              }}
            >
              {items[openGroupIdx].props.children}
            </RadialMenu>
          </div>
        ) : null}
      </div>

      {linearFallback ? (
        <details className={styles.fallback}>
          <summary>List view</summary>
          {LinearList}
        </details>
      ) : null}
    </div>
  )
}
