import type { Reticle } from '../../types/reticle'
import type { RasterStrategy } from '../../types/rasterization'
import Section from '../ui/Section'
import styles from './RasterStrategySelector.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

const strategies: { value: RasterStrategy; label: string; desc: string }[] = [
  {
    value: 'independent',
    label: 'А: Независимое округление',
    desc: 'Каждая точка размещается максимально точно. Расстояния между точками могут отличаться на 1 пиксель. Лучший вариант, когда важна точность каждой отдельной метки.',
  },
  {
    value: 'fixed_step',
    label: 'Б: Фиксированный шаг',
    desc: 'Все расстояния между точками одинаковые. Легко документировать для фабрики. Но ошибка накапливается — дальние метки могут смещаться.',
  },
  {
    value: 'bresenham',
    label: 'В: Алгоритм Брезенхема',
    desc: 'Оптимальный компромисс: ошибка не накапливается, шаги визуально равномерные. Чередует длинные и короткие шаги (например: 8-8-7-8-8-7).',
  },
]

export default function RasterStrategySelector({ reticle, setReticle }: Props) {
  return (
    <Section
      title="⚙ РАСТЕРИЗАЦИЯ"
      tooltip="Как размещать точки, если интервал в MRAD не равен целому числу пикселей. Это неизбежная проблема — 1 MRAD почти никогда не равен ровно N пикселей"
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
            <div>
              <div className={styles.label}>{s.label}</div>
              {reticle.rasterization === s.value && (
                <div className={styles.desc}>{s.desc}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </Section>
  )
}
