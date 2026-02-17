import { Outlet } from 'react-router-dom'
import { StoryboardProvider } from '@storyboard/react'

export default function App() {
  return (
    <StoryboardProvider>
      <Outlet />
    </StoryboardProvider>
  )
}
