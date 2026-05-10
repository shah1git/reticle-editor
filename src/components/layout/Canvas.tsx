import { useRef, useState, useEffect, useMemo, useCallback, type MouseEvent as ReactMouseEvent, type DragEvent as ReactDragEvent, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { DotHoverInfo } from '../../types/dotTooltip'
import type { PixelsPerMrad } from '../../math/optics'
import { getFovMrad } from '../../math/optics'
import { findBestStrategy } from '../../math/bestStrategy'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import { useFileLoader } from '../../hooks/useFileLoader'
import MradGrid from '../canvas/MradGrid'
import PixelGrid from '../canvas/PixelGrid'
import ReticleRenderer from '../canvas/ReticleRenderer'
import DotTooltip from '../canvas/DotTooltip'
import StrategyComparison from '../table/StrategyComparison'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  // Accept the standard React state setter so paint-mode drag strokes can
  // batch updates via the callback form without races between fast events.
  setReticle: Dispatch<SetStateAction<Reticle>>
  ppm: PixelsPerMrad
  magnification: number
  setMagnification: (m: number) => void
  loadedFileName: string | null
  setLoadedFileName: (n: string | null) => void
  loadedFileHandle: FileSystemFileHandle | null
  setLoadedFileHandle: (h: FileSystemFileHandle | null) => void
}

const strategyTransKeys: Record<string, string> = {
  independent: 'strategies.independent',
  fixed_step: 'strategies.fixedStep',
}

const MAG_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8]

const MIN_SCALE = 1
const MAX_SCALE = 32

export default function Canvas({
  scope, setScope, reticle, setReticle, ppm, magnification, setMagnification,
  setLoadedFileName, setLoadedFileHandle,
}: Props) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [sizeReady, setSizeReady] = useState(false)
  const [pixelGridOn, setPixelGridOn] = useState(true)
  const [paintOn, setPaintOn] = useState(false)

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

  // Paint state: while the left mouse is down in pixel mode, the first cell
  // touched decides whether we're adding or erasing for the rest of the
  // stroke (so dragging across already-lit pixels doesn't rapidly toggle).
  const strokeRef = useRef<{ kind: 'add' | 'remove'; touched: Set<string> } | null>(null)

  const pixelUnderMouse = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const el = containerRef.current
    if (!el || screenScale <= 0) return null
    const rect = el.getBoundingClientRect()
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const dx = Math.floor((sx - cx) / screenScale)
    const dy = Math.floor((sy - cy) / screenScale)
    return [dx, dy]
  }, [cx, cy, screenScale])

  const applyStrokeAt = useCallback((dx: number, dy: number) => {
    const stroke = strokeRef.current
    if (!stroke) return
    const key = `${dx},${dy}`
    if (stroke.touched.has(key)) return
    stroke.touched.add(key)
    setReticle(prev => {
      if (stroke.kind === 'add') {
        if (prev.customPixels.some(([px, py]) => px === dx && py === dy)) return prev
        return { ...prev, customPixels: [...prev.customPixels, [dx, dy]] }
      }
      const filtered = prev.customPixels.filter(([px, py]) => !(px === dx && py === dy))
      if (filtered.length === prev.customPixels.length) return prev
      return { ...prev, customPixels: filtered }
    })
  }, [setReticle])

  const handlePaintDown = useCallback((e: ReactMouseEvent<SVGSVGElement>) => {
    if (!paintOn) return
    if (e.button !== 0 || e.altKey) return  // pan stays on alt+left / middle button
    const cell = pixelUnderMouse(e.clientX, e.clientY)
    if (!cell) return
    const [dx, dy] = cell
    const exists = reticle.customPixels.some(([px, py]) => px === dx && py === dy)
    strokeRef.current = { kind: exists ? 'remove' : 'add', touched: new Set() }
    applyStrokeAt(dx, dy)
  }, [paintOn, reticle.customPixels, pixelUnderMouse, applyStrokeAt])

  const handlePaintMove = useCallback((e: ReactMouseEvent<SVGSVGElement>) => {
    if (!strokeRef.current) return
    const cell = pixelUnderMouse(e.clientX, e.clientY)
    if (!cell) return
    applyStrokeAt(cell[0], cell[1])
  }, [pixelUnderMouse, applyStrokeAt])

  const handlePaintUp = useCallback(() => {
    strokeRef.current = null
  }, [])

  const { acceptFile } = useFileLoader(setScope, setReticle, setLoadedFileName, setLoadedFileHandle)
  const [dragActive, setDragActive] = useState(false)
  const dragDepthRef = useRef(0)

  const handleDragEnter = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types || []).includes('Files')) return
    e.preventDefault()
    dragDepthRef.current += 1
    setDragActive(true)
  }, [])

  const handleDragOver = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types || []).includes('Files')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragActive(false)
  }, [])

  const handleDrop = useCallback(async (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragDepthRef.current = 0
    setDragActive(false)
    const items = e.dataTransfer.items
    let file: File | null = null
    let handle: FileSystemFileHandle | null = null
    if (items && items.length > 0) {
      const it = items[0]
      if (it.kind !== 'file') return
      type ItemWithHandle = DataTransferItem & { getAsFileSystemHandle?: () => Promise<FileSystemHandle | null> }
      const getHandle = (it as ItemWithHandle).getAsFileSystemHandle
      if (getHandle) {
        try {
          const h = await getHandle.call(it)
          if (h && h.kind === 'file') {
            handle = h as FileSystemFileHandle
            file = await handle.getFile()
          }
        } catch { /* fall through to getAsFile */ }
      }
      if (!file) file = it.getAsFile()
    } else {
      file = e.dataTransfer.files?.[0] ?? null
    }
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) {
      window.alert(t('canvas.dropOnlyJson'))
      return
    }
    acceptFile(file, handle)
  }, [acceptFile, t])

  const handleClearPixels = useCallback(() => {
    if (reticle.customPixels.length === 0) return
    const ok = window.confirm(t('paint.clearConfirm'))
    if (!ok) return
    setReticle(prev => ({ ...prev, customPixels: [] }))
  }, [reticle.customPixels.length, setReticle, t])

  return (
    <div
      className={`${styles.canvas} ${dragActive ? styles.canvasDragging : ''}`}
      ref={containerRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropMsg}>
            <div className={styles.dropIcon}>⤓</div>
            <div className={styles.dropTitle}>{t('canvas.dropTitle')}</div>
            <div className={styles.dropHint}>{t('canvas.dropHint')}</div>
          </div>
        </div>
      )}
      <svg
        width={size.width}
        height={size.height}
        className={styles.svg}
        {...handlers}
        onMouseDown={e => { handlers.onMouseDown(e); handlePaintDown(e) }}
        onMouseMove={e => { handlers.onMouseMove(e); handlePaintMove(e) }}
        onMouseUp={() => { handlers.onMouseUp(); handlePaintUp() }}
        onMouseLeave={() => { handlers.onMouseLeave(); handlePaintUp() }}
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
        />
      </svg>

      <div className={styles.scopeInfo}>
        <div className={styles.scopeName}>{scope.name}</div>
        {scope.type === 'digital' ? (
          <div>{scope.sensorResX}{'×'}{scope.sensorResY} {'→'} {scope.displayResX}{'×'}{scope.displayResY} | F{scope.lensFL} | {scope.pixelPitch}{'μ'}m</div>
        ) : (
          <div>{scope.displayResX}{'×'}{scope.displayResY} | FOV {scope.fovDegrees}{'°'}</div>
        )}
        <div>{t('scopePanel.oneMrad', { value: ppm.h.toFixed(1) })} {magnification > 1 ? `${magnification}×` : ''}</div>
        <div>FOV: {effectiveFov.h.toFixed(0)} {'×'} {effectiveFov.v.toFixed(0)} MRAD</div>
        <div className={styles.unitNote}>{t('canvas.mradUnit')}</div>
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
          <input
            type="checkbox"
            checked={reticle.refCircle.enabled}
            onChange={e => setReticle(prev => ({
              ...prev,
              refCircle: { ...prev.refCircle, enabled: e.target.checked },
            }))}
          />
          {t('canvas.refCircle')}
        </label>
        <label className={styles.gridToggle}>
          <input
            type="checkbox"
            checked={paintOn}
            onChange={e => setPaintOn(e.target.checked)}
          />
          {t('paint.toggle')}
        </label>
        {reticle.customPixels.length > 0 && (
          <button className={styles.paintBtn} onClick={handleClearPixels}>
            {t('paint.clearAll', { count: reticle.customPixels.length })}
          </button>
        )}
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
