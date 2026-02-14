import { Outlet } from 'react-router-dom'
import StoryboardProvider from '../../storyboard/internals/context.jsx'

export default function App() {
  return (
    <StoryboardProvider>
      <Outlet />
    </StoryboardProvider>
  )
}
