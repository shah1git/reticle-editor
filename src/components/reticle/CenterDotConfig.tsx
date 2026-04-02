import { useMemo } from 'react'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { snapToPixel } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
}

export default function CenterDotConfig({ reticle, setReticle, ppm }: Props) {
  const ppmMin = Math.min(ppm.h, ppm.v)
  const radiusPx = reticle.centerDot.radius * ppmMin
  const snappedRadius = useMemo(() => snapToPixel(reticle.centerDot.radius, ppmMin), [reticle.centerDot.radius, ppmMin])
  const diameterPx = Math.round(snappedRadius * ppmMin) * 2

  return (
    <Section title="Center Dot">
      <NumberInput
        label="Radius"
        value={reticle.centerDot.radius}
        onChange={v => setReticle({ ...reticle, centerDot: { radius: v } })}
        min={0}
        step={1 / ppmMin}
        pxValue={radiusPx}
      />
      <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>
        Diameter: {diameterPx} px
      </div>
    </Section>
  )
}
