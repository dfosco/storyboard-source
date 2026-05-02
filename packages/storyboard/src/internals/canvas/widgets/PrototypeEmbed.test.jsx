import { describe, expect, it } from 'vitest'
import { getEmbedChromeVars } from './embedTheme.js'

describe('getEmbedChromeVars', () => {
  it('follows toolbar theme variants for embed edit chrome', () => {
    expect(getEmbedChromeVars('light')['--bgColor-default']).toBe('#ffffff')
    expect(getEmbedChromeVars('dark')['--bgColor-default']).toBe('#0d1117')
    expect(getEmbedChromeVars('dark_dimmed')['--bgColor-default']).toBe('#212830')
  })
})
