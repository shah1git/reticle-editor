import React, { useMemo, useCallback } from 'react'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { RasterMark } from '../../types/rasterization'
import type { DotHoverInfo } from '../../types/dotTooltip'
import { rasterize } from '../../math/rasterization'
import { snapToPixel } from '../../math/optics'
import { errorToColor } from '../../math/errorColor'

interface Props {
  reticle: Reticle
  ppm: PixelsPerMrad
  cx: number
  cy: number
  zoom: number
  onDotHover?: (info: DotHoverInfo | null) => void
}

type Dir = 'up' | 'down' | 'left' | 'right'

interface WingRenderData {
  dir: Dir
  marks: RasterMark[]
  axisPpm: number
  gapMrad: number
  dx: number
  dy: number
  dotRadiusScreen: number
}

export default function ReticleRenderer({ reticle, ppm, cx, cy, zoom, onDotHover }: Props) {
  const { lines, wings } = useMemo(() => {
    const lines: React.JSX.Element[] = []
    const wings: WingRenderData[] = []
    const color = reticle.color

    // Center dot
    const dotPpmMin = Math.min(ppm.h, ppm.v)
    const dotRadiusMrad = snapToPixel(reticle.centerDot.radius, dotPpmMin)
    const dotRadiusScreen = dotRadiusMrad * zoom

    if (dotRadiusScreen > 0) {
      lines.push(
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

      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
      const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
      const axisPpm = dy !== 0 ? ppm.v : ppm.h
      const thicknessMrad = wing.lineThickness

      const gapMrad = dotRadiusMrad
      const startMrad = gapMrad
      const endMrad = gapMrad + wing.length

      const halfThickScreen = (thicknessMrad * zoom) / 2

      // Line as rect
      if (thicknessMrad > 0 && dx !== 0) {
        const x1 = cx + startMrad * dx * zoom
        const x2 = cx + endMrad * dx * zoom
        const xMin = Math.min(x1, x2)
        const w = Math.abs(x2 - x1)
        lines.push(
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
        const y1 = cy + startMrad * dy * zoom
        const y2 = cy + endMrad * dy * zoom
        const yMin = Math.min(y1, y2)
        const h = Math.abs(y2 - y1)
        lines.push(
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

      // Dots data
      if (wing.dots.enabled && wing.dots.spacing > 0) {
        const dotCount = Math.floor(wing.length / wing.dots.spacing)
        if (dotCount > 0) {
          const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, dotCount)
          const dotRadiusScreen = (wing.dotSize / 2) * (zoom / axisPpm)
          wings.push({ dir, marks, axisPpm, gapMrad, dx, dy, dotRadiusScreen })
        }
      }
    }

    return { lines, wings }
  }, [reticle, ppm, cx, cy, zoom])

  const handleDotEnter = useCallback((
    e: React.MouseEvent,
    dir: Dir,
    mark: RasterMark,
    marks: RasterMark[],
    allWings: WingRenderData[],
  ) => {
    if (!onDotHover) return

    // Next step
    const nextMark = marks.find(m => m.index === mark.index + 1)
    const nextStepPx = nextMark ? nextMark.stepPx : null

    // Cross-axis: find perpendicular wing with same index
    const isHoriz = dir === 'left' || dir === 'right'
    let crossAxisInfo: DotHoverInfo['crossAxisInfo'] = null
    for (const w of allWings) {
      const wIsHoriz = w.dir === 'left' || w.dir === 'right'
      if (wIsHoriz === isHoriz) continue // same axis, skip
      const crossMark = w.marks.find(m => m.index === mark.index)
      if (crossMark) {
        crossAxisInfo = {
          dir: w.dir,
          index: crossMark.index,
          distancePx: Math.abs(mark.actualPx - crossMark.actualPx),
        }
        break
      }
    }

    onDotHover({
      dir,
      index: mark.index,
      targetMrad: mark.targetMrad,
      targetPx: mark.targetPx,
      actualPx: mark.actualPx,
      actualMrad: mark.actualMrad,
      errorPx: mark.errorPx,
      errorMrad: mark.errorMrad,
      stepPx: mark.stepPx,
      nextStepPx,
      crossAxisInfo,
      screenX: e.clientX,
      screenY: e.clientY,
    })
  }, [onDotHover])

  const handleDotLeave = useCallback(() => {
    onDotHover?.(null)
  }, [onDotHover])

  return (
    <>
      {lines}
      {wings.map(w =>
        w.marks.map(mark => {
          const posMrad = w.gapMrad + mark.actualPx / w.axisPpm
          const dotCx = cx + posMrad * w.dx * zoom
          const dotCy = cy + posMrad * w.dy * zoom
          const visibleR = Math.max(w.dotRadiusScreen, 0.5)
          const hitR = Math.max(visibleR, 5)
          return (
            <g key={`dot-${w.dir}-${mark.index}`}>
              <circle
                cx={dotCx}
                cy={dotCy}
                r={visibleR}
                fill={errorToColor(mark.errorPx)}
              />
              <circle
                cx={dotCx}
                cy={dotCy}
                r={hitR}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => handleDotEnter(e, w.dir, mark, w.marks, wings)}
                onMouseLeave={handleDotLeave}
              />
            </g>
          )
        })
      )}
    </>
  )
}
