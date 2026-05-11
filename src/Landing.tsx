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
            <img
              src={import.meta.env.BASE_URL + 'landing-thermal.png'}
              alt=""
              className={styles.cardIllustration}
              aria-hidden="true"
            />
            <div className={styles.cardTitle}>{t('landing.thermalTitle')}</div>
            <div className={styles.cardDescription}>{t('landing.thermalDescription')}</div>
          </Link>

          <Link to="/optical" className={styles.card}>
            <img
              src={import.meta.env.BASE_URL + 'landing-optical.png'}
              alt=""
              className={styles.cardIllustration}
              aria-hidden="true"
            />
            <div className={styles.cardTitle}>{t('landing.opticalTitle')}</div>
            <div className={styles.cardDescription}>{t('landing.opticalDescription')}</div>
          </Link>
        </div>
      </main>
    </div>
  )
}
