import React, { useMemo } from 'react'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { rasterize } from '../../math/rasterization'
import { snapToPixel } from '../../math/optics'

interface Props {
  reticle: Reticle
  ppm: PixelsPerMrad
  cx: number   // center x in SVG coords
  cy: number   // center y in SVG coords
  zoom: number // screen px per MRAD
}

type Dir = 'up' | 'down' | 'left' | 'right'

export default function ReticleRenderer({ reticle, ppm, cx, cy, zoom }: Props) {
  const elements = useMemo(() => {
    const els: React.JSX.Element[] = []
    const color = reticle.color

    // Center dot — always circular, use min(ppm.h, ppm.v) for snap
    const dotPpmMin = Math.min(ppm.h, ppm.v)
    const dotRadiusMrad = snapToPixel(reticle.centerDot.radius, dotPpmMin)
    const dotRadiusScreen = dotRadiusMrad * zoom

    if (dotRadiusScreen > 0) {
      els.push(
        <circle
          key="center-dot"
          cx={cx}
          cy={cy}
          r={dotRadiusScreen}
          fill={color}
        />
      )
    }

    // Wings
    const dirs: Dir[] = ['up', 'down', 'left', 'right']
    for (const dir of dirs) {
      const wing = reticle.wings[dir]
      if (!wing.enabled || wing.length <= 0) continue

      // Wing direction vector
      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
      const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
      const axisPpm = dy !== 0 ? ppm.v : ppm.h
      const thicknessMrad = wing.lineThickness

      // Wing line: from gap (center dot edge) to length
      const gapMrad = dotRadiusMrad
      const startMrad = gapMrad
      const endMrad = gapMrad + wing.length

      const halfThickScreen = (thicknessMrad * zoom) / 2

      // Line as rect (skip if thickness is 0)
      if (thicknessMrad > 0 && dx !== 0) {
        // Horizontal wing
        const x1 = cx + startMrad * dx * zoom
        const x2 = cx + endMrad * dx * zoom
        const xMin = Math.min(x1, x2)
        const w = Math.abs(x2 - x1)
        els.push(
          <rect
            key={`wing-${dir}-line`}
            x={xMin}
            y={cy - halfThickScreen}
            width={w}
            height={halfThickScreen * 2}
            fill={color}
          />
        )
      } else if (thicknessMrad > 0) {
        // Vertical wing (up or down)
        const y1 = cy + startMrad * dy * zoom
        const y2 = cy + endMrad * dy * zoom
        const yMin = Math.min(y1, y2)
        const h = Math.abs(y2 - y1)
        els.push(
          <rect
            key={`wing-${dir}-line`}
            x={cx - halfThickScreen}
            y={yMin}
            width={halfThickScreen * 2}
            height={h}
            fill={color}
          />
        )
      }

      // Dots on wing
      if (wing.dots.enabled && wing.dots.spacing > 0) {
        const dotCount = Math.floor(wing.length / wing.dots.spacing)
        if (dotCount > 0) {
          const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, dotCount)
          // dotSize is in pixels; convert to screen coords via zoom
          const dotRadiusScreen = (wing.dotSize / 2) * (zoom / axisPpm)

          for (const mark of marks) {
            const posMrad = gapMrad + mark.actualPx / axisPpm
            const dotCx = cx + posMrad * dx * zoom
            const dotCy = cy + posMrad * dy * zoom
            els.push(
              <circle
                key={`dot-${dir}-${mark.index}`}
                cx={dotCx}
                cy={dotCy}
                r={Math.max(dotRadiusScreen, 0.5)}
                fill={color}
              />
            )
          }
        }
      }
    }

    return els
  }, [reticle, ppm, cx, cy, zoom])

  return <>{elements}</>
}
