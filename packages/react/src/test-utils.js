import { createElement } from 'react'
import { StoryboardContext } from './StoryboardContext.js'
import { init } from '@dfosco/storyboard-core'

// Default test data
export const TEST_SCENES = {
  default: {
    user: { name: 'Jane', profile: { bio: 'Dev' } },
    settings: { theme: 'dark' },
    projects: [{ id: 1, name: 'alpha' }, { id: 2, name: 'beta' }],
  },
  other: {
    user: { name: 'Bob' },
    settings: { theme: 'light' },
  },
}

export const TEST_OBJECTS = {
  'jane-doe': { name: 'Jane Doe', role: 'admin' },
}

export const TEST_RECORDS = {
  posts: [
    { id: 'post-1', title: 'First Post', author: 'Jane' },
    { id: 'post-2', title: 'Second Post', author: 'Bob' },
  ],
}

export function seedTestData() {
  init({ scenes: TEST_SCENES, objects: TEST_OBJECTS, records: TEST_RECORDS })
}

// Wrapper that provides StoryboardContext with given scene data
export function createWrapper(sceneData, sceneName = 'default') {
  return function Wrapper({ children }) {
    return createElement(
      StoryboardContext.Provider,
      { value: { data: sceneData, error: null, loading: false, sceneName } },
      children
    )
  }
}
