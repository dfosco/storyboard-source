import StickyNote from './StickyNote.jsx'
import MarkdownBlock from './MarkdownBlock.jsx'
import PrototypeEmbed from './PrototypeEmbed.jsx'
import LinkPreview from './LinkPreview.jsx'
import ImageWidget from './ImageWidget.jsx'
import FigmaEmbed from './FigmaEmbed.jsx'
import CodePenEmbed from './CodePenEmbed.jsx'
import StoryWidget from './StoryWidget.jsx'
import StorySetWidget from './StorySetWidget.jsx'
import TerminalWidget from './TerminalWidget.jsx'
import TerminalReadWidget from './TerminalReadWidget.jsx'
import PromptWidget from './PromptWidget.jsx'
import TilesWidget from './TilesWidget.jsx'

/**
 * Maps widget type strings to their React components.
 * Each component receives: { id, props, onUpdate }
 */
export const widgetRegistry = {
  'sticky-note': StickyNote,
  'markdown': MarkdownBlock,
  'prototype': PrototypeEmbed,
  'link-preview': LinkPreview,
  'image': ImageWidget,
  'figma-embed': FigmaEmbed,
  'codepen-embed': CodePenEmbed,
  'story': StoryWidget,
  'component-set': StorySetWidget,
  'terminal': TerminalWidget,
  'terminal-read': TerminalReadWidget,
  'agent': TerminalWidget,
  'prompt': PromptWidget,
  'tiles': TilesWidget,
}

/**
 * Resolve a widget type string to its component.
 * Returns null for unknown types.
 */
export function getWidgetComponent(type) {
  return widgetRegistry[type] ?? null
}
