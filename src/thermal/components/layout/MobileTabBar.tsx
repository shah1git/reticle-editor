import { useTranslation } from 'react-i18next'
import styles from './MobileTabBar.module.css'

export type MobileTab = 'settings' | 'canvas' | 'table'

interface Props {
  activeTab: MobileTab
  setActiveTab: (tab: MobileTab) => void
}

const tabs: { id: MobileTab; icon: string; labelKey: string }[] = [
  { id: 'settings', icon: '\u2699', labelKey: 'mobileTabs.settings' },
  { id: 'canvas', icon: '\u2295', labelKey: 'mobileTabs.canvas' },
  { id: 'table', icon: '\u2630', labelKey: 'mobileTabs.table' },
]

export default function MobileTabBar({ activeTab, setActiveTab }: Props) {
  const { t } = useTranslation()

  return (
    <nav className={styles.tabbar}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  )
}
