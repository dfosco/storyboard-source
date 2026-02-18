/**
 * Public API for comments — fetch, create, reply, resolve, move, delete, reactions.
 *
 * All functions assume comments config has been initialized via initCommentsConfig().
 */

import { graphql } from './graphql.js'
import { getCommentsConfig } from './config.js'
import { parseMetadata, serializeMetadata, updateMetadata } from './metadata.js'
import {
  SEARCH_DISCUSSION,
  GET_CATEGORY_ID,
  CREATE_DISCUSSION,
  ADD_COMMENT,
  ADD_REPLY,
  UPDATE_COMMENT,
  DELETE_COMMENT,
  ADD_REACTION,
  REMOVE_REACTION,
  LIST_DISCUSSIONS,
} from './queries.js'

/**
 * Fetch the discussion for a given route, including all comments and replies.
 * Returns null if no discussion exists for the route.
 * @param {string} route - The route path (e.g. "/Overview")
 * @returns {Promise<object|null>}
 */
export async function fetchRouteDiscussion(route) {
  const config = getCommentsConfig()
  const title = `Comments: ${route}`
  const query = `"${title}" in:title repo:${config.repo.owner}/${config.repo.name}`

  const data = await graphql(SEARCH_DISCUSSION, { query })
  const discussion = data.search?.nodes?.[0]
  if (!discussion) return null

  // Parse metadata from each comment
  const comments = (discussion.comments?.nodes ?? []).map((comment) => {
    const { meta, text } = parseMetadata(comment.body)
    return {
      ...comment,
      meta,
      text,
      replies: (comment.replies?.nodes ?? []).map((reply) => {
        const { meta: replyMeta, text: replyText } = parseMetadata(reply.body)
        return { ...reply, meta: replyMeta, text: replyText }
      }),
    }
  })

  return { ...discussion, comments }
}

/**
 * Get the repository ID and discussion category ID.
 * @returns {Promise<{ repositoryId: string, categoryId: string }>}
 */
async function getRepoAndCategoryIds() {
  const config = getCommentsConfig()
  const categorySlug = config.discussions.category.toLowerCase().replace(/\s+/g, '-')
  const data = await graphql(GET_CATEGORY_ID, {
    owner: config.repo.owner,
    name: config.repo.name,
    slug: categorySlug,
  })

  const repositoryId = data.repository?.id
  let categoryId = data.repository?.discussionCategory?.id

  // Fallback: search by name in the list
  if (!categoryId) {
    const cat = data.repository?.discussionCategories?.nodes?.find(
      (c) => c.name === config.discussions.category
    )
    categoryId = cat?.id
  }

  if (!repositoryId || !categoryId) {
    throw new Error(
      `Could not find repository or discussion category "${config.discussions.category}" in ${config.repo.owner}/${config.repo.name}`
    )
  }

  return { repositoryId, categoryId }
}

/**
 * Create a new comment on a route. Creates the route discussion if it doesn't exist.
 * @param {string} route - The route path
 * @param {number} x - X coordinate (percentage)
 * @param {number} y - Y coordinate (percentage)
 * @param {string} text - Comment text
 * @returns {Promise<object>} - The created comment
 */
export async function createComment(route, x, y, text) {
  let discussion = await fetchRouteDiscussion(route)

  if (!discussion) {
    // Create the route discussion first
    const { repositoryId, categoryId } = await getRepoAndCategoryIds()
    const title = `Comments: ${route}`
    const body = serializeMetadata({ route, createdAt: new Date().toISOString() }, '')
    const result = await graphql(CREATE_DISCUSSION, { repositoryId, categoryId, title, body })
    discussion = result.createDiscussion.discussion
  }

  const body = serializeMetadata({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }, text)
  const result = await graphql(ADD_COMMENT, { discussionId: discussion.id, body })
  return result.addDiscussionComment.comment
}

/**
 * Reply to an existing comment.
 * @param {string} discussionId - The discussion ID
 * @param {string} commentId - The comment ID to reply to
 * @param {string} text - Reply text
 * @returns {Promise<object>}
 */
export async function replyToComment(discussionId, commentId, text) {
  const result = await graphql(ADD_REPLY, { discussionId, replyToId: commentId, body: text })
  return result.addDiscussionComment.comment
}

/**
 * Resolve a comment by updating its metadata.
 * @param {string} commentId - The comment ID
 * @param {string} currentBody - The current comment body
 * @returns {Promise<object>}
 */
export async function resolveComment(commentId, currentBody) {
  const newBody = updateMetadata(currentBody, { resolved: true })
  const result = await graphql(UPDATE_COMMENT, { commentId, body: newBody })
  return result.updateDiscussionComment.comment
}

/**
 * Move a comment to new coordinates.
 * @param {string} commentId - The comment ID
 * @param {string} currentBody - The current comment body
 * @param {number} x - New X coordinate (percentage)
 * @param {number} y - New Y coordinate (percentage)
 * @returns {Promise<object>}
 */
export async function moveComment(commentId, currentBody, x, y) {
  const newBody = updateMetadata(currentBody, {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  })
  const result = await graphql(UPDATE_COMMENT, { commentId, body: newBody })
  return result.updateDiscussionComment.comment
}

/**
 * Delete a comment (typically a reply).
 * @param {string} commentId - The comment ID to delete
 * @returns {Promise<void>}
 */
export async function deleteComment(commentId) {
  await graphql(DELETE_COMMENT, { commentId })
}

/**
 * Add a reaction to a comment or reply.
 * @param {string} subjectId - The comment/reply ID
 * @param {string} content - Reaction type (e.g. "THUMBS_UP", "HEART")
 * @returns {Promise<void>}
 */
export async function addReaction(subjectId, content) {
  await graphql(ADD_REACTION, { subjectId, content })
}

/**
 * Remove a reaction from a comment or reply.
 * @param {string} subjectId - The comment/reply ID
 * @param {string} content - Reaction type
 * @returns {Promise<void>}
 */
export async function removeReaction(subjectId, content) {
  await graphql(REMOVE_REACTION, { subjectId, content })
}

/**
 * List all comment discussions in the configured category.
 * @returns {Promise<object[]>}
 */
export async function listDiscussions() {
  const config = getCommentsConfig()
  const { categoryId } = await getRepoAndCategoryIds()
  const data = await graphql(LIST_DISCUSSIONS, {
    owner: config.repo.owner,
    name: config.repo.name,
    categoryId,
  })
  return data.repository?.discussions?.nodes ?? []
}
