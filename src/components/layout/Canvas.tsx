import { useRef, useState, useEffect, useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { calcPixelsPerMrad } from '../../math/optics'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import MradGrid from '../canvas/MradGrid'
import ReticleRenderer from '../canvas/ReticleRenderer'
import { useTestObject, TestObjectControls, TestObjectSvg } from '../canvas/TestObjectOverlay'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

export default function Canvas({ scope, reticle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const { transform, handlers } = useCanvasInteraction()
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const testObj = useTestObject()

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
        <TestObjectSvg
          state={testObj.state}
          setState={testObj.setState}
          zoom={transform.zoom}
          cx={cx}
          cy={cy}
        />
        <ReticleRenderer
          reticle={reticle}
          ppm={ppm}
          cx={cx}
          cy={cy}
          zoom={transform.zoom}
        />
      </svg>
      <TestObjectControls state={testObj.state} setState={testObj.setState} />
      <div className={styles.hint}>
        <span className={styles.zoomLabel}>Масштаб: {transform.zoom.toFixed(1)} пикс/MRAD</span>
        <span className={styles.hintText}>Alt+Перемещение: сдвиг · Прокрутка: масштаб · Ctrl+S: сохранить</span>
      </div>
    </div>
  )
}
