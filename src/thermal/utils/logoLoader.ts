/**
 * Load the project logo SVG as an HTMLImageElement, cached across calls.
 * Returns null if loading fails (offline, blocked, etc.) so callers can
 * silently skip drawing the logo without breaking the export.
 */
let cached: HTMLImageElement | null = null
let pending: Promise<HTMLImageElement | null> | null = null

export function loadLogo(): Promise<HTMLImageElement | null> {
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  pending = new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image()
    img.onload = () => {
      cached = img
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = import.meta.env.BASE_URL + 'logo.svg'
  })
  return pending
}
