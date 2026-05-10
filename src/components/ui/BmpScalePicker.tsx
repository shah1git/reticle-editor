import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import styles from './BmpScalePicker.module.css'

interface Props {
  onPick: (magnification: number) => void
  onClose: () => void
}

const SCALES = [1, 2, 3, 4, 5, 6, 7, 8] as const

export default function BmpScalePicker({ onPick, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <Modal onClose={onClose} className={styles.modal}>
      <div className={styles.header}>
        <div className={styles.title}>{t('bmpPicker.title')}</div>
        <div className={styles.hint}>{t('bmpPicker.hint')}</div>
      </div>
      <div className={styles.body}>
        {SCALES.map((k) => (
          <button key={k} className={styles.scaleBtn} onClick={() => onPick(k)}>
            ×{k}
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <button className={styles.btn} onClick={onClose}>
          {t('bmpPicker.cancel')}
        </button>
      </div>
    </Modal>
  )
}
