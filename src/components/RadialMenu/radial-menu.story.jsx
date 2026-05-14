/**
 * RadialMenu — every state and variation as its own named export so the
 * Storyboard component-set widget can render them as a labeled grid.
 */

import { useState } from 'react'
import {
  XIcon as ScissorsIcon,
  CopyIcon,
  PasteIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  LinkIcon,
  MailIcon,
  StarIcon,
  HeartIcon,
  BookmarkIcon,
  DownloadIcon,
  UploadIcon,
  EyeIcon,
  BellIcon,
  PlusIcon,
} from '@primer/octicons-react'
import { Button, Text } from '@primer/react'
import RadialMenu, { RadialMenuItem, RadialMenuGroup } from './RadialMenu.jsx'

function Stage({ children, minHeight = 280 }) {
  return (
    <div
      style={{
        padding: 24,
        display: 'grid',
        placeItems: 'center',
        minHeight,
        background: 'var(--bgColor-default, #fff)',
      }}
    >
      {children}
    </div>
  )
}

function Frame({ title, children, height = 320 }) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--borderColor-default, #d0d7de)',
        borderRadius: 8,
        background: 'var(--bgColor-default, #fff)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: height,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fgColor-muted, #59636e)' }}>{title}</div>
      <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>{children}</div>
    </div>
  )
}

export function AllStates() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
        padding: 16,
        background: 'var(--bgColor-muted, #f6f8fa)',
      }}
    >
      <Frame title="1 · Default (6 items)"><Default /></Frame>
      <Frame title="2 · With icons"><WithIcons /></Frame>
      <Frame title="3 · Disabled + danger"><DisabledAndDanger /></Frame>
      <Frame title="4 · Few items (3)"><ThreeItems /></Frame>
      <Frame title="5 · Cap (8 items)"><EightItemCap /></Frame>
      <Frame title="6 · Anti-pattern: 12 items" height={360}><TooManyItemsAntiPattern /></Frame>
      <Frame title="7 · Nested group" height={420}><NestedGroup /></Frame>
      <Frame title="8 · Partial sweep (half-pie)"><PartialSweepHalfPie /></Frame>
      <Frame title="9 · Compact (icon-only)"><CompactIconOnly /></Frame>
      <Frame title="10 · Linear fallback (a11y)"><LinearFallback /></Frame>
      <Frame title="11 · Closed (interactive trigger)"><ClosedWithTrigger /></Frame>
      <Frame title="12 · Marking-menu gestures"><MarkingMenuGestures /></Frame>
    </div>
  )
}

/* ---------------------------- Variations ---------------------------- */

export function Default() {
  return (
    <Stage>
      <RadialMenu radius={100}>
        <RadialMenuItem value="cut">Cut</RadialMenuItem>
        <RadialMenuItem value="copy">Copy</RadialMenuItem>
        <RadialMenuItem value="paste">Paste</RadialMenuItem>
        <RadialMenuItem value="edit">Edit</RadialMenuItem>
        <RadialMenuItem value="share">Share</RadialMenuItem>
        <RadialMenuItem value="delete">Delete</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function WithIcons() {
  return (
    <Stage>
      <RadialMenu radius={100}>
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="paste" icon={<PasteIcon />}>Paste</RadialMenuItem>
        <RadialMenuItem value="edit" icon={<PencilIcon />}>Edit</RadialMenuItem>
        <RadialMenuItem value="share" icon={<ShareIcon />}>Share</RadialMenuItem>
        <RadialMenuItem value="delete" icon={<TrashIcon />}>Delete</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function DisabledAndDanger() {
  return (
    <Stage>
      <RadialMenu radius={100}>
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="paste" icon={<PasteIcon />} disabled>Paste</RadialMenuItem>
        <RadialMenuItem value="edit" icon={<PencilIcon />}>Edit</RadialMenuItem>
        <RadialMenuItem value="share" icon={<ShareIcon />} disabled>Share</RadialMenuItem>
        <RadialMenuItem value="delete" icon={<TrashIcon />} tone="danger">Delete</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function ThreeItems() {
  return (
    <Stage>
      <RadialMenu radius={100}>
        <RadialMenuItem value="up" icon={<UploadIcon />}>Upload</RadialMenuItem>
        <RadialMenuItem value="down" icon={<DownloadIcon />}>Download</RadialMenuItem>
        <RadialMenuItem value="view" icon={<EyeIcon />}>View</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function EightItemCap() {
  return (
    <Stage>
      <RadialMenu radius={110}>
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="paste" icon={<PasteIcon />}>Paste</RadialMenuItem>
        <RadialMenuItem value="edit" icon={<PencilIcon />}>Edit</RadialMenuItem>
        <RadialMenuItem value="share" icon={<ShareIcon />}>Share</RadialMenuItem>
        <RadialMenuItem value="star" icon={<StarIcon />}>Star</RadialMenuItem>
        <RadialMenuItem value="save" icon={<BookmarkIcon />}>Save</RadialMenuItem>
        <RadialMenuItem value="delete" icon={<TrashIcon />} tone="danger">Delete</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function TooManyItemsAntiPattern() {
  return (
    <Stage minHeight={360}>
      <RadialMenu radius={130}>
        {Array.from({ length: 12 }).map((_, i) => (
          <RadialMenuItem key={i} value={`opt-${i}`}>{`Option ${i + 1}`}</RadialMenuItem>
        ))}
      </RadialMenu>
    </Stage>
  )
}
TooManyItemsAntiPattern.minHeight = 360

export function NestedGroup() {
  return (
    <Stage minHeight={420}>
      <RadialMenu radius={100}>
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="edit" icon={<PencilIcon />}>Edit</RadialMenuItem>
        <RadialMenuGroup value="share" icon={<ShareIcon />}>
          <RadialMenuItem value="share:link" icon={<LinkIcon />}>Link</RadialMenuItem>
          <RadialMenuItem value="share:email" icon={<MailIcon />}>Email</RadialMenuItem>
          <RadialMenuItem value="share:notify" icon={<BellIcon />}>Notify</RadialMenuItem>
        </RadialMenuGroup>
        <RadialMenuItem value="delete" icon={<TrashIcon />} tone="danger">Delete</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}
NestedGroup.minHeight = 460

AllStates.minHeight = 800
AllStates.componentSet = false

export function PartialSweepHalfPie() {
  return (
    <Stage>
      <RadialMenu radius={110} startAngle={-Math.PI} sweep={Math.PI}>
        <RadialMenuItem value="like" icon={<HeartIcon />}>Like</RadialMenuItem>
        <RadialMenuItem value="star" icon={<StarIcon />}>Star</RadialMenuItem>
        <RadialMenuItem value="save" icon={<BookmarkIcon />}>Save</RadialMenuItem>
        <RadialMenuItem value="share" icon={<ShareIcon />}>Share</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function CompactIconOnly() {
  return (
    <Stage>
      <RadialMenu radius={64} innerRadius={22}>
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="paste" icon={<PasteIcon />}>Paste</RadialMenuItem>
        <RadialMenuItem value="delete" icon={<TrashIcon />} tone="danger">Del</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function LinearFallback() {
  return (
    <Stage>
      <RadialMenu radius={90} linearFallback>
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="paste" icon={<PasteIcon />}>Paste</RadialMenuItem>
        <RadialMenuItem value="delete" icon={<TrashIcon />} tone="danger">Delete</RadialMenuItem>
      </RadialMenu>
    </Stage>
  )
}

export function ClosedWithTrigger() {
  return (
    <Stage>
      <ClosedExample />
    </Stage>
  )
}

export function MarkingMenuGestures() {
  return (
    <Stage>
      <GestureExample />
    </Stage>
  )
}

/* ---------------------------- Helpers ---------------------------- */

function ClosedExample() {
  const [open, setOpen] = useState(false)
  const [last, setLast] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Button leadingVisual={PlusIcon} onClick={() => setOpen((o) => !o)}>
        {open ? 'Close menu' : 'Open menu'}
      </Button>
      <Text sx={{ fontSize: 0, color: 'fg.muted' }}>
        last selected: <code>{last ?? '—'}</code>
      </Text>
      <RadialMenu
        open={open}
        onOpenChange={setOpen}
        radius={90}
        onSelect={(v) => setLast(v)}
      >
        <RadialMenuItem value="cut" icon={<ScissorsIcon />}>Cut</RadialMenuItem>
        <RadialMenuItem value="copy" icon={<CopyIcon />}>Copy</RadialMenuItem>
        <RadialMenuItem value="paste" icon={<PasteIcon />}>Paste</RadialMenuItem>
        <RadialMenuItem value="delete" icon={<TrashIcon />} tone="danger">Delete</RadialMenuItem>
      </RadialMenu>
    </div>
  )
}

function GestureExample() {
  const [last, setLast] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <Text sx={{ fontSize: 0, color: 'fg.muted' }}>
        Mouse-down center, flick ≥24px in a direction
      </Text>
      <RadialMenu radius={90} gestureThreshold={24} onSelect={(v) => setLast(v)}>
        <RadialMenuItem value="up" icon={<UploadIcon />}>Up</RadialMenuItem>
        <RadialMenuItem value="right" icon={<ShareIcon />}>Right</RadialMenuItem>
        <RadialMenuItem value="down" icon={<DownloadIcon />}>Down</RadialMenuItem>
        <RadialMenuItem value="left" icon={<TrashIcon />} tone="danger">Left</RadialMenuItem>
      </RadialMenu>
    </div>
  )
}
