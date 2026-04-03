import { useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import { calcPixelsPerMrad, getFovMrad, isSquarePixelRatio } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'
import SelectInput from '../ui/SelectInput'
import styles from './ScopeProfilePanel.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
}

export default function ScopeProfilePanel({ scope, setScope }: Props) {
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const fov = useMemo(() => getFovMrad(scope), [scope])
  const squarePx = useMemo(() => isSquarePixelRatio(ppm), [ppm])

  const update = (patch: Partial<ScopeProfile>) => setScope({ ...scope, ...patch })

  const summary = `1 MRAD = ${ppm.h.toFixed(2)} пикс`

  return (
    <Section title="ПРОФИЛЬ ПРИЦЕЛА" summary={summary}>
      <div className={styles.field}>
        <label className={styles.label}>Название</label>
        <input
          className={styles.nameInput}
          value={scope.name}
          onChange={e => update({ name: e.target.value })}
          placeholder="Имя профиля"
        />
        <div className={styles.hint}>Имя для этого набора параметров, например «OVOD 640 F50»</div>
      </div>

      <SelectInput
        label="Тип"
        value={scope.type}
        onChange={v => update({ type: v as 'digital' | 'optical' })}
        options={[
          { value: 'digital', label: 'Цифровой (тепловизор / ночник)' },
          { value: 'optical', label: 'Оптический' },
        ]}
        hint="Цифровой — прицел с электронным дисплеем. Оптический — со стеклянной сеткой"
      />

      {scope.type === 'digital' ? (
        <>
          <NumberInput label="Фокусное расстояние" value={scope.lensFL} onChange={v => update({ lensFL: v })} min={1} step={1} unit="мм" hint="Фокусное расстояние объектива. Типичные значения: 25, 35, 50 мм" />
          <div className={styles.pairRow}>
            <NumberInput label="Сенсор Ш" value={scope.sensorResX} onChange={v => update({ sensorResX: v })} min={1} step={1} unit="пикс" />
            <NumberInput label="Сенсор В" value={scope.sensorResY} onChange={v => update({ sensorResY: v })} min={1} step={1} unit="пикс" />
          </div>
          <div className={styles.hint}>Разрешение сенсора (матрицы). Например: 384×288, 640×512</div>
          <div className={styles.pairRow}>
            <NumberInput label="Дисплей Ш" value={scope.displayResX} onChange={v => update({ displayResX: v })} min={1} step={1} unit="пикс" />
            <NumberInput label="Дисплей В" value={scope.displayResY} onChange={v => update({ displayResY: v })} min={1} step={1} unit="пикс" />
          </div>
          <div className={styles.hint}>Разрешение OLED/LCD дисплея. Например: 1024×768, 2560×2560</div>
          <NumberInput label="Размер пикселя" value={scope.pixelPitch} onChange={v => update({ pixelPitch: v })} min={0.1} step={0.1} unit="мкм" hint="Pitch пикселя сенсора в микрометрах. Типичные: 12, 17 мкм" />
        </>
      ) : (
        <>
          <NumberInput label="Поле зрения" value={scope.fovDegrees} onChange={v => update({ fovDegrees: v })} min={0.1} step={0.1} unit="°" hint="Угол обзора прицела из спецификации производителя" />
          <div className={styles.pairRow}>
            <NumberInput label="Дисплей Ш" value={scope.displayResX} onChange={v => update({ displayResX: v })} min={1} step={1} unit="пикс" />
            <NumberInput label="Дисплей В" value={scope.displayResY} onChange={v => update({ displayResY: v })} min={1} step={1} unit="пикс" />
          </div>
          <div className={styles.hint}>Разрешение для экспорта — размер выходного изображения</div>
        </>
      )}

      <div className={styles.calc}>
        <div className={styles.calcLabel}>Рассчитано</div>
        {squarePx ? (
          <div className={styles.calcValue}>1 MRAD = {ppm.h.toFixed(3)} пикс</div>
        ) : (
          <>
            <div className={styles.calcValue}>Гориз: {ppm.h.toFixed(3)} пикс/MRAD</div>
            <div className={styles.calcValue}>Верт: {ppm.v.toFixed(3)} пикс/MRAD</div>
          </>
        )}
        <div className={styles.calcValue}>FOV: {fov.h.toFixed(1)} × {fov.v.toFixed(1)} MRAD</div>
        {!squarePx && (
          <div className={styles.warning}>⚠ Неквадратное соотношение пикселей — пропорции сенсора и дисплея не совпадают</div>
        )}
      </div>
    </Section>
  )
}
