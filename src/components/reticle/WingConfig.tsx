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
  const ppmMin = Math.min(ppm.h, ppm.v)

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

  return (
    <Section
      title={title}
      defaultOpen={false}
      tooltip="Крыло — линия от центральной точки. На ней размещаются метки через равные интервалы для измерения расстояний и поправок"
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
            step={0.1}
            pxValue={wing.length * axisPpm}
            unit="MRAD"
            hint="Как далеко тянется крыло от центра. 1 MRAD ≈ 10 см на 100 м дистанции"
          />
          <NumberInput
            label="Толщина линии"
            value={wing.lineThickness}
            onChange={v => updateWing({ lineThickness: v })}
            min={0.01}
            step={0.01}
            pxValue={wing.lineThickness * axisPpm}
            unit="MRAD"
            hint="Тонкая линия (0.05–0.1) меньше перекрывает цель"
          />
          <div style={{ marginTop: 6 }}>
            <CheckboxInput
              label="Точки на крыле"
              checked={wing.dots.enabled}
              onChange={v => updateDots({ enabled: v })}
            />
          </div>
          {wing.dots.enabled && (
            <>
              <NumberInput
                label="Интервал"
                value={wing.dots.spacing}
                onChange={v => updateDots({ spacing: v })}
                min={0.01}
                step={0.1}
                pxValue={wing.dots.spacing * axisPpm}
                unit="MRAD"
                hint="Расстояние между точками. При 1.0 MRAD и длине 5.0 будет 5 точек"
              />
              <NumberInput
                label="Радиус точки"
                value={wing.dots.radius}
                onChange={v => updateDots({ radius: v })}
                min={0}
                step={1 / ppmMin}
                pxValue={wing.dots.radius * ppmMin}
                unit="MRAD"
                hint="Размер каждой метки. Автоматически привязывается к целым пикселям"
              />
            </>
          )}
        </>
      )}
    </Section>
  )
}
