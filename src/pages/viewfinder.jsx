/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { scenes } from 'virtual:storyboard-data-index'
// Direct path import — workaround for git worktree symlink resolution.
// Switch to '@dfosco/storyboard-core' after merge.
import { hash, resolveSceneRoute } from '../../packages/core/src/viewfinder.js'
import { Link } from 'react-router-dom'
import styles from './viewfinder.module.css'

const branchBasePath = (import.meta.env.BASE_URL || '/storyboard/').replace(/\/[^/]*\/$/, '/')
const branchManifestUrl = `${branchBasePath}branches.json`

// Build a set of known route names from page files
const pageModules = import.meta.glob('/src/pages/*.jsx')
const knownRoutes = Object.keys(pageModules)
  .map(p => p.replace('/src/pages/', '').replace('.jsx', ''))
  .filter(n => !n.startsWith('_') && n !== 'index' && n !== 'viewfinder')

/**
 * Generates an abstract BW/desaturated cyberpunk SVG placeholder
 * that is unique per scene name.
 */
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

  // Grid lines for cyberpunk feel
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

const sceneNames = Object.keys(scenes)

function Viewfinder() {
  const [branches, setBranches] = useState(null)

  useEffect(() => {
    fetch(branchManifestUrl)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]))
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Viewfinder</h1>
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
            {sceneNames.map((name) => (
              <Link key={name} to={resolveSceneRoute(name, knownRoutes)} className={styles.card}>
                <div className={styles.thumbnail}>
                  <PlaceholderGraphic name={name} />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.sceneName}>{name}</p>
                </div>
              </Link>
            ))}
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

export default Viewfinder
