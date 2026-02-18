/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from 'react'
import { hash, resolveSceneRoute, getSceneMeta } from '@dfosco/storyboard-core'
import { Link } from 'react-router-dom'
import styles from './Viewfinder.module.css'

function PlaceholderGraphic({ name }) {
  const seed = hash(name)
  const rects = []

  for (let i = 0; i < 12; i++) {
    const s = seed * (i + 1)
    const x = (s * 7 + i * 31) % 320
    const y = (s * 13 + i * 17) % 200
    const w = 20 + (s * (i + 3)) % 80
    const h = 8 + (s * (i + 7)) % 40
    const opacity = 0.06 + ((s * (i + 2)) % 20) / 100
    const fill = i % 3 === 0 ? 'var(--placeholder-accent)' : i % 3 === 1 ? 'var(--placeholder-fg)' : 'var(--placeholder-muted)'

    rects.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={fill}
        opacity={opacity}
      />
    )
  }

  const lines = []
  for (let i = 0; i < 6; i++) {
    const s = seed * (i + 5)
    const y = 10 + (s % 180)
    lines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={y}
        x2={320}
        y2={y}
        stroke="var(--placeholder-grid)"
        strokeWidth={0.5}
        opacity={0.4}
      />
    )
  }
  for (let i = 0; i < 8; i++) {
    const s = seed * (i + 9)
    const x = 10 + (s % 300)
    lines.push(
      <line
        key={`v${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={200}
        stroke="var(--placeholder-grid)"
        strokeWidth={0.5}
        opacity={0.3}
      />
    )
  }

  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="320" height="200" fill="var(--placeholder-bg)" />
      {lines}
      {rects}
    </svg>
  )
}

/**
 * Viewfinder — scene index and branch preview dashboard.
 *
 * @param {Object} props
 * @param {Record<string, unknown>} props.scenes - Scene index object (keys are scene names)
 * @param {Record<string, unknown>} props.pageModules - import.meta.glob result for page files
 * @param {string} [props.basePath] - Base URL path (defaults to import.meta.env.BASE_URL)
 * @param {string} [props.title] - Header title (defaults to "Viewfinder")
 */
export default function Viewfinder({ scenes = {}, pageModules = {}, basePath, title = 'Viewfinder' }) {
  const [branches, setBranches] = useState(null)

  const sceneNames = useMemo(() => Object.keys(scenes), [scenes])

  const knownRoutes = useMemo(() =>
    Object.keys(pageModules)
      .map(p => p.replace('/src/pages/', '').replace('.jsx', ''))
      .filter(n => !n.startsWith('_') && n !== 'index' && n !== 'viewfinder'),
    [pageModules]
  )

  const branchBasePath = useMemo(() => {
    const base = basePath || '/storyboard-source/'
    return base.replace(/\/[^/]*\/$/, '/')
  }, [basePath])

  useEffect(() => {
    const url = `${branchBasePath}branches.json`
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]))
  }, [branchBasePath])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>
          {sceneNames.length} scene{sceneNames.length !== 1 ? 's' : ''}
          {branches && branches.length > 0 ? ` · ${branches.length} branch preview${branches.length !== 1 ? 's' : ''}` : ''}
        </p>
      </header>

      {sceneNames.length === 0 ? (
        <p className={styles.empty}>No scenes found. Add a <code>*.scene.json</code> file to get started.</p>
      ) : (
        <section>
          <h2 className={styles.sectionTitle}>Scenes</h2>
          <div className={styles.grid}>
            {sceneNames.map((name) => {
              const meta = getSceneMeta(name)
              return (
                <Link key={name} to={resolveSceneRoute(name, knownRoutes)} className={styles.card}>
                  <div className={styles.thumbnail}>
                    <PlaceholderGraphic name={name} />
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.sceneName}>{name}</p>
                    {meta?.author && (
                      <div className={styles.author}>
                        <img
                          src={`https://github.com/${meta.author}.png?size=32`}
                          alt={meta.author}
                          className={styles.authorAvatar}
                        />
                        <span className={styles.authorName}>{meta.author}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {branches && branches.length > 0 && (
        <section className={styles.branchSection}>
          <h2 className={styles.sectionTitle}>Branch Previews</h2>
          <div className={styles.grid}>
            {branches.map((b) => (
              <a
                key={b.folder}
                href={`${branchBasePath}${b.folder}/`}
                className={styles.card}
              >
                <div className={styles.thumbnail}>
                  <PlaceholderGraphic name={b.branch} />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.sceneName}>{b.branch}</p>
                  <p className={styles.branchMeta}>{b.folder}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
