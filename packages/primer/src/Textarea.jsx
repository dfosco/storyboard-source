/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react'
import { Textarea as PrimerTextarea } from '@primer/react'
import { FormContext } from '@storyboard/react'
import { useOverride } from '@storyboard/react'

/**
 * Wrapped Primer Textarea that integrates with StoryboardForm.
 *
 * Inside a <StoryboardForm>, values are buffered locally and only
 * written to session on form submit.
 *
 * Outside a form, behaves as a normal controlled Primer Textarea.
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

  const handleChange = (e) => {
    if (isConnected) {
      setDraftState(e.target.value)
      form.setDraft(name, e.target.value)
    }
    if (onChange) onChange(e)
  }

  const resolvedValue = isConnected ? draft : controlledValue

  return (
    <PrimerTextarea
      name={name}
      value={resolvedValue}
      onChange={handleChange}
      {...props}
    />
  )
}
