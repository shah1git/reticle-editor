import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageSwitcher from './shared/i18n/LanguageSwitcher'
import styles from './Landing.module.css'

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="RIKA" className={styles.brandLogo} />
          <span className={styles.brandText}>RIKA</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{t('landing.title')}</h1>
        <p className={styles.subtitle}>{t('landing.subtitle')}</p>

        <div className={styles.cards}>
          <Link to="/thermal" className={styles.card}>
            <svg
              className={styles.cardIllustration}
              viewBox="0 0 200 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="60" y="8" width="80" height="20" rx="3" />
              <circle cx="75" cy="18" r="1.5" fill="currentColor" />
              <circle cx="85" cy="18" r="1.5" fill="currentColor" />
              <circle cx="95" cy="18" r="1.5" fill="currentColor" />
              <rect x="38" y="32" width="124" height="28" rx="3" />
              <path d="M38 28 L20 18 L20 74 L38 64 Z" />
              <circle cx="22" cy="46" r="6" fill="currentColor" opacity="0.3" stroke="none" />
              <path d="M162 34 L180 28 L180 64 L162 58 Z" />
            </svg>
            <div className={styles.cardTitle}>{t('landing.thermalTitle')}</div>
            <div className={styles.cardDescription}>{t('landing.thermalDescription')}</div>
          </Link>

          <Link to="/optical" className={styles.card}>
            <svg
              className={styles.cardIllustration}
              viewBox="0 0 200 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="42" y="36" width="116" height="14" rx="2" />
              <path d="M42 30 L24 20 L24 66 L42 56 Z" />
              <path d="M158 30 L176 22 L176 64 L158 56 Z" />
              <rect x="72" y="22" width="14" height="14" rx="2" />
              <circle cx="79" cy="22" r="3" />
              <rect x="92" y="22" width="14" height="14" rx="2" />
              <rect x="142" y="34" width="6" height="18" rx="1" />
              <line x1="20" y1="43" x2="32" y2="43" />
              <line x1="26" y1="37" x2="26" y2="49" />
            </svg>
            <div className={styles.cardTitle}>{t('landing.opticalTitle')}</div>
            <div className={styles.cardDescription}>{t('landing.opticalDescription')}</div>
          </Link>
        </div>
      </main>
    </div>
  )
}
