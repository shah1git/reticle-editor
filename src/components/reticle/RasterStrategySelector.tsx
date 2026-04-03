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
    desc: `Каждая точка ставится на ближайший целый пиксель к своей идеальной позиции.

✅ Точность: каждая метка максимально точна (ошибка ≤ 0.5 пикселя)
✅ Нет накопления ошибки — 10-я метка так же точна, как 1-я
⚠ Шаги между метками могут отличаться на 1 пиксель (например, 8-8-7-8-8)

Рекомендуется для: точных стрелковых шкал, дальномерных сеток`,
  },
  {
    value: 'fixed_step',
    label: 'Б: Фиксированный шаг',
    desc: `Шаг между всеми точками одинаковый = ближайшее целое к (интервал × пикс/MRAD).

✅ Все расстояния между метками равны — легко документировать
❌ Ошибка накапливается: каждая следующая метка чуть дальше от идеала
❌ На длинных крыльях (>5 меток) ошибка может стать заметной

Рекомендуется для: коротких крыльев (3–5 меток), спецификаций для фабрики`,
  },
  {
    value: 'bresenham',
    label: 'В: Алгоритм Брезенхема',
    desc: `Чередование двух шагов (например, 7 и 8 пикселей) по предсказуемому паттерну. Тот же принцип, что в компьютерной графике для рисования ровных линий.

✅ Ошибка не накапливается (как в А)
✅ Шаги визуально равномерные — только 2 возможных значения
✅ Паттерн предсказуемый: например, 8-8-7-8-8-7 (повторяющийся цикл)

Рекомендуется: универсальный вариант, лучший компромисс`,
  },
]

export default function RasterStrategySelector({ reticle, setReticle }: Props) {
  return (
    <Section
      title="⚙ РАСТЕРИЗАЦИЯ"
      tooltip="Как размещать точки, если интервал в MRAD не равен целому числу пикселей. Проблема: 1 MRAD почти никогда не равен ровно N пикселей (например, может быть 7.78). Три стратегии решают эту проблему по-разному"
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
