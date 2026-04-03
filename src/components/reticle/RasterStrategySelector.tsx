import { useState } from 'react'
import type { Reticle } from '../../types/reticle'
import type { RasterStrategy } from '../../types/rasterization'
import Section from '../ui/Section'
import styles from './RasterStrategySelector.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

const DESC_A = `Каждая точка ставится на ближайший целый пиксель к своей идеальной позиции — независимо от остальных точек.

Пример: при 1 MRAD = 7.78 пикселей, точка #3 должна быть на 23.34 пикселе → ставится на 23-й пиксель. Точка #4 на 31.12 → на 31-й.

✅ Каждая метка максимально точна (ошибка ≤ 0.5 пикселя)
✅ Ошибка не накапливается — 10-я метка так же точна, как 1-я
⚠️ Расстояния между соседними метками могут отличаться на 1 пиксель (например, чередование шагов 8-8-7-8-8-7)

Лучший вариант, когда важна точность каждой метки для стрелковых поправок.`

const DESC_B = `Расстояние между всеми точками одинаковое = ближайшее целое к (интервал × пикс/MRAD). Например, если 1 MRAD = 7.78 пикс, то шаг = 8 пикселей.

Пример: точки на 8, 16, 24, 32, 40... пикселях. Все расстояния = 8 пикс.

✅ Все шаги равны — легко документировать для фабрики: «шаг = 8 пикселей»
❌ Ошибка накапливается: к 5-й метке — уже +1.1 пикс, к 10-й — +2.2 пикс
❌ Дальние метки заметно смещены от правильных позиций

Подходит для коротких крыльев (3–5 меток) и спецификаций, где нужен единый шаг.`

const DESC_V = `Чередование двух шагов по предсказуемому паттерну. Тот же принцип, что используется в компьютерной графике для рисования ровных линий из пикселей.

Пример: при 1 MRAD = 7.78 пикс → чередуются шаги 7 и 8 пикселей. Паттерн: 8-8-7-8-8-7-8-8-7-8 (повторяющийся цикл).

✅ Ошибка не накапливается (как в А) — каждая метка точна
✅ Визуально равномерная шкала — только два возможных значения шага
✅ Паттерн предсказуемый и документируемый

Универсальный вариант — лучший компромисс между точностью и равномерностью.`

const strategies: { value: RasterStrategy; label: string; summary: string; desc: string }[] = [
  {
    value: 'independent',
    label: 'А: Независимое округление',
    summary: 'Каждая метка на ближайшем пикселе к идеалу. Ошибка \u22640.5 px, не накапливается, но шаги неравномерны.',
    desc: DESC_A,
  },
  {
    value: 'fixed_step',
    label: 'Б: Фиксированный шаг',
    summary: 'Все шаги одинаковые. Визуально безупречно, но ошибка накапливается линейно.',
    desc: DESC_B,
  },
  {
    value: 'bresenham',
    label: 'В: Алгоритм Брезенхема',
    summary: 'Идентичен А по результату. Другая реализация (инкрементальная), тот же результат.',
    desc: DESC_V,
  },
]

export default function RasterStrategySelector({ reticle, setReticle }: Props) {
  const [descOpen, setDescOpen] = useState(false)
  const current = strategies.find(s => s.value === reticle.rasterization)!

  return (
    <Section
      title="\u2699 ОКРУГЛЕНИЕ"
      tooltip="Как размещать точки, если интервал в MRAD не равен целому числу пикселей. Три стратегии решают эту проблему по-разному"
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
                  <th>А: Независимое</th>
                  <th>Б: Фиксированный</th>
                  <th>В: Брезенхем</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Точность метки</td><td>{'\u2705'} {'\u2264'}0.5 пикс</td><td>{'\u274c'} Раст\u0451т линейно</td><td>{'\u2705'} {'\u2264'}0.5 пикс</td></tr>
                <tr><td>Точность интервала</td><td>{'\u26a0'} До 1 пикс</td><td>{'\u2705'} Идеальная</td><td>{'\u26a0'} До 1 пикс</td></tr>
                <tr><td>Накопление ошибки</td><td>{'\u2705'} Нет</td><td>{'\u274c'} Линейное</td><td>{'\u2705'} Нет</td></tr>
                <tr><td>Визуальная равномерность</td><td>{'\u26a0'} Зависит от шага</td><td>{'\u2705'} Абсолютная</td><td>{'\u26a0'} Идентично А</td></tr>
                <tr><td>Простота документации</td><td>{'\u26a0'} Нужна таблица</td><td>{'\u2705'} Один шаг</td><td>{'\u26a0'} Нужна таблица</td></tr>
                <tr><td>Длина шкалы</td><td>{'\u2705'} Точна</td><td>{'\u274c'} Растянута/сжата</td><td>{'\u2705'} Точна</td></tr>
                <tr><td>Рекомендация</td><td>Точность координат</td><td>Равномерность + короткие</td><td>Альт. реализация А</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  )
}
