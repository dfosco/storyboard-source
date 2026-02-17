/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react'
import { TextField } from 'reshaped'
import { FormContext, useOverride } from '@storyboard/react'

/**
 * Wrapped Reshaped TextField (multiline) that integrates with StoryboardForm.
 *
 * Inside a <StoryboardForm>, values are buffered locally and only
 * written to session on form submit.
 *
 * Outside a form, behaves as a normal controlled Reshaped TextField.
 */
export default function Textarea({ name, onChange, value: controlledValue, ...props }) {
  const form = useContext(FormContext)
  const path = form?.prefix && name ? `${form.prefix}.${name}` : name
  const [sessionValue] = useOverride(path || '')

  const [draft, setDraftState] = useState(sessionValue ?? '')

  const isConnected = !!form && !!name

  useEffect(() => {
    if (!isConnected) return
    return form.subscribe(name, (val) => setDraftState(val))
  }, [isConnected, form, name])

  useEffect(() => {
    if (isConnected && sessionValue != null) {
      setDraftState(sessionValue)
      form.setDraft(name, sessionValue)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = ({ value }) => {
    if (isConnected) {
      setDraftState(value)
      form.setDraft(name, value)
    }
    if (onChange) onChange({ value })
  }

  const resolvedValue = isConnected ? draft : controlledValue

  return (
    <TextField
      name={name}
      value={resolvedValue}
      onChange={handleChange}
      inputAttributes={{ rows: 3 }}
      {...props}
    />
  )
}
