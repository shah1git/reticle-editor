import { useRef, useState, useEffect } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import MradGrid from '../canvas/MradGrid'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

export default function Canvas({ scope, reticle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const { transform, handlers } = useCanvasInteraction()

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
      </svg>
      <div className={styles.hint}>
        <span className={styles.zoomLabel}>Zoom: {transform.zoom.toFixed(1)} px/MRAD</span>
        <span className={styles.hintText}>Scroll to zoom · Alt+Drag or Middle-click to pan</span>
      </div>
    </div>
  )
}
