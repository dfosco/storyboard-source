import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { findRecord, loadRecord } from '../core/loader.js'

/**
 * Loads a single record entry from a record collection, matched by URL param.
 *
 * @param {string} recordName - Name of the record file (e.g., "posts")
 * @param {string} paramName - Route param whose value is matched against entry `id`
 * @returns {object|null} The matched record entry, or null if not found
 *
 * @example
 * // In pages/posts/[slug].jsx:
 * const post = useRecord('posts', 'slug')
 * // URL /posts/welcome → finds entry with id "welcome" in posts.record.json
 */
export function useRecord(recordName, paramName) {
  const params = useParams()
  const paramValue = params[paramName]

  return useMemo(() => {
    if (!paramValue) return null
    try {
      return findRecord(recordName, paramValue)
    } catch (err) {
      console.error(`[useRecord] ${err.message}`)
      return null
    }
  }, [recordName, paramValue])
}

/**
 * Loads all entries from a record collection.
 *
 * @param {string} recordName - Name of the record file (e.g., "posts")
 * @returns {Array} All record entries
 *
 * @example
 * const allPosts = useRecords('posts')
 */
export function useRecords(recordName) {
  return useMemo(() => {
    try {
      return loadRecord(recordName)
    } catch (err) {
      console.error(`[useRecords] ${err.message}`)
      return []
    }
  }, [recordName])
}
