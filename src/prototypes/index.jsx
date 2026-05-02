import { Workspace } from '@dfosco/storyboard'

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
