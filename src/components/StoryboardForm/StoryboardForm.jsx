import { useRef, useCallback } from 'react'
import { setParam, isHideMode, setShadow } from '@dfosco/storyboard/core'
import { FormContext } from '../FormContext/FormContext.jsx'

/**
 * A form wrapper that buffers input values locally and only
 * persists them to session (URL hash) on submit.
 *
 * The `data` prop sets the root path — child inputs with a `name` prop
 * will read/write to local draft state while typing, then flush to
 * `data.name` in the URL hash on form submission.
 *
 * @example
 * <StoryboardForm data="checkout">
 *   <FormControl>
 *     <FormControl.Label>Email</FormControl.Label>
 *     <TextInput name="email" />
 *   </FormControl>
 *   <Button type="submit">Save</Button>
 * </StoryboardForm>
 * // On submit: writes #checkout.email=... to URL hash
 */
export default function StoryboardForm({ data, onSubmit, children, ...props }) {
  const prefix = data || null
  const draftsRef = useRef({})
  const listenersRef = useRef({})

  const getDraft = useCallback((name) => draftsRef.current[name], [])

  const setDraft = useCallback((name, value) => {
    draftsRef.current[name] = value
    // Notify the field so it re-renders with the new draft value
    const listener = listenersRef.current[name]
    if (listener) listener(value)
  }, [])

  const subscribe = useCallback((name, listener) => {
    listenersRef.current[name] = listener
    return () => { delete listenersRef.current[name] }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Flush all draft values to session — hash in normal mode, shadow in hide mode
    if (prefix) {
      const write = isHideMode() ? setShadow : setParam
      for (const [name, value] of Object.entries(draftsRef.current)) {
        write(`${prefix}.${name}`, value)
      }
    }
    if (onSubmit) onSubmit(e)
  }

  const contextValue = { prefix, getDraft, setDraft, subscribe }

  return (
    <FormContext.Provider value={contextValue}>
      <form {...props} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormContext.Provider>
  )
}
