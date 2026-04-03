import { useState, useEffect } from 'react'
import styles from './NumberInput.module.css'

interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  pxValue?: number | null
  unit?: string
  hint?: string
  snapFn?: (v: number) => number
}

export default function NumberInput({
  label, value, onChange, min, max, step = 0.01, defaultValue, pxValue, unit = 'MRAD', hint, snapFn,
}: Props) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setText(raw)
    const v = parseFloat(raw)
    if (!isNaN(v)) onChange(v)
  }

  const handleBlur = () => {
    setFocused(false)
    let v = parseFloat(text)
    if (isNaN(v) || text.trim() === '') v = defaultValue ?? min ?? 0
    if (min != null && v < min) v = min
    if (max != null && v > max) v = max
    if (snapFn) v = snapFn(v)
    onChange(v)
    setText(String(v))
  }

  const isWholePixel = pxValue != null && Math.abs(pxValue - Math.round(pxValue)) < 0.01
  const roundedPx = pxValue != null ? Math.round(pxValue) : null

  return (
    <div className={styles.field}>
      <div className={styles.row}>
        <label className={styles.label}>{label}</label>
        {pxValue != null && (
          <span className={isWholePixel ? styles.pxGood : styles.pxWarn}>
            {roundedPx} пикс{!isWholePixel && pxValue != null && ` (${pxValue.toFixed(1)})`}
          </span>
        )}
      </div>
      <div className={styles.inputWrap}>
        <input
          type="number"
          className={styles.input}
          value={text}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          step={step}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  )
}
