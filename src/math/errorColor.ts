export function errorToColor(errorPx: number): string {
  const absErr = Math.abs(errorPx)
  if (absErr < 0.001) return '#00ff88'

  const t = Math.min(Math.sqrt(absErr / 0.5), 1.0)

  let r: number, g: number, b: number
  if (t <= 0.5) {
    const s = t / 0.5
    r = Math.round(s * 221)
    g = Math.round(255 - s * (255 - 204))
    b = Math.round(136 - s * 136)
  } else {
    const s = (t - 0.5) / 0.5
    r = Math.round(221 + s * (255 - 221))
    g = Math.round(204 - s * (204 - 51))
    b = Math.round(s * 68)
  }
  return `rgb(${r},${g},${b})`
}
