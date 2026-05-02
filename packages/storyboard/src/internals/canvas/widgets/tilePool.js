/**
 * Static tile image pool.
 * Each import resolves to a Vite asset URL at build time.
 */
import solidA from './tiles/solid-a.png'
import solidB from './tiles/solid-b.png'
import quarterTL from './tiles/quarter-tl.png'
import quarterTR from './tiles/quarter-tr.png'
import diagonalBR from './tiles/diagonal-br.png'
import diagonalBL from './tiles/diagonal-bl.png'
import diagonalTL from './tiles/diagonal-tl.png'
import leaf from './tiles/leaf.png'

export const TILE_POOL = [
  solidA,
  solidB,
  quarterTL,
  quarterTR,
  diagonalBR,
  diagonalBL,
  diagonalTL,
  leaf,
]
