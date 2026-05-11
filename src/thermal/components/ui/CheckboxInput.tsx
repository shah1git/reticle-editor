import styles from './CheckboxInput.module.css'

interface Props {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

export default function CheckboxInput({ label, checked, onChange }: Props) {
  return (
    <label className={styles.row}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className={styles.label}>{label}</span>
    </label>
  )
}
