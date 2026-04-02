import styles from './SelectInput.module.css'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export default function SelectInput({ label, value, onChange, options }: Props) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>{label}</label>
      <select
        className={styles.select}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
