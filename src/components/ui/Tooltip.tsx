import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.css'

interface Props {
  text: string
  align?: 'center' | 'left'
}

export default function Tooltip({ text, align = 'center' }: Props) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<React.CSSProperties>({})

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const top = rect.bottom + 6

    if (align === 'left') {
      setPos({ top, right: window.innerWidth - rect.right, transform: 'none' })
      return
    }

    const centerX = rect.left + rect.width / 2
    setPos({ top, left: centerX, transform: 'translateX(-50%)' })

    requestAnimationFrame(() => {
      if (!popupRef.current) return
      const pr = popupRef.current.getBoundingClientRect()
      if (pr.left < 8) {
        setPos({ top, left: 8, transform: 'none' })
      } else if (pr.right > window.innerWidth - 8) {
        setPos({ top, left: 'auto', right: 8, transform: 'none' })
      }
    })
  }, [align])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || popupRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={styles.wrap}>
      <button
        ref={btnRef}
        className={styles.icon}
        onClick={() => { if (!open) updatePosition(); setOpen(!open) }}
        onMouseEnter={() => { updatePosition(); setOpen(true) }}
        onMouseLeave={() => setOpen(false)}
        type="button"
      >
        ?
      </button>
      {open && createPortal(
        <div ref={popupRef} className={styles.popup} style={{ position: 'fixed', ...pos }}>
          {text}
        </div>,
        document.body
      )}
    </div>
  )
}
