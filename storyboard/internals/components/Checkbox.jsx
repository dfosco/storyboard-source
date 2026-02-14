/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react'
import { Checkbox as PrimerCheckbox } from '@primer/react'
import { FormContext } from '../context/FormContext.js'
import { useOverride } from '../hooks/useOverride.js'

/**
 * Wrapped Primer Checkbox that integrates with StoryboardForm.
 *
 * Inside a <StoryboardForm>, values are buffered locally and only
 * written to session on form submit.
 *
 * Stores "true" / "false" as string values in the URL hash.
 */
export default function Checkbox({ name, onChange, checked: controlledChecked, ...props }) {
  const form = useContext(FormContext)
  const path = form?.prefix && name ? `${form.prefix}.${name}` : name
  const [sessionValue] = useOverride(path || '')

  const initialChecked = sessionValue === 'true' || sessionValue === true
  const [draft, setDraftState] = useState(initialChecked)

  const isConnected = !!form && !!name

  useEffect(() => {
    if (!isConnected) return
    return form.subscribe(name, (val) => setDraftState(val === 'true' || val === true))
  }, [isConnected, form, name])

  useEffect(() => {
    if (isConnected && sessionValue != null) {
      const val = sessionValue === 'true' || sessionValue === true
      setDraftState(val)
      form.setDraft(name, val ? 'true' : 'false')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    if (isConnected) {
      setDraftState(e.target.checked)
      form.setDraft(name, e.target.checked ? 'true' : 'false')
    }
    if (onChange) onChange(e)
  }

  const resolvedChecked = isConnected ? draft : controlledChecked

  return (
    <PrimerCheckbox
      name={name}
      checked={resolvedChecked}
      onChange={handleChange}
      {...props}
    />
  )
}
