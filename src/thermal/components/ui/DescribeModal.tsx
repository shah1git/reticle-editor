import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../../../shared/i18n'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { describeReticle } from '../../utils/describeReticle'
import styles from './DescribeModal.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  ppm: PixelsPerMrad
  magnification: number
  onClose: () => void
}

const LANGS = ['ru', 'en', 'zh'] as const
type Lang = typeof LANGS[number]

const NATIVE_NAME: Record<Lang, string> = {
  ru: 'Русский',
  en: 'English',
  zh: '中文',
}

export default function DescribeModal({ scope, reticle, ppm, magnification, onClose }: Props) {
  const { t } = useTranslation()
  const [viewLang, setViewLang] = useState<Lang>(() => {
    const cur = (i18n.language || 'en').split('-')[0]
    return (LANGS as readonly string[]).includes(cur) ? (cur as Lang) : 'en'
  })
  const [copied, setCopied] = useState(false)

  const text = useMemo(() => {
    const localT = i18n.getFixedT(viewLang)
    return describeReticle(scope, reticle, ppm, magnification, localT)
  }, [viewLang, scope, reticle, ppm, magnification])

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

  const otherLangs = LANGS.filter((l) => l !== viewLang)

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
          {otherLangs.map((lng) => (
            <button
              key={lng}
              className={styles.btn}
              onClick={() => setViewLang(lng)}
            >
              {t('describe.translateTo', { lang: NATIVE_NAME[lng] })}
            </button>
          ))}
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
