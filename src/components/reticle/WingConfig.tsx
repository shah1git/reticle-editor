import type { Reticle, Wing } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'
import CheckboxInput from '../ui/CheckboxInput'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  wingKey: 'up' | 'down' | 'left' | 'right'
  title: string
}

export default function WingConfig({ reticle, setReticle, ppm, wingKey, title }: Props) {
  const wing = reticle.wings[wingKey]
  const axisPpm = (wingKey === 'down' || wingKey === 'up') ? ppm.v : ppm.h

  const updateWing = (patch: Partial<Wing>) => {
    setReticle({
      ...reticle,
      wings: {
        ...reticle.wings,
        [wingKey]: { ...wing, ...patch },
      },
    })
  }

  const updateDots = (patch: Partial<Wing['dots']>) => {
    updateWing({ dots: { ...wing.dots, ...patch } })
  }

  const dotSizeMrad = wing.dotSize / axisPpm

  return (
    <Section
      title={title}
      defaultOpen={false}
      tooltip="Крыло — линия от центральной точки. Вдоль неё размещаются метки через равные интервалы для измерения расстояний и поправок. Если длина = 0, крыло не отображается"
    >
      <CheckboxInput
        label={wing.enabled ? 'Включено' : 'Выключено'}
        checked={wing.enabled}
        onChange={v => updateWing({ enabled: v })}
      />
      {wing.enabled && (
        <>
          <NumberInput
            label="Длина"
            value={wing.length}
            onChange={v => updateWing({ length: v })}
            min={0}
            defaultValue={5}
            step={0.1}
            pxValue={wing.length * axisPpm}
            unit="MRAD"
            hint="Как далеко тянется крыло от центра. 1 MRAD ≈ 10 см на 100 м. При 0 крыло не отображается"
          />
          <NumberInput
            label="Толщина линии"
            value={wing.lineThickness}
            onChange={v => updateWing({ lineThickness: v })}
            min={0}
            defaultValue={0.1}
            step={0.05}
            pxValue={wing.lineThickness * axisPpm}
            unit="MRAD"
            hint="Толщина линии крыла. Тонкая (0.05–0.1) меньше перекрывает цель. Значение 0 допустимо — линия не рисуется, остаются только точки-метки"
          />
          <NumberInput
            label="Размер точки"
            value={wing.dotSize}
            onChange={v => updateWing({ dotSize: Math.max(1, Math.round(v)) })}
            min={1}
            defaultValue={2}
            step={1}
            unit="пикс"
            hint="Диаметр каждой точки-метки в пикселях. Задаётся напрямую — без пересчёта из MRAD. Каждое крыло может иметь свой размер. Минимум 1 пиксель"
          />
          <div style={{ fontSize: 12, color: '#a1adc4', marginTop: -4, marginBottom: 8 }}>
            = {dotSizeMrad.toFixed(3)} MRAD
          </div>
          <CheckboxInput
            label="Точки на крыле"
            checked={wing.dots.enabled}
            onChange={v => updateDots({ enabled: v })}
          />
          {wing.dots.enabled && (
            <NumberInput
              label="Интервал"
              value={wing.dots.spacing}
              onChange={v => updateDots({ spacing: v })}
              min={0.1}
              defaultValue={1}
              step={0.1}
              pxValue={wing.dots.spacing * axisPpm}
              unit="MRAD"
              hint="Расстояние между точками. При 1.0 и длине 5.0 будет 5 точек"
            />
          )}
        </>
      )}
    </Section>
  )
}
