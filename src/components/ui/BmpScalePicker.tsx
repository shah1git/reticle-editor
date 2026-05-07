import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import styles from './BmpScalePicker.module.css'

interface Props {
  onPick: (magnification: number) => void
  onClose: () => void
}

const SCALES = [1, 2, 3, 4, 5, 6, 7, 8] as const

export default function BmpScalePicker({ onPick, onClose }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{t('bmpPicker.title')}</div>
          <div className={styles.hint}>{t('bmpPicker.hint')}</div>
        </div>
        <div className={styles.body}>
          {SCALES.map((k) => (
            <button
              key={k}
              className={styles.scaleBtn}
              onClick={() => onPick(k)}
            >
              ×{k}
            </button>
          ))}
        </div>
        <div className={styles.footer}>
          <button className={styles.btn} onClick={onClose}>
            {t('bmpPicker.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
