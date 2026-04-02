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
    label: 'A: Independent',
    desc: 'Each mark rounded independently. Max accuracy per mark, steps may vary ±1px.',
  },
  {
    value: 'fixed_step',
    label: 'B: Fixed Step',
    desc: 'All steps equal. Easy to document, but error accumulates.',
  },
  {
    value: 'bresenham',
    label: 'C: Bresenham',
    desc: 'Alternating short/long steps. Error bounded, visually smoothest.',
  },
]

export default function RasterStrategySelector({ reticle, setReticle }: Props) {
  return (
    <Section title="Rasterization">
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
