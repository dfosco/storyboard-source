export function getCanvasPrimerAttrs(theme) {
  const value = String(theme || 'light')
  if (value.startsWith('dark')) {
    return {
      'data-color-mode': 'dark',
      'data-dark-theme': value,
      'data-light-theme': 'light',
    }
  }
  return {
    'data-color-mode': 'light',
    'data-dark-theme': 'dark',
    'data-light-theme': value.startsWith('light') ? value : 'light',
  }
}

/**
 * Per-theme canvas CSS custom properties sourced from @primer/primitives.
 * Each theme gets its own entry so high-contrast, colorblind, and dimmed
 * variants all render with the correct background, dot, and text colors.
 */
const THEME_VARS = {
  light: {
    '--sb--canvas-bg': '#f6f8fa',
    '--bgColor-default': '#ffffff',
    '--bgColor-muted': '#f6f8fa',
    '--bgColor-neutral-muted': '#818b981f',
    '--bgColor-accent-emphasis': '#0969da',
    '--tc-bg-muted': '#f6f8fa',
    '--tc-dot-color': 'rgba(0, 0, 0, 0.08)',
    '--overlay-backdrop-bgColor': 'rgba(0, 0, 0, 0.08)',
    '--fgColor-muted': '#59636e',
    '--fgColor-default': '#1f2328',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#d1d9e0',
    '--borderColor-muted': '#d1d9e0b3',
  },
  light_colorblind: {
    '--sb--canvas-bg': '#f6f8fa',
    '--bgColor-default': '#ffffff',
    '--bgColor-muted': '#f6f8fa',
    '--bgColor-neutral-muted': '#818b981f',
    '--bgColor-accent-emphasis': '#0969da',
    '--tc-bg-muted': '#f6f8fa',
    '--tc-dot-color': 'rgba(0, 0, 0, 0.08)',
    '--overlay-backdrop-bgColor': 'rgba(0, 0, 0, 0.08)',
    '--fgColor-muted': '#59636e',
    '--fgColor-default': '#1f2328',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#d1d9e0',
    '--borderColor-muted': '#d1d9e0b3',
  },
  dark: {
    '--sb--canvas-bg': '#151b23',
    '--bgColor-default': '#0d1117',
    '--bgColor-muted': '#151b23',
    '--bgColor-neutral-muted': '#656c7633',
    '--bgColor-accent-emphasis': '#1f6feb',
    '--tc-bg-muted': '#151b23',
    '--tc-dot-color': 'rgba(255, 255, 255, 0.1)',
    '--overlay-backdrop-bgColor': 'rgba(255, 255, 255, 0.1)',
    '--fgColor-muted': '#9198a1',
    '--fgColor-default': '#f0f6fc',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#3d444d',
    '--borderColor-muted': '#3d444db3',
  },
  dark_dimmed: {
    '--sb--canvas-bg': '#262c36',
    '--bgColor-default': '#212830',
    '--bgColor-muted': '#262c36',
    '--bgColor-neutral-muted': '#656c7633',
    '--bgColor-accent-emphasis': '#316dca',
    '--tc-bg-muted': '#262c36',
    '--tc-dot-color': 'rgba(209, 215, 224, 0.18)',
    '--overlay-backdrop-bgColor': 'rgba(209, 215, 224, 0.18)',
    '--fgColor-muted': '#9198a1',
    '--fgColor-default': '#d1d7e0',
    '--fgColor-onEmphasis': '#f0f6fc',
    '--borderColor-default': '#3d444d',
    '--borderColor-muted': '#3d444db3',
  },
  dark_colorblind: {
    '--sb--canvas-bg': '#151b23',
    '--bgColor-default': '#0d1117',
    '--bgColor-muted': '#151b23',
    '--bgColor-neutral-muted': '#656c7633',
    '--bgColor-accent-emphasis': '#1f6feb',
    '--tc-bg-muted': '#151b23',
    '--tc-dot-color': 'rgba(255, 255, 255, 0.1)',
    '--overlay-backdrop-bgColor': 'rgba(255, 255, 255, 0.1)',
    '--fgColor-muted': '#9198a1',
    '--fgColor-default': '#f0f6fc',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#3d444d',
    '--borderColor-muted': '#3d444db3',
  },
  dark_high_contrast: {
    '--sb--canvas-bg': '#151b23',
    '--bgColor-default': '#010409',
    '--bgColor-muted': '#151b23',
    '--bgColor-neutral-muted': '#212830',
    '--bgColor-accent-emphasis': '#194fb1',
    '--tc-bg-muted': '#151b23',
    '--tc-dot-color': 'rgba(183, 189, 200, 0.25)',
    '--overlay-backdrop-bgColor': 'rgba(183, 189, 200, 0.25)',
    '--fgColor-muted': '#b7bdc8',
    '--fgColor-default': '#ffffff',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#b7bdc8',
    '--borderColor-muted': '#b7bdc8',
  },
}

export function getCanvasThemeVars(theme) {
  const value = String(theme || 'light')
  return THEME_VARS[value] || THEME_VARS.light
}
