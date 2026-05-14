// Direct import bypasses the barrel re-export in @dfosco/storyboard/index.js,
// which eagerly pulls CanvasPage (3K lines), CommandPalette (1.3K lines), etc.
// The index route only needs Workspace — keep its module graph tight.
import Workspace from '@dfosco/storyboard/workspace'

const pageModules = import.meta.glob('/src/prototypes/*/*.jsx')

export default function IndexPage() {
  return (
    <Workspace
      title="Storyboard"
      subtitle="Collaborative workspace for design & code"
      pageModules={pageModules}
      basePath={import.meta.env.BASE_URL}
    />
  )
}
