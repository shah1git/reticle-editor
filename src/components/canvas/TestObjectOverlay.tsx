import { useState, useRef } from 'react'
import { TEST_OBJECTS, objectAngularSize } from '../../math/objects'
import styles from './TestObjectOverlay.module.css'

interface TestObjectState {
  enabled: boolean
  objectIdx: number
  distance: number
  offsetX: number
  offsetY: number
}

export function useTestObject() {
  const [state, setState] = useState<TestObjectState>({
    enabled: false,
    objectIdx: 0,
    distance: 200,
    offsetX: 0,
    offsetY: 0,
  })
  return { state, setState }
}

interface ControlsProps {
  state: TestObjectState
  setState: (s: TestObjectState) => void
}

export function TestObjectControls({ state, setState }: ControlsProps) {
  const obj = TEST_OBJECTS[state.objectIdx]
  const heightMrad = objectAngularSize(obj.height, state.distance)
  const widthMrad = objectAngularSize(obj.width, state.distance)
  const hasOffset = state.offsetX !== 0 || state.offsetY !== 0

  return (
    <div className={styles.controls}>
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={e => setState({ ...state, enabled: e.target.checked })}
          className={styles.checkbox}
        />
        <span className={styles.checkLabel}>ТЕСТОВЫЙ ОБЪЕКТ</span>
      </label>
      {state.enabled && (
        <>
          <select
            className={styles.select}
            value={state.objectIdx}
            onChange={e => setState({ ...state, objectIdx: Number(e.target.value) })}
          >
            {TEST_OBJECTS.map((o, i) => (
              <option key={i} value={i}>{o.name}</option>
            ))}
          </select>
          <div className={styles.distRow}>
            <span className={styles.distLabelText}>Дистанция</span>
          </div>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min={1}
              max={3000}
              step={1}
              value={state.distance}
              onChange={e => setState({ ...state, distance: Number(e.target.value) })}
              className={styles.slider}
            />
            <input
              type="number"
              className={styles.distInput}
              value={state.distance}
              min={1}
              max={3000}
              onChange={e => {
                const v = Number(e.target.value)
                if (!isNaN(v)) setState({ ...state, distance: Math.max(1, Math.min(3000, v)) })
              }}
            />
            <span className={styles.distUnit}>м</span>
          </div>
          <div className={styles.info}>
            {heightMrad.toFixed(2)} × {widthMrad.toFixed(2)} MRAD
          </div>
          {hasOffset && (
            <div className={styles.offsetRow}>
              <span className={styles.offsetText}>
                {state.offsetX >= 0 ? '+' : ''}{state.offsetX.toFixed(1)} / {state.offsetY >= 0 ? '+' : ''}{state.offsetY.toFixed(1)} MRAD
              </span>
              <button
                className={styles.resetBtn}
                onClick={() => setState({ ...state, offsetX: 0, offsetY: 0 })}
              >
                ⊕ В центр
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface SvgProps {
  state: TestObjectState
  setState: (s: TestObjectState) => void
  zoom: number
  cx: number
  cy: number
}

export function TestObjectSvg({ state, setState, zoom, cx, cy }: SvgProps) {
  const stateRef = useRef(state)
  stateRef.current = state

  if (!state.enabled) return null

  const obj = TEST_OBJECTS[state.objectIdx]
  const heightMrad = objectAngularSize(obj.height, state.distance)
  const widthMrad = objectAngularSize(obj.width, state.distance)

  const baseCx = cx + state.offsetX * zoom
  const baseCy = cy + state.offsetY * zoom

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.altKey) return
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startOffsetX = stateRef.current.offsetX
    const startOffsetY = stateRef.current.offsetY

    document.body.style.cursor = 'grabbing'

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setState({
        ...stateRef.current,
        offsetX: startOffsetX + dx / zoom,
        offsetY: startOffsetY + dy / zoom,
      })
    }

    const handleMouseUp = () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <g>
      <rect
        x={baseCx - (widthMrad * zoom) / 2}
        y={baseCy - heightMrad * zoom}
        width={widthMrad * zoom}
        height={heightMrad * zoom}
        fill="#ff8c42"
        opacity={0.2}
        stroke="#ff8c42"
        strokeWidth={1}
        strokeDasharray="4 2"
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
      />
      <text
        x={baseCx + (widthMrad * zoom) / 2 + 6}
        y={baseCy - (heightMrad * zoom) / 2}
        fill="#ff8c42"
        fontSize="11"
        fontFamily="JetBrains Mono"
        opacity={0.8}
      >
        {obj.name}
      </text>
      <text
        x={baseCx + (widthMrad * zoom) / 2 + 6}
        y={baseCy - (heightMrad * zoom) / 2 + 14}
        fill="#ff8c42"
        fontSize="11"
        fontFamily="JetBrains Mono"
        opacity={0.6}
      >
        {state.distance} м — {heightMrad.toFixed(2)}×{widthMrad.toFixed(2)} MRAD
      </text>
    </g>
  )
}
