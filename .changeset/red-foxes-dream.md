---
"storyboard": minor
---

Add record overrides from URL hash params

Records can now be overridden and created via URL hash parameters using the `record.{name}.{entryId}.{field}=value` convention. Existing record entries get fields merged on top; unknown entry ids create new entries appended to the collection.

New exports:
- `useRecordOverride(recordName, entryId, field)` — read/write hook for record hash overrides

Also extracted shared utilities (`setByPath`, `deepClone`, `subscribeToHash`) into reusable modules.
