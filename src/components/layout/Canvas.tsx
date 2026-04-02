import { useRef, useState, useEffect, useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { calcPixelsPerMrad } from '../../math/optics'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import MradGrid from '../canvas/MradGrid'
import ReticleRenderer from '../canvas/ReticleRenderer'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  testObjectOverlay?: JSX.Element | null
}

export default function Canvas({ scope, reticle, testObjectOverlay }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const { transform, handlers } = useCanvasInteraction()
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cx = size.width / 2 + transform.panX
  const cy = size.height / 2 + transform.panY

  return (
    <div className={styles.canvas} ref={containerRef}>
      <svg
        width={size.width}
        height={size.height}
        className={styles.svg}
        {...handlers}
      >
        <MradGrid
          width={size.width}
          height={size.height}
          zoom={transform.zoom}
          panX={transform.panX}
          panY={transform.panY}
        />
        <ReticleRenderer
          reticle={reticle}
          ppm={ppm}
          cx={cx}
          cy={cy}
          zoom={transform.zoom}
        />
      </svg>
      {testObjectOverlay}
      <div className={styles.hint}>
        <span className={styles.zoomLabel}>Zoom: {transform.zoom.toFixed(1)} px/MRAD</span>
        <span className={styles.hintText}>Scroll to zoom · Alt+Drag or Middle-click to pan</span>
      </div>
    </div>
  )
}
