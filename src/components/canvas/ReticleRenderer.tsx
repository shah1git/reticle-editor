import React, { useMemo, useCallback } from 'react'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { RasterMark } from '../../types/rasterization'
import type { DotHoverInfo } from '../../types/dotTooltip'
import { rasterize, effectiveDotCount } from '../../math/rasterization'
import { centerMarkPixels, centerMarkHalfExtent, wingDotPixels, referenceCirclePixels } from '../../math/shapes'
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

    // Pixel-paint mode: render only the user's hand-drawn pixels.
    if (reticle.mode === 'pixels') {
      for (const [i, [dx, dy]] of reticle.customPixels.entries()) {
        rects.push(
          <rect
            key={`pixel-${i}`}
            x={cx + dx * screenScale}
            y={cy + dy * screenScale}
            width={screenScale}
            height={screenScale}
            fill={color}
            shapeRendering="crispEdges"
          />
        )
      }
      return { rects, wings }
    }

    // Center mark — fixed 4×4 (or other future variants), pixel-perfect.
    const centerPixels = centerMarkPixels(reticle.centerDot.kind)
    for (const [i, p] of centerPixels.entries()) {
      rects.push(
        <rect
          key={`center-${i}`}
          x={cx + p.x * screenScale}
          y={cy + p.y * screenScale}
          width={p.w * screenScale}
          height={p.h * screenScale}
          fill={color}
          shapeRendering="crispEdges"
        />
      )
    }

    // Reference ring — same colour as the rest of the reticle, rasterised as
    // firmware pixels so the canvas preview matches the BMP/PNG export.
    if (reticle.refCircle.enabled && reticle.refCircle.diameterMrad > 0) {
      const radiusFwPx = (reticle.refCircle.diameterMrad / 2) * ppm.h
      const ringPixels = referenceCirclePixels(radiusFwPx)
      for (const [i, p] of ringPixels.entries()) {
        rects.push(
          <rect
            key={`ring-${i}`}
            x={cx + p.x * screenScale}
            y={cy + p.y * screenScale}
            width={p.w * screenScale}
            height={p.h * screenScale}
            fill={color}
            shapeRendering="crispEdges"
          />
        )
      }
    }
    // Gap from center to inner edge of wing line, in firmware-image-px.
    const gapPxBase = centerMarkHalfExtent(reticle.centerDot.kind)

    // Wings
    const dirs: Dir[] = ['up', 'down', 'left', 'right']
    for (const dir of dirs) {
      const wing = reticle.wings[dir]
      const dotCount = effectiveDotCount(wing)
      if (dotCount <= 0) continue

      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
      const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
      const effectiveAxisPpm = dy !== 0 ? ppm.v : ppm.h

      // Marks: rasterize at the effective ppm. actualPx in effective image-pixels.
      const marks = rasterize(reticle.rasterization, wing.dots.spacing, effectiveAxisPpm, dotCount)
      wings.push({ dir, marks, axisPpm: effectiveAxisPpm, gapPx: gapPxBase, dx, dy })
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
      {wings.map(w => {
        const dotKind = reticle.wings[w.dir].dots.kind
        const axisAlong: 'h' | 'v' = (w.dir === 'left' || w.dir === 'right') ? 'h' : 'v'
        const pixels = wingDotPixels(dotKind, axisAlong)
        return w.marks.map(mark => {
          // mark.actualPx is in effective-image-pixels → screen via pixelScale.
          // Gap is in firmware-image-pixels → screen via screenScale.
          const gapScreen = w.gapPx * screenScale
          const screenAnchorX = cx + (gapScreen + mark.actualPx * pixelScale) * w.dx
          const screenAnchorY = cy + (gapScreen + mark.actualPx * pixelScale) * w.dy
          const fill = errorToColor(mark.errorPx)
          return (
            <g key={`dot-${w.dir}-${mark.index}`}>
              {pixels.map((p, i) => (
                <rect
                  key={i}
                  x={screenAnchorX + p.x * screenScale}
                  y={screenAnchorY + p.y * screenScale}
                  width={p.w * screenScale}
                  height={p.h * screenScale}
                  fill={fill}
                  shapeRendering="crispEdges"
                />
              ))}
              <circle
                cx={screenAnchorX}
                cy={screenAnchorY}
                r={Math.max(screenScale * 2, 6)}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => handleDotEnter(e, w.dir, mark, w.marks, wings)}
                onMouseLeave={handleDotLeave}
              />
            </g>
          )
        })
      })}
    </>
  )
}
