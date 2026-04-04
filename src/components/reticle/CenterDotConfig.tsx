import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const ppmMin = Math.min(ppm.h, ppm.v)
  const radiusPx = reticle.centerDot.radius * ppmMin
  const snappedRadius = useMemo(() => snapToPixel(reticle.centerDot.radius, ppmMin), [reticle.centerDot.radius, ppmMin])
  const diameterPx = Math.round(snappedRadius * ppmMin) * 2

  return (
    <Section
      title={t('centerDot.title')}
      tooltip={t('centerDot.tooltip')}
    >
      <NumberInput
        label={t('centerDot.radius')}
        value={reticle.centerDot.radius}
        onChange={v => setReticle({ ...reticle, centerDot: { radius: v } })}
        min={0}
        step={1 / ppmMin}
        pxValue={radiusPx}
        unit="MRAD"
        hint={t('centerDot.radiusHint')}
      />
      <div style={{ fontSize: 12, color: '#a1adc4', marginTop: -4 }}>
        {t('centerDot.diameter', { value: diameterPx })}
      </div>
    </Section>
  )
}
