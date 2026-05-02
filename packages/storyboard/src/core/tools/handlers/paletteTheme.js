/**
 * Palette Theme tool — theme submenu for the command palette.
 *
 * Returns theme options as children, plus a "Theme settings" entry
 * that opens the toolbar Theme menu with the settings submenu expanded.
 */
export const id = 'palette-theme'

export async function handler() {
  const { themeState, setTheme, THEMES } = await import('../../index.js')

  return {
    getChildren() {
      const current = themeState.theme
      return [
        // Theme options
        ...THEMES.map(t => ({
          id: `theme:${t.value}`,
          label: t.name,
          type: 'toggle',
          active: current === t.value,
          execute: () => setTheme(t.value),
        })),
        // "Theme settings" opens the toolbar theme menu at the settings submenu
        {
          id: 'theme:settings',
          label: 'Theme settings',
          execute: () => {
            document.dispatchEvent(new CustomEvent('storyboard:open-theme-settings'))
          },
        },
      ]
    },
  }
}
