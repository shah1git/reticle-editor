import { useState, useRef, useEffect } from 'react'
import styles from './Tooltip.module.css'

interface Props {
  text: string
}

export default function Tooltip({ text }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.icon}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        type="button"
      >
        ?
      </button>
      {open && (
        <div className={styles.popup}>
          {text}
        </div>
      )}
    </div>
  )
}
