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
import PixelGrid from '../canvas/PixelGrid'
import ReferenceCircle from '../canvas/ReferenceCircle'
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

const MIN_SCALE = 1
const MAX_SCALE = 32

export default function Canvas({ scope, reticle, ppm, magnification, setMagnification }: Props) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [sizeReady, setSizeReady] = useState(false)
  const [pixelGridOn, setPixelGridOn] = useState(true)
  const [refCircleOn, setRefCircleOn] = useState(false)

  // Use ppm.h as the canvas axis ppm. For square-pixel scopes (the typical
  // case) ppm.h == ppm.v. For non-square pixels we accept a small distortion
  // along Y rather than splitting the canvas into two scales.
  const axisPpm = Math.max(0.0001, ppm.h)

  const snapZoom = useCallback((z: number) => {
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(z / axisPpm)))
    return scale * axisPpm
  }, [axisPpm])

  const { transform, handlers, setTransform } = useCanvasInteraction({ snapZoom })
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

  const fitScale = useCallback((effFov: { h: number; v: number }, sz: { width: number; height: number }) => {
    if (effFov.h <= 0 || effFov.v <= 0) return MIN_SCALE
    const zoomH = sz.width / effFov.h
    const zoomV = sz.height / effFov.v
    const zoomMrad = Math.min(zoomH, zoomV)
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.floor(zoomMrad / axisPpm)))
  }, [axisPpm])

  // Auto-fit when FOV changes (scope params or magnification)
  const lastFovKey = useRef('')
  useEffect(() => {
    if (!sizeReady) return
    const key = `${effectiveFov.h}:${effectiveFov.v}:${axisPpm}`
    if (lastFovKey.current === key) return
    lastFovKey.current = key
    const scale = fitScale(effectiveFov, size)
    setTransform({ zoom: scale * axisPpm, panX: 0, panY: 0 })
  }, [sizeReady, effectiveFov, size, setTransform, axisPpm, fitScale])

  const pixelScale = Math.max(MIN_SCALE, Math.round(transform.zoom / axisPpm))
  const screenScale = pixelScale * magnification
  const cx = Math.round(size.width / 2 + transform.panX)
  const cy = Math.round(size.height / 2 + transform.panY)

  const visibleW = size.width / transform.zoom
  const visibleH = size.height / transform.zoom
  const fovPct = effectiveFov.h > 0 ? (visibleW / effectiveFov.h) * 100 : 0

  const handleFitFov = useCallback(() => {
    const scale = fitScale(effectiveFov, size)
    setTransform({ zoom: scale * axisPpm, panX: 0, panY: 0 })
  }, [size, effectiveFov, setTransform, axisPpm, fitScale])

  const handleReset = useCallback(() => {
    setTransform({ zoom: 4 * axisPpm, panX: 0, panY: 0 })
  }, [setTransform, axisPpm])

  const handleZoomIn = useCallback(() => {
    setTransform(prev => {
      const cur = Math.round(prev.zoom / axisPpm)
      const next = Math.min(MAX_SCALE, cur + 1)
      return { ...prev, zoom: next * axisPpm }
    })
  }, [setTransform, axisPpm])

  const handleZoomOut = useCallback(() => {
    setTransform(prev => {
      const cur = Math.round(prev.zoom / axisPpm)
      const next = Math.max(MIN_SCALE, cur - 1)
      return { ...prev, zoom: next * axisPpm }
    })
  }, [setTransform, axisPpm])

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
        {pixelGridOn && (
          <PixelGrid
            width={size.width}
            height={size.height}
            screenScale={screenScale}
            cx={cx}
            cy={cy}
          />
        )}
        <ReticleRenderer
          reticle={reticle}
          ppm={ppm}
          cx={cx}
          cy={cy}
          pixelScale={pixelScale}
          onDotHover={setDotHover}
          magnification={magnification}
          focalPlane={reticle.focalPlane}
        />
        {refCircleOn && (
          <ReferenceCircle cx={cx} cy={cy} radiusMrad={5} zoom={transform.zoom} />
        )}
      </svg>

      <div className={styles.scopeInfo}>
        <div className={styles.scopeName}>{scope.name}</div>
        {scope.type === 'digital' ? (
          <div>{scope.sensorResX}{'×'}{scope.sensorResY} {'→'} {scope.displayResX}{'×'}{scope.displayResY} | F{scope.lensFL} | {scope.pixelPitch}{'μ'}m</div>
        ) : (
          <div>{scope.displayResX}{'×'}{scope.displayResY} | FOV {scope.fovDegrees}{'°'}</div>
        )}
        <div>{t('scopePanel.oneMrad', { value: ppm.h.toFixed(1) })} {reticle.focalPlane.toUpperCase()} {magnification > 1 ? `${magnification}×` : ''}</div>
        <div>FOV: {effectiveFov.h.toFixed(0)} {'×'} {effectiveFov.v.toFixed(0)} MRAD</div>
        {isOptimal ? (
          <div className={styles.roundingLine}>{t('toolbar.rounding')} {t(strategyTransKeys[reticle.rasterization])} <span className={styles.roundingCheck}>{'✓'}</span></div>
        ) : (
          <>
            <div className={styles.roundingLine}>{t('toolbar.rounding')} {t(strategyTransKeys[reticle.rasterization])}</div>
            <div className={styles.roundingOptimal}>{t('toolbar.recommended')}: {t(strategyTransKeys[bestStrategy.best])} ({'±'}{bestStrategy.bestMaxError.toFixed(2)} {t('units.px')})</div>
          </>
        )}
        <div className={styles.legendRow}>
          <span className={styles.legendLabel}>0</span>
          <span className={styles.gradient} />
          <span className={styles.legendLabel}>{'±'}0.5{t('units.px')}</span>
        </div>
      </div>

      {dotHover && <DotTooltip info={dotHover} />}

      <StrategyComparison ppm={ppm} reticle={reticle} />

      <div className={styles.hint}>
        <span className={styles.zoomLabel}>
          {pixelScale}{'×'} {t('canvas.pixelScaleSuffix', { ppm: transform.zoom.toFixed(0) })} {'·'} {visibleW.toFixed(1)} {'×'} {visibleH.toFixed(1)} / {effectiveFov.h.toFixed(0)} {'×'} {effectiveFov.v.toFixed(0)} MRAD ({fovPct.toFixed(0)}%)
        </span>
        <label className={styles.gridToggle}>
          <input type="checkbox" checked={pixelGridOn} onChange={e => setPixelGridOn(e.target.checked)} />
          {t('canvas.pixelGrid')}
        </label>
        <label className={styles.gridToggle}>
          <input type="checkbox" checked={refCircleOn} onChange={e => setRefCircleOn(e.target.checked)} />
          {t('canvas.refCircle')}
        </label>
      </div>
      <div className={styles.controls}>
        <div className={styles.magBtns}>
          {MAG_PRESETS.map(m => (
            <button
              key={m}
              className={`${styles.magBtn} ${magnification === m ? styles.magBtnActive : ''}`}
              onClick={() => setMagnification(m)}
            >
              {m}{'×'}
            </button>
          ))}
        </div>
        <div className={styles.zoomControls}>
          <button className={styles.ctrlBtn} onClick={handleZoomIn}>+</button>
          <button className={styles.ctrlBtn} onClick={handleZoomOut}>{'−'}</button>
        </div>
        <div className={styles.panControls}>
          <button className={styles.ctrlBtn} onClick={() => handlePan(0, 80)}>{'↑'}</button>
          <div className={styles.panRow}>
            <button className={styles.ctrlBtn} onClick={() => handlePan(80, 0)}>{'←'}</button>
            <button className={styles.ctrlBtn} onClick={handleCenter}>{'⊙'}</button>
            <button className={styles.ctrlBtn} onClick={() => handlePan(-80, 0)}>{'→'}</button>
          </div>
          <button className={styles.ctrlBtn} onClick={() => handlePan(0, -80)}>{'↓'}</button>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.fitBtn} onClick={handleReset}>Reset</button>
          <button className={styles.fitBtn} onClick={handleFitFov}>FOV</button>
        </div>
      </div>
    </div>
  )
}
