import { useEffect } from 'react'

/**
 * Bind a callback to the Escape key for the lifetime of the component.
 * Used by modals/overlays to close on Esc without each one re-implementing
 * the same useEffect-with-keydown-listener boilerplate.
 */
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onEscape])
}
