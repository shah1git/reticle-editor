import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { calcPixelsPerMrad, getFovMrad } from '../../math/optics'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import MradGrid from '../canvas/MradGrid'
import ReticleRenderer from '../canvas/ReticleRenderer'
import StrategyComparison from '../table/StrategyComparison'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

export default function Canvas({ scope, reticle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [sizeReady, setSizeReady] = useState(false)
  const { transform, handlers, setTransform } = useCanvasInteraction()
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const fov = useMemo(() => getFovMrad(scope), [scope])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
      setSizeReady(true)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Auto-fit when FOV changes (scope params) or on initial measurement
  const lastFovKey = useRef('')
  useEffect(() => {
    if (!sizeReady) return
    const key = `${fov.h}:${fov.v}`
    if (lastFovKey.current === key) return
    lastFovKey.current = key
    const zoomH = size.width / fov.h
    const zoomV = size.height / fov.v
    setTransform({ zoom: Math.min(zoomH, zoomV), panX: 0, panY: 0 })
  }, [sizeReady, fov, size, setTransform])

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

  const handleReset = useCallback(() => {
    setTransform({ zoom: 30, panX: 0, panY: 0 })
  }, [setTransform])

  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, zoom: Math.min(200, prev.zoom * 1.1) }))
  }, [setTransform])

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, zoom: Math.max(2, prev.zoom / 1.1) }))
  }, [setTransform])

  const handlePan = useCallback((dx: number, dy: number) => {
    setTransform(prev => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }))
  }, [setTransform])

  const handleCenter = useCallback(() => {
    setTransform(prev => ({ ...prev, panX: 0, panY: 0 }))
  }, [setTransform])

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

      <div className={styles.scopeInfo}>
        <div className={styles.scopeName}>{scope.name}</div>
        {scope.type === 'digital' ? (
          <div>{scope.sensorResX}×{scope.sensorResY} → {scope.displayResX}×{scope.displayResY} | F{scope.lensFL} | {scope.pixelPitch}μm</div>
        ) : (
          <div>{scope.displayResX}×{scope.displayResY} | FOV {scope.fovDegrees}°</div>
        )}
        <div>1 MRAD = <span className={styles.ppmValue}>{ppm.h.toFixed(1)}</span> пикс</div>
        <div>FOV: {fov.h.toFixed(0)} × {fov.v.toFixed(0)} MRAD</div>
        <div className={styles.legendRow}>
          <span className={styles.legendLabel}>0</span>
          <span className={styles.gradient} />
          <span className={styles.legendLabel}>±0.5px</span>
        </div>
      </div>

      <StrategyComparison scope={scope} reticle={reticle} />

      <div className={styles.hint}>
        <span className={styles.zoomLabel}>
          Масштаб: {transform.zoom.toFixed(1)} пикс/MRAD · Видно: {visibleW.toFixed(1)} × {visibleH.toFixed(1)} из {fov.h.toFixed(0)} × {fov.v.toFixed(0)} MRAD ({fovPct.toFixed(0)}%)
        </span>
        <span className={styles.hintText}>Alt+Перемещение: сдвиг · Прокрутка: масштаб · Ctrl+S: сохранить</span>
      </div>
      <div className={styles.controls}>
        <div className={styles.zoomControls}>
          <button className={styles.ctrlBtn} onClick={handleZoomIn}>+</button>
          <button className={styles.ctrlBtn} onClick={handleZoomOut}>−</button>
        </div>
        <div className={styles.panControls}>
          <button className={styles.ctrlBtn} onClick={() => handlePan(0, 80)}>↑</button>
          <div className={styles.panRow}>
            <button className={styles.ctrlBtn} onClick={() => handlePan(80, 0)}>←</button>
            <button className={styles.ctrlBtn} onClick={handleCenter}>⊙</button>
            <button className={styles.ctrlBtn} onClick={() => handlePan(-80, 0)}>→</button>
          </div>
          <button className={styles.ctrlBtn} onClick={() => handlePan(0, -80)}>↓</button>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.fitBtn} onClick={handleReset}>Сброс</button>
          <button className={styles.fitBtn} onClick={handleFitFov}>Весь FOV</button>
        </div>
      </div>
    </div>
  )
}
