import { useOverride } from './useOverride.js'

/**
 * Read/write hash-param overrides for a specific record entry field.
 *
 * Builds the full override path as `record.{recordName}.{entryId}.{field}`
 * and delegates to `useOverride`.
 *
 * @param {string} recordName - Record collection name (e.g. "posts")
 * @param {string} entryId - The id of the record entry to override
 * @param {string} field - Dot-notation field path within the entry (e.g. "title" or "author.name")
 * @returns {[any, function, function]}
 *   [0] current value (override ?? record default)
 *   [1] setValue(newValue) – write an override to the URL hash
 *   [2] clearValue() – remove the override
 *
 * @example
 * const [title, setTitle, clearTitle] = useRecordOverride('posts', 'welcome-to-storyboard', 'title')
 */
export function useRecordOverride(recordName, entryId, field) {
  return useOverride(`record.${recordName}.${entryId}.${field}`)
}
