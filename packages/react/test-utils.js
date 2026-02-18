import React from 'react'
import { init } from '@dfosco/storyboard-core'
import { StoryboardContext } from './src/StoryboardContext.js'

export const TEST_SCENES = {
  default: {
    user: { name: 'Alice', role: 'admin' },
    settings: { theme: 'dark_dimmed', notifications: true },
    record: {
      posts: {
        'post-1': { title: 'Original Title' },
      },
    },
  },
}

export const TEST_RECORDS = {
  posts: [
    { id: 'post-1', title: 'First Post', author: 'Alice' },
    { id: 'post-2', title: 'Second Post', author: 'Bob' },
  ],
}

const TEST_OBJECTS = {
  navigation: { items: [{ label: 'Home', href: '/' }] },
}

/**
 * Seed the core data index with test fixtures.
 * Call in beforeEach so each test starts fresh.
 */
export function seedTestData() {
  init({ scenes: TEST_SCENES, objects: TEST_OBJECTS, records: TEST_RECORDS })
}

/**
 * Create a wrapper component that provides StoryboardContext.
 * @param {object} sceneData - The scene data object to provide
 * @param {string} [sceneName='default'] - Scene name
 * @returns {function} React wrapper component for renderHook
 */
export function createWrapper(sceneData, sceneName = 'default') {
  return function Wrapper({ children }) {
    return React.createElement(
      StoryboardContext.Provider,
      { value: { data: sceneData, sceneName } },
      children,
    )
  }
}
