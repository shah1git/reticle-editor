import styles from './NumberInput.module.css'

interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  pxValue?: number | null  // pixel equivalent to show
  unit?: string
}

export default function NumberInput({
  label, value, onChange, min = 0, max = 99999, step = 0.01, pxValue, unit = 'MRAD',
}: Props) {
  const isWholePixel = pxValue != null && Math.abs(pxValue - Math.round(pxValue)) < 0.01
  const roundedPx = pxValue != null ? Math.round(pxValue) : null

  return (
    <div className={styles.row}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          type="number"
          className={styles.input}
          value={value}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {pxValue != null && (
        <span className={isWholePixel ? styles.pxGood : styles.pxWarn}>
          {roundedPx} px{!isWholePixel && pxValue != null && ` (${pxValue.toFixed(1)})`}
        </span>
      )}
    </div>
  )
}
