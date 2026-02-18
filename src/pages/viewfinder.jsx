import { scenes } from 'virtual:storyboard-data-index'
import { Viewfinder } from '@dfosco/storyboard-react'

const pageModules = import.meta.glob('/src/pages/*.jsx')

export default function ViewfinderPage() {
  return (
    <Viewfinder
      scenes={scenes}
      pageModules={pageModules}
      basePath={import.meta.env.BASE_URL}
    />
  )
}
