/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react'
import { TextInput as PrimerTextInput } from '@primer/react'
import { FormContext } from '../context/FormContext.js'
import { useSession } from '../hooks/useSession.js'

/**
 * Wrapped Primer TextInput that integrates with StoryboardForm.
 *
 * Inside a <StoryboardForm>, values are buffered locally and only
 * written to session on form submit. Session values are used as
 * initial defaults.
 *
 * Outside a form, behaves as a normal controlled Primer TextInput.
 */
export default function TextInput({ name, onChange, value: controlledValue, ...props }) {
  const form = useContext(FormContext)
  const path = form?.prefix && name ? `${form.prefix}.${name}` : name
  const [sessionValue] = useSession(path || '')

  // Local draft state, initialised from session/scene default
  const [draft, setDraftState] = useState(sessionValue ?? '')

  const isConnected = !!form && !!name

  // Subscribe to form context draft updates (e.g. external resets)
  useEffect(() => {
    if (!isConnected) return
    return form.subscribe(name, (val) => setDraftState(val))
  }, [isConnected, form, name])

  // Sync initial session value into draft on mount
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
    <PrimerTextInput
      name={name}
      value={resolvedValue}
      onChange={handleChange}
      {...props}
    />
  )
}
