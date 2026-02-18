/**
 * Barrel exports for the comments system.
 */

// Config
export { initCommentsConfig, getCommentsConfig, isCommentsEnabled } from './config.js'

// Auth
export { getToken, setToken, clearToken, getCachedUser, validateToken, isAuthenticated } from './auth.js'

// Comment mode
export { isCommentModeActive, toggleCommentMode, setCommentMode, subscribeToCommentMode } from './commentMode.js'

// Metadata
export { parseMetadata, serializeMetadata, updateMetadata } from './metadata.js'

// API
export {
  fetchRouteDiscussion,
  createComment,
  replyToComment,
  resolveComment,
  moveComment,
  deleteComment,
  addReaction,
  removeReaction,
  listDiscussions,
} from './api.js'

// GraphQL client (for advanced use)
export { graphql } from './graphql.js'

// Mount
export { mountComments } from './ui/mount.js'

// Comment window
export { showCommentWindow, closeCommentWindow } from './ui/commentWindow.js'
