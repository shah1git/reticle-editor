import { useTranslation } from 'react-i18next'
import styles from './LanguageSwitcher.module.css'

const languages = [
  { code: 'en', flag: FlagUS, label: 'English' },
  { code: 'ru', flag: FlagRU, label: 'Русский' },
  { code: 'zh', flag: FlagCN, label: '中文' },
] as const

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className={styles.switcher}>
      {languages.map(({ code, flag: Flag, label }) => (
        <button
          key={code}
          className={`${styles.btn} ${i18n.language === code ? styles.btnActive : ''}`}
          onClick={() => i18n.changeLanguage(code)}
          title={label}
          aria-label={label}
        >
          <Flag />
        </button>
      ))}
    </div>
  )
}

function FlagUS() {
  return (
    <svg viewBox="0 0 60 40" className={styles.flag}>
      <rect width="60" height="40" fill="#B22234" />
      <rect y="3.08" width="60" height="3.08" fill="#FFF" />
      <rect y="9.23" width="60" height="3.08" fill="#FFF" />
      <rect y="15.38" width="60" height="3.08" fill="#FFF" />
      <rect y="21.54" width="60" height="3.08" fill="#FFF" />
      <rect y="27.69" width="60" height="3.08" fill="#FFF" />
      <rect y="33.85" width="60" height="3.08" fill="#FFF" />
      <rect width="24" height="21.54" fill="#3C3B6E" />
      <g fill="#FFF" fontSize="3" textAnchor="middle" dominantBaseline="central">
        <circle cx="4" cy="2.5" r="1" /><circle cx="8" cy="2.5" r="1" /><circle cx="12" cy="2.5" r="1" /><circle cx="16" cy="2.5" r="1" /><circle cx="20" cy="2.5" r="1" />
        <circle cx="6" cy="5" r="1" /><circle cx="10" cy="5" r="1" /><circle cx="14" cy="5" r="1" /><circle cx="18" cy="5" r="1" />
        <circle cx="4" cy="7.5" r="1" /><circle cx="8" cy="7.5" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16" cy="7.5" r="1" /><circle cx="20" cy="7.5" r="1" />
        <circle cx="6" cy="10" r="1" /><circle cx="10" cy="10" r="1" /><circle cx="14" cy="10" r="1" /><circle cx="18" cy="10" r="1" />
        <circle cx="4" cy="12.5" r="1" /><circle cx="8" cy="12.5" r="1" /><circle cx="12" cy="12.5" r="1" /><circle cx="16" cy="12.5" r="1" /><circle cx="20" cy="12.5" r="1" />
        <circle cx="6" cy="15" r="1" /><circle cx="10" cy="15" r="1" /><circle cx="14" cy="15" r="1" /><circle cx="18" cy="15" r="1" />
        <circle cx="4" cy="17.5" r="1" /><circle cx="8" cy="17.5" r="1" /><circle cx="12" cy="17.5" r="1" /><circle cx="16" cy="17.5" r="1" /><circle cx="20" cy="17.5" r="1" />
        <circle cx="6" cy="20" r="1" /><circle cx="10" cy="20" r="1" /><circle cx="14" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
      </g>
    </svg>
  )
}

function FlagRU() {
  return (
    <svg viewBox="0 0 60 40" className={styles.flag}>
      <rect width="60" height="13.33" fill="#FFF" />
      <rect y="13.33" width="60" height="13.34" fill="#0039A6" />
      <rect y="26.67" width="60" height="13.33" fill="#D52B1E" />
    </svg>
  )
}

function FlagCN() {
  return (
    <svg viewBox="0 0 60 40" className={styles.flag}>
      <rect width="60" height="40" fill="#DE2910" />
      <g fill="#FFDE00">
        <polygon points="10,4 11.2,7.6 15,7.6 12,9.8 13,13.4 10,11 7,13.4 8,9.8 5,7.6 8.8,7.6" />
        <polygon points="20,2 20.6,3.8 22.5,3.8 21,5 21.5,6.8 20,5.8 18.5,6.8 19,5 17.5,3.8 19.4,3.8" />
        <polygon points="24,6 24.6,7.8 26.5,7.8 25,9 25.5,10.8 24,9.8 22.5,10.8 23,9 21.5,7.8 23.4,7.8" />
        <polygon points="24,12 24.6,13.8 26.5,13.8 25,15 25.5,16.8 24,15.8 22.5,16.8 23,15 21.5,13.8 23.4,13.8" />
        <polygon points="20,16 20.6,17.8 22.5,17.8 21,19 21.5,20.8 20,19.8 18.5,20.8 19,19 17.5,17.8 19.4,17.8" />
      </g>
    </svg>
  )
}
