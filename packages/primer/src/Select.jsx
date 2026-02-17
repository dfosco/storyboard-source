/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react'
import { Select as PrimerSelect } from '@primer/react'
import { FormContext } from '@storyboard/react'
import { useOverride } from '@storyboard/react'

/**
 * Wrapped Primer Select that integrates with StoryboardForm.
 *
 * Inside a <StoryboardForm>, values are buffered locally and only
 * written to session on form submit.
 *
 * Outside a form, behaves as a normal controlled Primer Select.
 */
export default function Select({ name, onChange, value: controlledValue, children, ...props }) {
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
    <PrimerSelect
      name={name}
      value={resolvedValue}
      onChange={handleChange}
      {...props}
    >
      {children}
    </PrimerSelect>
  )
}

// Forward Primer's static sub-components (e.g. Select.Option)
Select.Option = PrimerSelect.Option
