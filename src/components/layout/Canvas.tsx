import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { calcPixelsPerMrad, getFovMrad } from '../../math/optics'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import MradGrid from '../canvas/MradGrid'
import ReticleRenderer from '../canvas/ReticleRenderer'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

export default function Canvas({ scope, reticle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const { transform, handlers, setTransform } = useCanvasInteraction()
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const fov = useMemo(() => getFovMrad(scope), [scope])

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

  const visibleW = size.width / transform.zoom
  const visibleH = size.height / transform.zoom
  const fovPct = fov.h > 0 ? (visibleW / fov.h) * 100 : 0

  const handleFitFov = useCallback(() => {
    const zoomH = size.width / fov.h
    const zoomV = size.height / fov.v
    setTransform({ zoom: Math.min(zoomH, zoomV), panX: 0, panY: 0 })
  }, [size, fov, setTransform])

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
      <div className={styles.hint}>
        <span className={styles.zoomLabel}>
          Масштаб: {transform.zoom.toFixed(1)} пикс/MRAD · Видно: {visibleW.toFixed(1)} × {visibleH.toFixed(1)} из {fov.h.toFixed(0)} × {fov.v.toFixed(0)} MRAD ({fovPct.toFixed(0)}%)
        </span>
        <span className={styles.hintText}>Alt+Перемещение: сдвиг · Прокрутка: масштаб · Ctrl+S: сохранить</span>
      </div>
      <button className={styles.fitBtn} onClick={handleFitFov}>Весь FOV</button>
    </div>
  )
}
