import React, { useMemo } from 'react'

interface Props {
  width: number
  height: number
  /** Integer screen-px per firmware image-pixel. Grid is drawn only when ≥ minScale. */
  screenScale: number
  /** Center on screen, integer screen-px. */
  cx: number
  cy: number
  /** Hide the grid below this scale to avoid moiré. */
  minScale?: number
}

export default function PixelGrid({ width, height, screenScale, cx, cy, minScale = 4 }: Props) {
  const lines = useMemo(() => {
    if (screenScale < minScale) return null
    const result: React.JSX.Element[] = []

    // Vertical lines at every firmware-image-pixel column boundary.
    // The column boundaries on screen are at cx + k * screenScale for integer k.
    // Find the first boundary ≥ 0 and walk to width.
    const firstX = cx % screenScale
    for (let x = firstX; x <= width; x += screenScale) {
      const ix = Math.round(x) + 0.5  // half-pixel for crisp 1px stroke at integer screen position
      result.push(
        <line
          key={`pgv${x}`}
          x1={ix} y1={0} x2={ix} y2={height}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={0.06}
        />
      )
    }
    const firstY = cy % screenScale
    for (let y = firstY; y <= height; y += screenScale) {
      const iy = Math.round(y) + 0.5
      result.push(
        <line
          key={`pgh${y}`}
          x1={0} y1={iy} x2={width} y2={iy}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={0.06}
        />
      )
    }
    return result
  }, [width, height, screenScale, cx, cy, minScale])

  if (!lines) return null
  return <>{lines}</>
}
