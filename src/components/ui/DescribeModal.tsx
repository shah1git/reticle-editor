import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import styles from './DescribeModal.module.css'

interface Props {
  text: string
  onClose: () => void
}

export default function DescribeModal({ text, onClose }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{t('describe.title')}</span>
        </div>
        <div className={styles.body}>
          <pre className={styles.text}>{text}</pre>
        </div>
        <div className={styles.footer}>
          <button className={styles.btnAccent} onClick={handleCopy}>
            {copied ? t('describe.copied') : t('describe.copy')}
          </button>
          <button className={styles.btn} onClick={onClose}>
            {t('describe.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
