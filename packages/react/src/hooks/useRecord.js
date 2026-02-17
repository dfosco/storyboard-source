import { useMemo, useSyncExternalStore } from 'react'
import { useParams } from 'react-router-dom'
import { loadRecord } from '@storyboard/core'
import { deepClone, setByPath } from '@storyboard/core'
import { getAllParams } from '@storyboard/core'
import { subscribeToHash, getHashSnapshot } from '@storyboard/core'

/**
 * Collect hash overrides for a record and merge them into the base array.
 *
 * Hash convention: record.{recordName}.{entryId}.{field}=value
 *
 * - Existing entries (matched by id) get fields merged on top.
 * - Unknown ids create new entries appended to the array.
 *
 * @param {Array} baseRecords - The original record array (will be deep-cloned)
 * @param {string} recordName - Record collection name (e.g. "posts")
 * @returns {Array} Merged array
 */
function applyRecordOverrides(baseRecords, recordName) {
  const allParams = getAllParams()
  const prefix = `record.${recordName}.`

  // Collect only the params that target this record
  const overrideKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))
  if (overrideKeys.length === 0) return baseRecords

  const records = deepClone(baseRecords)

  // Group overrides by entry id
  // key format: record.{name}.{entryId}.{field...}
  const byEntryId = {}
  for (const key of overrideKeys) {
    const rest = key.slice(prefix.length) // "{entryId}.{field...}"
    const dotIdx = rest.indexOf('.')
    if (dotIdx === -1) continue // no field path — skip
    const entryId = rest.slice(0, dotIdx)
    const fieldPath = rest.slice(dotIdx + 1)
    if (!byEntryId[entryId]) byEntryId[entryId] = {}
    byEntryId[entryId][fieldPath] = allParams[key]
  }

  for (const [entryId, fields] of Object.entries(byEntryId)) {
    const existing = records.find(e => e.id === entryId)
    if (existing) {
      // Merge fields into existing entry
      for (const [fieldPath, value] of Object.entries(fields)) {
        setByPath(existing, fieldPath, value)
      }
    } else {
      // Create new entry and append
      const newEntry = { id: entryId }
      for (const [fieldPath, value] of Object.entries(fields)) {
        setByPath(newEntry, fieldPath, value)
      }
      records.push(newEntry)
    }
  }

  return records
}

/**
 * Loads a single record entry from a record collection, matched by URL param.
 * Hash overrides are applied before lookup — both field overrides on existing
 * entries and entirely new entries added via the URL are supported.
 *
 * The `paramName` serves double duty: it's both the route param to read from
 * the URL and the record field to match against. This maps naturally to the
 * file-based routing convention — `[id].jsx` matches entry.id,
 * `[permalink].jsx` would match entry.permalink, etc.
 *
 * @param {string} recordName - Name of the record file (e.g., "posts")
 * @param {string} paramName - Route param name, also used as the entry field to match
 * @returns {object|null} The matched record entry, or null if not found
 *
 * @example
 * // In pages/issues/[id].jsx:
 * const issue = useRecord('issues', 'id')
 * // URL /issues/refactor-auth-sso → finds entry where entry.id === 'refactor-auth-sso'
 *
 * // In pages/posts/[permalink].jsx:
 * const post = useRecord('posts', 'permalink')
 * // URL /posts/hello-world → finds entry where entry.permalink === 'hello-world'
 */
export function useRecord(recordName, paramName = 'id') {
  const params = useParams()
  const paramValue = params[paramName]

  // Re-render on hash changes so overrides are reactive
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)

  return useMemo(() => {
    if (!paramValue) return null
    try {
      const base = loadRecord(recordName)
      const merged = applyRecordOverrides(base, recordName)
      return merged.find(e => e[paramName] === paramValue) ?? null
    } catch (err) {
      console.error(`[useRecord] ${err.message}`)
      return null
    }
  }, [recordName, paramName, paramValue, hashString]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Loads all entries from a record collection.
 * Hash overrides are applied — existing entries can be modified and
 * new entries can be created entirely from URL hash params.
 *
 * @param {string} recordName - Name of the record file (e.g., "posts")
 * @returns {Array} All record entries (with overrides applied)
 *
 * @example
 * const allPosts = useRecords('posts')
 */
export function useRecords(recordName) {
  // Re-render on hash changes so overrides are reactive
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)

  return useMemo(() => {
    try {
      const base = loadRecord(recordName)
      return applyRecordOverrides(base, recordName)
    } catch (err) {
      console.error(`[useRecords] ${err.message}`)
      return []
    }
  }, [recordName, hashString]) // eslint-disable-line react-hooks/exhaustive-deps
}
