import styles from './ColorInput.module.css'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
}

export default function ColorInput({ label, value, onChange }: Props) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          type="color"
          className={styles.color}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="text"
          className={styles.hex}
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={7}
        />
      </div>
    </div>
  )
}
