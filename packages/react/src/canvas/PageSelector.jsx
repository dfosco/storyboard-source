import { useCallback, useRef, useState, useEffect } from 'react'
import { createCanvas, renamePage, reorderPages, getPageOrder, duplicateCanvas } from './canvasApi.js'
import styles from './PageSelector.module.css'

const DragGrip = () => (
  <svg className={styles.dragHandle} width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden="true">
    <circle cx="2" cy="2" r="1.2" /><circle cx="6" cy="2" r="1.2" />
    <circle cx="2" cy="7" r="1.2" /><circle cx="6" cy="7" r="1.2" />
    <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
  </svg>
)

/**
 * In-canvas page selector — shows sibling pages in the same canvas group.
 * Only renders when 2+ sibling pages exist.
 * Uses window.location for navigation to avoid requiring a Router context.
 *
 * @param {{ currentName: string, pages: Array<{ name: string, route: string, title: string }>, isLocalDev?: boolean }} props
 */
export default function PageSelector({ currentName, pages: initialPages, isLocalDev = false }) {
  const [open, setOpen] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sb-open-page-selector')) {
        sessionStorage.removeItem('sb-open-page-selector')
        return true
      }
    } catch { /* ignore */ }
    return false
  })
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [pages, setPages] = useState(initialPages)
  const [successMsg, setSuccessMsg] = useState(null)
  const [editingPage, setEditingPage] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [orderedItems, setOrderedItems] = useState(() => initialPages.map(p => ({ type: 'page', ...p })))
  const [dragIndex, setDragIndex] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const editInputRef = useRef(null)
  const clickTimerRef = useRef(null)
  const didDragRef = useRef(false)

  // Sync pages when prop changes (e.g. HMR reload)
  useEffect(() => { setPages(initialPages) }, [initialPages])

  // Keep orderedItems in sync with pages when dropdown is closed
  useEffect(() => {
    setOrderedItems(prev => {
      // If we have order with separators, preserve it but update page data
      if (prev.some(i => i.type === 'separator')) return prev
      return initialPages.map(p => ({ type: 'page', ...p }))
    })
  }, [initialPages])

  // Derive folder from currentName (e.g. "Examples/Design Overview" → "Examples")
  const folder = currentName.includes('/') ? currentName.split('/')[0] : ''

  // Build ordered items from pages + saved order (with separators).
  // Load eagerly (not just when open) so the trigger badge shows correct index.
  useEffect(() => {
    let cancelled = false
    async function loadOrder() {
      if (!folder) {
        setOrderedItems(pages.map(p => ({ type: 'page', ...p })))
        return
      }
      try {
        const result = await getPageOrder(folder)
        if (cancelled) return
        if (result?.order) {
          const items = []
          const pageMap = new Map(pages.map(p => [p.name, p]))
          const seen = new Set()
          for (const entry of result.order) {
            if (typeof entry === 'string' && entry.startsWith('sep-')) {
              items.push({ type: 'separator', id: entry })
            } else if (pageMap.has(entry)) {
              items.push({ type: 'page', ...pageMap.get(entry) })
              seen.add(entry)
            }
          }
          // Append pages not in saved order
          for (const p of pages) {
            if (!seen.has(p.name)) items.push({ type: 'page', ...p })
          }
          setOrderedItems(items)
        } else {
          setOrderedItems(pages.map(p => ({ type: 'page', ...p })))
        }
      } catch {
        setOrderedItems(pages.map(p => ({ type: 'page', ...p })))
      }
    }
    loadOrder()
    return () => { cancelled = true }
  }, [pages, folder])

  // Derived values from ordered items
  const realPages = orderedItems.filter(i => i.type === 'page')
  const currentPage = realPages.find(p => p.name === currentName)
  const currentLabel = currentPage?.title || currentName.split('/').pop()
  const currentIndex = realPages.findIndex(p => p.name === currentName)

  const navigateTo = useCallback((page) => {
    const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    window.location.href = base + page.route
  }, [])

  const handleSelect = useCallback(
    (page) => {
      if (page.name !== currentName) {
        navigateTo(page)
      }
      setOpen(false)
    },
    [currentName, navigateTo],
  )

  // Click handler with 300ms delay (mouse only) to distinguish from dblclick
  const handleItemClick = useCallback((page, e) => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    if (editingPage) return
    // Cmd/Ctrl+click → open in new tab
    if (e?.metaKey || e?.ctrlKey) {
      e.preventDefault()
      const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
      window.open(base + page.route, '_blank')
      return
    }
    // Keyboard Enter/Space → navigate immediately
    if (!e?.nativeEvent || e.nativeEvent instanceof KeyboardEvent) {
      handleSelect(page)
      return
    }
    // Mouse click → delay to allow dblclick
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      handleSelect(page)
    }, 300)
  }, [editingPage, handleSelect])

  // Double-click to rename
  const handleItemDblClick = useCallback((page) => {
    if (!isLocalDev) return
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    setEditingPage(page.name)
    setEditValue(page.title)
  }, [isLocalDev])

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingPage && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingPage])

  // Commit rename
  const handleRenameCommit = useCallback(async () => {
    const trimmed = editValue.trim()
    const oldName = editingPage
    setEditingPage(null)
    if (!trimmed || !oldName) return

    const oldPage = realPages.find(p => p.name === oldName)
    if (!oldPage || trimmed === oldPage.title) return

    // Validate no duplicates (case-insensitive)
    const lower = trimmed.toLowerCase()
    if (realPages.some(p => p.name !== oldName && p.title.toLowerCase() === lower)) {
      console.warn('Duplicate page name:', trimmed)
      return
    }

    try {
      const result = await renamePage(oldName, trimmed)
      if (result?.error) {
        console.error('Failed to rename page:', result.error)
        return
      }
      const route = result?.route
      if (route) {
        const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
        const targetUrl = base + route
        try { sessionStorage.setItem('sb-open-page-selector', '1') } catch { /* ignore */ }
        if (import.meta.hot) {
          const timer = setTimeout(() => { window.location.href = targetUrl }, 3000)
          import.meta.hot.on('vite:beforeFullReload', () => {
            clearTimeout(timer)
            sessionStorage.setItem('sb-pending-navigate', targetUrl)
          })
        } else {
          setTimeout(() => { window.location.href = targetUrl }, 1000)
        }
      }
    } catch (err) {
      console.error('Failed to rename page:', err)
    }
  }, [editValue, editingPage, realPages])

  // Duplicate a page
  const handleDuplicate = useCallback(async (page, e) => {
    e.stopPropagation()

    // Smart copy naming: if title ends with ` N` or `vN`, increment the number.
    // Skip `#N` (could be issue refs) and years (2000-2099).
    const numberedMatch = page.title.match(/^(.+?)(\s+|v)(\d+)$/)
    let copyTitle
    const num = numberedMatch ? parseInt(numberedMatch[3], 10) : null
    const isYear = num !== null && num >= 2000 && num <= 2099
    if (numberedMatch && !isYear) {
      const [, base, sep, numStr] = numberedMatch
      let next = parseInt(numStr, 10) + 1
      const titles = new Set(realPages.map(p => p.title))
      while (titles.has(`${base}${sep}${next}`)) next++
      copyTitle = `${base}${sep}${next}`
    } else {
      const baseTitle = page.title.replace(/ Copy( \d+)?$/, '')
      const existingCopies = realPages
        .filter(p => {
          const t = p.title
          return t === `${baseTitle} Copy` || (/^.+ Copy \d+$/.test(t) && t.startsWith(baseTitle))
        })
        .length
      copyTitle = existingCopies === 0
        ? `${baseTitle} Copy`
        : `${baseTitle} Copy ${existingCopies + 1}`
    }

    try {
      const result = await duplicateCanvas(page.name, copyTitle)
      if (result?.error) {
        console.error('Failed to duplicate page:', result.error)
        return
      }
      const route = result?.route
      const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
      const targetUrl = base + route

      // Optimistically add the new page to the list
      const pageName = result.name || copyTitle
      setPages(prev => [...prev, { name: pageName, route, title: copyTitle }])
      setSuccessMsg(`"${copyTitle}" created`)

      try { sessionStorage.setItem('sb-open-page-selector', '1') } catch { /* ignore */ }

      if (import.meta.hot) {
        const timer = setTimeout(() => { window.location.href = targetUrl }, 3000)
        import.meta.hot.on('vite:beforeFullReload', () => {
          clearTimeout(timer)
          sessionStorage.setItem('sb-pending-navigate', targetUrl)
        })
      } else {
        setTimeout(() => { window.location.href = targetUrl }, 1000)
      }
    } catch (err) {
      console.error('Failed to duplicate page:', err)
    }
  }, [realPages])

  // Drag and drop handlers
  const handleDragStart = useCallback((index, e) => {
    didDragRef.current = true
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleDragOver = useCallback((index, e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback(async (toIndex, e) => {
    e.preventDefault()
    const fromIndex = dragIndex
    setDragIndex(null)
    setDropTarget(null)
    if (fromIndex == null || fromIndex === toIndex) return

    const newItems = [...orderedItems]
    const [moved] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, moved)
    setOrderedItems(newItems)

    if (folder) {
      const order = newItems.map(i => i.type === 'separator' ? i.id : i.name)
      try { await reorderPages(folder, order) } catch (err) {
        console.error('Failed to persist page order:', err)
      }
    }
  }, [dragIndex, orderedItems, folder])

  const handleAddPage = useCallback(async () => {
    const trimmed = newName.trim()
    if (!trimmed || creating) return

    // Separator shortcut
    if (trimmed === '---') {
      const sepId = `sep-${Date.now()}`
      const newItems = [...orderedItems, { type: 'separator', id: sepId }]
      setOrderedItems(newItems)
      setAdding(false)
      setNewName('')
      if (folder) {
        const order = newItems.map(i => i.type === 'separator' ? i.id : i.name)
        try { await reorderPages(folder, order) } catch (err) {
          console.error('Failed to persist separator:', err)
        }
      }
      return
    }

    setCreating(true)
    try {
      // Single-page canvas (no folder) → convert to multi-page folder
      const isSinglePage = !currentName.includes('/')
      const createBody = isSinglePage
        ? { name: trimmed, convertFrom: currentName }
        : { name: trimmed, folder: folder || undefined }

      const result = await createCanvas(createBody)
      if (result.error) {
        console.error('Failed to create canvas page:', result.error)
        setCreating(false)
        return
      }
      const route = result.route
      const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
      const targetUrl = base + route

      // Optimistically add the new page to the bottom of the list
      const pageName = result.name || trimmed
      setPages(prev => [...prev, { name: pageName, route, title: trimmed }])

      // Show success confirmation and reset form
      setSuccessMsg(`"${trimmed}" created`)
      setAdding(false)
      setNewName('')
      setCreating(false)

      // Stash a flag so the page selector opens automatically on the new page
      try { sessionStorage.setItem('sb-open-page-selector', '1') } catch { /* ignore */ }

      // Navigate to the new page after Vite picks up the new file
      if (import.meta.hot) {
        const timer = setTimeout(() => {
          window.location.href = targetUrl
        }, 3000)
        import.meta.hot.on('vite:beforeFullReload', () => {
          clearTimeout(timer)
          sessionStorage.setItem('sb-pending-navigate', targetUrl)
        })
      } else {
        setTimeout(() => { window.location.href = targetUrl }, 1000)
      }
    } catch (err) {
      console.error('Failed to create canvas page:', err)
      setCreating(false)
    }
  }, [newName, currentName, folder, creating, orderedItems])

  // Focus input when entering add mode
  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus()
  }, [adding])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setAdding(false)
        setNewName('')
        setSuccessMsg(null)
        setEditingPage(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (editingPage) {
          setEditingPage(null)
        } else if (adding) {
          setAdding(false)
          setNewName('')
        } else {
          setOpen(false)
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, adding, editingPage])

  // Show selector when there are multiple pages, or in dev mode (to allow adding pages)
  if (!pages || (pages.length < 2 && !isLocalDev)) return null

  return (
    <nav ref={containerRef} className={styles.container} aria-label="Canvas pages">
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switch canvas page"
      >
        <span className={styles.label}>{currentLabel}</span>
        <span className={styles.badge}>
          {currentIndex + 1}/{realPages.length}
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label="Canvas pages">
          {orderedItems.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <li
                  key={item.id}
                  className={`${styles.separatorRow} ${dragIndex === index ? styles.itemDragging : ''}`}
                  role="separator"
                  draggable={isLocalDev}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDrop={(e) => handleDrop(index, e)}
                  onDragEnd={handleDragEnd}
                >
                  {dropTarget === index && dragIndex !== index && <div className={styles.dropIndicator} />}
                  {isLocalDev && <DragGrip />}
                  <div className={styles.separatorLine} />
                </li>
              )
            }
            const page = item
            const isEditing = editingPage === page.name
            return (
              <li
                key={page.name}
                role="option"
                aria-selected={page.name === currentName}
                className={`${styles.item} ${page.name === currentName ? styles.itemActive : ''} ${dragIndex === index ? styles.itemDragging : ''}`}
                onClick={(e) => handleItemClick(page, e)}
                onDoubleClick={() => handleItemDblClick(page)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(page)
                  }
                }}
                tabIndex={0}
                draggable={isLocalDev && !isEditing}
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDrop={(e) => handleDrop(index, e)}
                onDragEnd={handleDragEnd}
              >
                {dropTarget === index && dragIndex !== index && <div className={styles.dropIndicator} />}
                {isLocalDev && <DragGrip />}
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    className={styles.addInput}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleRenameCommit() }
                      if (e.key === 'Escape') { e.preventDefault(); setEditingPage(null) }
                      e.stopPropagation()
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onBlur={handleRenameCommit}
                  />
                ) : (
                  <>
                    <span className={styles.itemContent}>{page.title}</span>
                    {isLocalDev && (
                      <button
                        className={styles.duplicateBtn}
                        onClick={(e) => handleDuplicate(page, e)}
                        onDoubleClick={(e) => e.stopPropagation()}
                        title="Duplicate page"
                        aria-label="Duplicate page"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </li>
            )
          })}
          {isLocalDev && (
            <li
              className={styles.dropZoneEnd}
              onDragOver={(e) => handleDragOver(orderedItems.length, e)}
              onDrop={(e) => handleDrop(orderedItems.length, e)}
            >
              {dropTarget === orderedItems.length && dragIndex != null && <div className={styles.dropIndicator} />}
              {adding ? (
                <div className={styles.addForm}>
                  <input
                    ref={inputRef}
                    className={styles.addInput}
                    type="text"
                    placeholder="Page name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddPage()
                      }
                    }}
                    disabled={creating}
                  />
                  <button
                    className={styles.addSubmit}
                    onClick={handleAddPage}
                    disabled={!newName.trim() || creating}
                  >
                    {creating ? '…' : 'Add'}
                  </button>
                </div>
              ) : (
                <div
                  className={styles.addItem}
                  onClick={() => setAdding(true)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setAdding(true)
                    }
                  }}
                >
                  + Add page
                </div>
              )}
              {successMsg && (
                <div className={styles.successMsg}>✓ {successMsg}</div>
              )}
            </li>
          )}
        </ul>
      )}
    </nav>
  )
}
