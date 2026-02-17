/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react'
import { Checkbox as ReshapedCheckbox } from 'reshaped'
import { FormContext, useOverride } from '@storyboard/react'

/**
 * Wrapped Reshaped Checkbox that integrates with StoryboardForm.
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

  const handleChange = ({ value }) => {
    const checked = !!value
    if (isConnected) {
      setDraftState(checked)
      form.setDraft(name, checked ? 'true' : 'false')
    }
    if (onChange) onChange({ value })
  }

  const resolvedChecked = isConnected ? draft : controlledChecked

  return (
    <ReshapedCheckbox
      name={name}
      checked={resolvedChecked}
      onChange={handleChange}
      {...props}
    />
  )
}
