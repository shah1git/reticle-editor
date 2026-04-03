import { useState } from 'react'
import { TEST_OBJECTS, objectAngularSize } from '../../math/objects'
import styles from './TestObjectOverlay.module.css'

interface TestObjectState {
  enabled: boolean
  objectIdx: number
  distance: number
}

export function useTestObject() {
  const [state, setState] = useState<TestObjectState>({
    enabled: false,
    objectIdx: 0,
    distance: 200,
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
          <div className={styles.sliderRow}>
            <input
              type="range"
              min={10}
              max={1500}
              step={10}
              value={state.distance}
              onChange={e => setState({ ...state, distance: Number(e.target.value) })}
              className={styles.slider}
            />
            <span className={styles.distLabel}>{state.distance} м</span>
          </div>
          <div className={styles.info}>
            {heightMrad.toFixed(2)} × {widthMrad.toFixed(2)} MRAD
          </div>
        </>
      )}
    </div>
  )
}

interface SvgProps {
  state: TestObjectState
  zoom: number
  cx: number
  cy: number
}

export function TestObjectSvg({ state, zoom, cx, cy }: SvgProps) {
  if (!state.enabled) return null

  const obj = TEST_OBJECTS[state.objectIdx]
  const heightMrad = objectAngularSize(obj.height, state.distance)
  const widthMrad = objectAngularSize(obj.width, state.distance)

  return (
    <g>
      <rect
        x={cx - (widthMrad * zoom) / 2}
        y={cy - heightMrad * zoom}
        width={widthMrad * zoom}
        height={heightMrad * zoom}
        fill="#ff6600"
        opacity={0.2}
        stroke="#ff6600"
        strokeWidth={1}
        strokeDasharray="4 2"
      />
      <text
        x={cx + (widthMrad * zoom) / 2 + 6}
        y={cy - (heightMrad * zoom) / 2}
        fill="#ff6600"
        fontSize="9"
        fontFamily="JetBrains Mono"
        opacity={0.8}
      >
        {obj.name}
      </text>
      <text
        x={cx + (widthMrad * zoom) / 2 + 6}
        y={cy - (heightMrad * zoom) / 2 + 12}
        fill="#ff6600"
        fontSize="9"
        fontFamily="JetBrains Mono"
        opacity={0.6}
      >
        {state.distance} м — {heightMrad.toFixed(2)}×{widthMrad.toFixed(2)} MRAD
      </text>
    </g>
  )
}
