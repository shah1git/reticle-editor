import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { DotHoverInfo } from '../../types/dotTooltip'
import type { PixelsPerMrad } from '../../math/optics'
import { getFovMrad } from '../../math/optics'
import { findBestStrategy } from '../../math/bestStrategy'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import MradGrid from '../canvas/MradGrid'
import ReticleRenderer from '../canvas/ReticleRenderer'
import DotTooltip from '../canvas/DotTooltip'
import StrategyComparison from '../table/StrategyComparison'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  ppm: PixelsPerMrad
  magnification: number
  setMagnification: (m: number) => void
}

const strategyTransKeys: Record<string, string> = {
  independent: 'strategies.independent',
  fixed_step: 'strategies.fixedStep',
}

const MAG_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function Canvas({ scope, reticle, ppm, magnification, setMagnification }: Props) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [sizeReady, setSizeReady] = useState(false)
  const { transform, handlers, setTransform } = useCanvasInteraction()
  const fov = useMemo(() => getFovMrad(scope), [scope])
  const [dotHover, setDotHover] = useState<DotHoverInfo | null>(null)
  const bestStrategy = useMemo(() => findBestStrategy(reticle, ppm), [reticle, ppm])
  const isOptimal = bestStrategy.best === reticle.rasterization

  const effectiveFov = useMemo(() => ({
    h: fov.h / magnification,
    v: fov.v / magnification,
  }), [fov, magnification])

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

  // Auto-fit when FOV changes (scope params or magnification)
  const lastFovKey = useRef('')
  useEffect(() => {
    if (!sizeReady) return
    const key = `${effectiveFov.h}:${effectiveFov.v}`
    if (lastFovKey.current === key) return
    lastFovKey.current = key
    const zoomH = size.width / effectiveFov.h
    const zoomV = size.height / effectiveFov.v
    setTransform({ zoom: Math.min(zoomH, zoomV), panX: 0, panY: 0 })
  }, [sizeReady, effectiveFov, size, setTransform])

  const cx = size.width / 2 + transform.panX
  const cy = size.height / 2 + transform.panY

  const visibleW = size.width / transform.zoom
  const visibleH = size.height / transform.zoom
  const fovPct = effectiveFov.h > 0 ? (visibleW / effectiveFov.h) * 100 : 0

  const handleFitFov = useCallback(() => {
    const zoomH = size.width / effectiveFov.h
    const zoomV = size.height / effectiveFov.v
    setTransform({ zoom: Math.min(zoomH, zoomV), panX: 0, panY: 0 })
  }, [size, effectiveFov, setTransform])

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
          onDotHover={setDotHover}
          magnification={magnification}
          focalPlane={reticle.focalPlane}
        />
      </svg>

      <div className={styles.scopeInfo}>
        <div className={styles.scopeName}>{scope.name}</div>
        {scope.type === 'digital' ? (
          <div>{scope.sensorResX}{'\u00d7'}{scope.sensorResY} {'\u2192'} {scope.displayResX}{'\u00d7'}{scope.displayResY} | F{scope.lensFL} | {scope.pixelPitch}{'\u03bc'}m</div>
        ) : (
          <div>{scope.displayResX}{'\u00d7'}{scope.displayResY} | FOV {scope.fovDegrees}{'\u00b0'}</div>
        )}
        <div>{t('scopePanel.oneMrad', { value: ppm.h.toFixed(1) })} {reticle.focalPlane.toUpperCase()} {magnification > 1 ? `${magnification}\u00d7` : ''}</div>
        <div>FOV: {effectiveFov.h.toFixed(0)} {'\u00d7'} {effectiveFov.v.toFixed(0)} MRAD</div>
        {isOptimal ? (
          <div className={styles.roundingLine}>{t('toolbar.rounding')} {t(strategyTransKeys[reticle.rasterization])} <span className={styles.roundingCheck}>{'\u2713'}</span></div>
        ) : (
          <>
            <div className={styles.roundingLine}>{t('toolbar.rounding')} {t(strategyTransKeys[reticle.rasterization])}</div>
            <div className={styles.roundingOptimal}>{t('toolbar.recommended')}: {t(strategyTransKeys[bestStrategy.best])} ({'\u00b1'}{bestStrategy.bestMaxError.toFixed(2)} {t('units.px')})</div>
          </>
        )}
        <div className={styles.legendRow}>
          <span className={styles.legendLabel}>0</span>
          <span className={styles.gradient} />
          <span className={styles.legendLabel}>{'\u00b1'}0.5{t('units.px')}</span>
        </div>
      </div>

      {dotHover && <DotTooltip info={dotHover} />}

      <StrategyComparison ppm={ppm} reticle={reticle} />

      <div className={styles.hint}>
        <span className={styles.zoomLabel}>
          {transform.zoom.toFixed(1)} {t('units.px')}/MRAD {'\u00b7'} {visibleW.toFixed(1)} {'\u00d7'} {visibleH.toFixed(1)} / {effectiveFov.h.toFixed(0)} {'\u00d7'} {effectiveFov.v.toFixed(0)} MRAD ({fovPct.toFixed(0)}%)
        </span>
      </div>
      <div className={styles.controls}>
        <div className={styles.magBtns}>
          {MAG_PRESETS.map(m => (
            <button
              key={m}
              className={`${styles.magBtn} ${magnification === m ? styles.magBtnActive : ''}`}
              onClick={() => setMagnification(m)}
            >
              {m}{'\u00d7'}
            </button>
          ))}
        </div>
        <div className={styles.zoomControls}>
          <button className={styles.ctrlBtn} onClick={handleZoomIn}>+</button>
          <button className={styles.ctrlBtn} onClick={handleZoomOut}>{'\u2212'}</button>
        </div>
        <div className={styles.panControls}>
          <button className={styles.ctrlBtn} onClick={() => handlePan(0, 80)}>{'\u2191'}</button>
          <div className={styles.panRow}>
            <button className={styles.ctrlBtn} onClick={() => handlePan(80, 0)}>{'\u2190'}</button>
            <button className={styles.ctrlBtn} onClick={handleCenter}>{'\u2299'}</button>
            <button className={styles.ctrlBtn} onClick={() => handlePan(-80, 0)}>{'\u2192'}</button>
          </div>
          <button className={styles.ctrlBtn} onClick={() => handlePan(0, -80)}>{'\u2193'}</button>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.fitBtn} onClick={handleReset}>Reset</button>
          <button className={styles.fitBtn} onClick={handleFitFov}>FOV</button>
        </div>
      </div>
    </div>
  )
}
