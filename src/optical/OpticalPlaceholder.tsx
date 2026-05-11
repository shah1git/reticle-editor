import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../shared/i18n/LanguageSwitcher'
import styles from './OpticalPlaceholder.module.css'

export default function OpticalPlaceholder() {
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
        <h1 className={styles.title}>{t('optical.title')}</h1>
        <p className={styles.teaser}>{t('optical.teaser')}</p>
        <Link to="/" className={styles.back}>{t('optical.backToLanding')}</Link>
      </main>
    </div>
  )
}
