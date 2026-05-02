/**
 * Feature Flags tool module — toggle feature flags submenu.
 *
 * Renders as a submenu in the command menu listing all declared flags.
 */
export const id = 'feature-flags'

export async function handler() {
  const ff = await import('../../index.js')

  return {
    getChildren: () =>
      ff.getFlagKeys().map(key => ({
        id: `flags/${key}`,
        label: key,
        type: 'toggle',
        active: ff.getFlag(key),
        execute: () => ff.toggleFlag(key),
      })),
  }
}
