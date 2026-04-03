import { useState } from 'react'
import type { Reticle } from '../../types/reticle'
import type { RasterStrategy } from '../../types/rasterization'
import Section from '../ui/Section'
import styles from './RasterStrategySelector.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

const strategies: { value: RasterStrategy; label: string; summary: string; desc: string }[] = [
  {
    value: 'independent',
    label: 'А: Независимое округление',
    summary: 'ошибка ≤0.5 пикс, шаги неравномерны',
    desc: `Каждая метка размещается на ближайшем целом пикселе к своей идеальной позиции.
Позиция i-й метки = round(start + i × ideal_step).

✅ Точность позиции: ошибка каждой метки ≤ 0.5 пикселя
✅ Ошибки не накапливаются — 10-я метка так же точна, как 1-я
⚠ Точность интервала: расстояние между соседними метками может отличаться до 1 пикселя (ошибки соседей могут иметь разный знак)
⚠ Шаги чередуются (например, 8-8-7-8-8) — степень неравномерности зависит от дробной части шага: чем ближе к 0.5, тем сильнее «рябь»

Для: точных абсолютных координат каждой метки
Не для: шкал, где важна визуальная равномерность интервалов`,
  },
  {
    value: 'fixed_step',
    label: 'Б: Фиксированный шаг',
    summary: 'все шаги равны, ошибка накапливается',
    desc: `Шаг определяется один раз: fixed_step = round(ideal_step). Все метки размещаются через одинаковый шаг.

✅ Все интервалы абсолютно идентичны — шкала геометрически безупречна
✅ Простая документация: «каждый шаг = X пикселей»
❌ Ошибка накапливается линейно: i-я метка смещена на i × (fixed_step − ideal_step)
❌ Шкала систематически растянута (округление вверх) или сжата (вниз) — один край точен, другой уехал
❌ Последняя метка не попадает в расчётный конец отрезка

Для: коротких крыльев (3–5 меток), фабричных спецификаций
Не для: длинных шкал, где важна точность крайних меток или общая длина`,
  },
  {
    value: 'bresenham',
    label: 'В: Алгоритм Брезенхема',
    summary: 'идентично А, альтернативная реализация',
    desc: `Инкрементальная реализация метода А. Результат математически идентичен — те же позиции, те же интервалы, тот же паттерн чередования.

Отличие от А: вычисляет не абсолютную позицию каждой метки, а последовательно решает «короткий или длинный шаг» через аккумулятор ошибки.

✅ Все свойства метода А: ошибка ≤ 0.5 пикс, нет накопления
✅ Исторически: обходился без операций с плавающей точкой
⚠ На современном оборудовании для десятков меток разницы в производительности нет

Рекомендация: выбор между А и В — вопрос стиля реализации. Реальный выбор — между А/В (точность позиций) и Б (равномерность шагов)`,
  },
]

export default function RasterStrategySelector({ reticle, setReticle }: Props) {
  const [descOpen, setDescOpen] = useState(false)
  const current = strategies.find(s => s.value === reticle.rasterization)!

  return (
    <Section
      title="⚙ РАСТЕРИЗАЦИЯ"
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
          {current.label} — {current.summary}
        </span>
        <span className={styles.chevron}>{descOpen ? '▾' : '▸'}</span>
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
                <tr><td>Точность метки</td><td>✅ ≤0.5 пикс</td><td>❌ Растёт линейно</td><td>✅ ≤0.5 пикс</td></tr>
                <tr><td>Точность интервала</td><td>⚠ До 1 пикс</td><td>✅ Идеальная</td><td>⚠ До 1 пикс</td></tr>
                <tr><td>Накопление ошибки</td><td>✅ Нет</td><td>❌ Линейное</td><td>✅ Нет</td></tr>
                <tr><td>Визуальная равномерность</td><td>⚠ Зависит от шага</td><td>✅ Абсолютная</td><td>⚠ Идентично А</td></tr>
                <tr><td>Длина шкалы</td><td>✅ Точна</td><td>❌ Растянута/сжата</td><td>✅ Точна</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  )
}
