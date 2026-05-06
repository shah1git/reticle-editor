import React, { useMemo, useCallback } from 'react'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { RasterMark } from '../../types/rasterization'
import type { DotHoverInfo } from '../../types/dotTooltip'
import { rasterize, effectiveDotCount } from '../../math/rasterization'
import { errorToColor } from '../../math/errorColor'

interface Props {
  reticle: Reticle
  /** Effective pixels per MRAD (already includes FFP magnification if applicable). */
  ppm: PixelsPerMrad
  /** Center on screen, integer screen-px (caller should round). */
  cx: number
  cy: number
  /**
   * Integer screen-pixels per *effective* image-pixel. Together with magnification
   * this fully determines all screen sizes:
   *   screen-px per firmware-image-px = pixelScale × magnification
   */
  pixelScale: number
  onDotHover?: (info: DotHoverInfo | null) => void
  magnification?: number
  focalPlane?: 'ffp' | 'sfp'
}

type Dir = 'up' | 'down' | 'left' | 'right'

interface WingRenderData {
  dir: Dir
  marks: RasterMark[]
  axisPpm: number
  /** Image-pixel offset (firmware) from center to inner edge of the wing line. */
  gapPx: number
  dx: number
  dy: number
  /** Wing dot diameter in firmware image-pixels (integer ≥ 0). */
  dotDiameterPx: number
}

export default function ReticleRenderer({ reticle, ppm, cx, cy, pixelScale, onDotHover, magnification = 1, focalPlane = 'ffp' }: Props) {
  const visualMag = focalPlane === 'ffp' ? magnification : 1
  // screenScale: screen-px per firmware-image-px. Always integer when both
  // pixelScale and visualMag are integers (we ensure this in Canvas.tsx).
  const screenScale = pixelScale * visualMag

  const { rects, wings } = useMemo(() => {
    const rects: React.JSX.Element[] = []
    const wings: WingRenderData[] = []
    const color = reticle.color

    // Firmware-scale ppm (without FFP magnification).
    const firmwarePpm = { h: ppm.h / visualMag, v: ppm.v / visualMag }
    const firmwarePpmMin = Math.min(firmwarePpm.h, firmwarePpm.v)

    // Center dot — diameter in firmware image-pixels, snapped to whole pixels.
    const centerDiameterPx = Math.max(0, Math.round(reticle.centerDot.diameter * firmwarePpmMin))
    const centerHalf = Math.floor(centerDiameterPx / 2)
    if (centerDiameterPx > 0) {
      rects.push(
        <rect
          key="center-dot"
          x={cx - centerHalf * screenScale}
          y={cy - centerHalf * screenScale}
          width={centerDiameterPx * screenScale}
          height={centerDiameterPx * screenScale}
          fill={color}
          shapeRendering="crispEdges"
        />
      )
    }
    // Gap from canvas center to inner edge of wing line, in firmware image-px.
    const gapPxBase = Math.ceil(centerDiameterPx / 2)

    // Wings
    const dirs: Dir[] = ['up', 'down', 'left', 'right']
    for (const dir of dirs) {
      const wing = reticle.wings[dir]
      if (!wing.enabled || wing.length <= 0) continue

      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
      const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
      const firmwareAxisPpm = dy !== 0 ? firmwarePpm.v : firmwarePpm.h
      const effectiveAxisPpm = dy !== 0 ? ppm.v : ppm.h

      const lineThicknessPx = Math.max(0, Math.round(wing.lineThickness * firmwareAxisPpm))
      const lengthPx = Math.max(0, Math.round(wing.length * firmwareAxisPpm))

      // Wing line as integer-pixel rectangle (firmware-px × screenScale)
      if (lineThicknessPx > 0 && lengthPx > 0) {
        const halfThick = Math.floor(lineThicknessPx / 2)
        if (dx !== 0) {
          const startImg = gapPxBase * dx
          const endImg = (gapPxBase + lengthPx) * dx
          const xMinImg = Math.min(startImg, endImg)
          const wImg = Math.abs(endImg - startImg)
          rects.push(
            <rect
              key={`wing-${dir}-line`}
              x={cx + xMinImg * screenScale}
              y={cy - halfThick * screenScale}
              width={wImg * screenScale}
              height={lineThicknessPx * screenScale}
              fill={color}
              shapeRendering="crispEdges"
            />
          )
        } else {
          const startImg = gapPxBase * dy
          const endImg = (gapPxBase + lengthPx) * dy
          const yMinImg = Math.min(startImg, endImg)
          const hImg = Math.abs(endImg - startImg)
          rects.push(
            <rect
              key={`wing-${dir}-line`}
              x={cx - halfThick * screenScale}
              y={cy + yMinImg * screenScale}
              width={lineThicknessPx * screenScale}
              height={hImg * screenScale}
              fill={color}
              shapeRendering="crispEdges"
            />
          )
        }
      }

      // Marks: rasterize at the effective ppm (FFP simulates accumulated error
      // at higher magnification). Their actualPx are in effective-image-pixels.
      const dotCount = effectiveDotCount(wing)
      if (dotCount > 0) {
        const marks = rasterize(reticle.rasterization, wing.dots.spacing, effectiveAxisPpm, dotCount)
        wings.push({ dir, marks, axisPpm: effectiveAxisPpm, gapPx: gapPxBase, dx, dy, dotDiameterPx: wing.dotSize })
      }
    }

    return { rects, wings }
  }, [reticle, ppm, cx, cy, screenScale, visualMag])

  const handleDotEnter = useCallback((
    e: React.MouseEvent,
    dir: Dir,
    mark: RasterMark,
    marks: RasterMark[],
    allWings: WingRenderData[],
  ) => {
    if (!onDotHover) return

    const nextMark = marks.find(m => m.index === mark.index + 1)
    const nextStepPx = nextMark ? nextMark.stepPx : null

    const isHoriz = dir === 'left' || dir === 'right'
    let crossAxisInfo: DotHoverInfo['crossAxisInfo'] = null
    for (const w of allWings) {
      const wIsHoriz = w.dir === 'left' || w.dir === 'right'
      if (wIsHoriz === isHoriz) continue
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
      {rects}
      {wings.map(w =>
        w.marks.map(mark => {
          // mark.actualPx is in effective-image-pixels → screen via pixelScale.
          // Gap is in firmware-image-pixels → screen via screenScale.
          const gapScreen = w.gapPx * screenScale
          const screenX = cx + (gapScreen + mark.actualPx * pixelScale) * w.dx
          const screenY = cy + (gapScreen + mark.actualPx * pixelScale) * w.dy
          const D = w.dotDiameterPx
          const dotScreen = D * screenScale
          const half = Math.floor(D / 2) * screenScale
          const visibleD = Math.max(dotScreen, 1)
          const hitR = Math.max(visibleD / 2, 5)
          return (
            <g key={`dot-${w.dir}-${mark.index}`}>
              <rect
                x={screenX - half}
                y={screenY - half}
                width={dotScreen}
                height={dotScreen}
                fill={errorToColor(mark.errorPx)}
                shapeRendering="crispEdges"
              />
              <circle
                cx={screenX}
                cy={screenY}
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
