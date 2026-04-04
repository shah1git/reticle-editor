import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reticle } from '../../types/reticle'
import type { RasterStrategy } from '../../types/rasterization'
import Section from '../ui/Section'
import styles from './RasterStrategySelector.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

export default function RasterStrategySelector({ reticle, setReticle }: Props) {
  const { t } = useTranslation()
  const [descOpen, setDescOpen] = useState(false)

  const strategies: { value: RasterStrategy; label: string; summary: string; desc: string }[] = [
    {
      value: 'independent',
      label: t('strategyFull.independentLabel'),
      summary: t('strategySelector.summaryA'),
      desc: t('strategySelector.descA'),
    },
    {
      value: 'fixed_step',
      label: t('strategyFull.fixedStepLabel'),
      summary: t('strategySelector.summaryB'),
      desc: t('strategySelector.descB'),
    },
  ]

  const current = strategies.find(s => s.value === reticle.rasterization)!

  return (
    <Section
      title={t('strategySelector.title')}
      tooltip={t('strategySelector.tooltip')}
    >
      <div className={styles.options}>
        {strategies.map(s => (
          <label key={s.value} className={styles.option}>
            <input
              type="radio"
              name="raster"
              checked={reticle.rasterization === s.value}
              onChange={() => setReticle({ ...reticle, rasterization: s.value })}
              className={styles.radio}
            />
            <div className={styles.label}>{s.label}</div>
          </label>
        ))}
      </div>

      <button
        className={styles.descToggle}
        onClick={() => setDescOpen(!descOpen)}
      >
        <span className={styles.descSummary}>
          {current.summary}
        </span>
        <span className={styles.chevron}>{descOpen ? '\u25be' : '\u25b8'}</span>
      </button>

      {descOpen && (
        <div className={styles.descBlock}>
          <div className={styles.desc}>{current.desc}</div>

          <div className={styles.compTable}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>{t('strategyFull.independentLabel')}</th>
                  <th>{t('strategyFull.fixedStepLabel')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>{t('strategySelector.compTable.markAccuracy')}</td><td>{'\u2705'} {t('strategySelector.compTable.leq05px')}</td><td>{'\u274c'} {t('strategySelector.compTable.growsLinearly')}</td></tr>
                <tr><td>{t('strategySelector.compTable.intervalAccuracy')}</td><td>{'\u26a0'} {t('strategySelector.compTable.upTo1px')}</td><td>{'\u2705'} {t('strategySelector.compTable.perfect')}</td></tr>
                <tr><td>{t('strategySelector.compTable.errorAccumulation')}</td><td>{'\u2705'} {t('strategySelector.compTable.none')}</td><td>{'\u274c'} {t('strategySelector.compTable.linear')}</td></tr>
                <tr><td>{t('strategySelector.compTable.visualUniformity')}</td><td>{'\u26a0'} {t('strategySelector.compTable.dependsOnStep')}</td><td>{'\u2705'} {t('strategySelector.compTable.absolute')}</td></tr>
                <tr><td>{t('strategySelector.compTable.docSimplicity')}</td><td>{'\u26a0'} {t('strategySelector.compTable.needsTable')}</td><td>{'\u2705'} {t('strategySelector.compTable.singleStep')}</td></tr>
                <tr><td>{t('strategySelector.compTable.scaleLength')}</td><td>{'\u2705'} {t('strategySelector.compTable.accurate')}</td><td>{'\u274c'} {t('strategySelector.compTable.stretchedCompressed')}</td></tr>
                <tr><td>{t('strategySelector.compTable.recommendation')}</td><td>{t('strategySelector.compTable.coordinateAccuracy')}</td><td>{t('strategySelector.compTable.uniformityShort')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  )
}
