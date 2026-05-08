import { useTranslation } from 'react-i18next'
import type { Reticle, CenterMarkKind } from '../../types/reticle'
import Section from '../ui/Section'
import SelectInput from '../ui/SelectInput'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

const CENTER_KINDS: CenterMarkKind[] = ['square4', 'square2']

export default function CenterDotConfig({ reticle, setReticle }: Props) {
  const { t } = useTranslation()

  const options = CENTER_KINDS.map(k => ({
    value: k,
    label: t(`centerDot.kindLabel.${k}`),
  }))

  return (
    <Section
      title={t('centerDot.title')}
      tooltip={t('centerDot.tooltip')}
    >
      <SelectInput
        label={t('centerDot.kindField')}
        value={reticle.centerDot.kind}
        onChange={v => setReticle({ ...reticle, centerDot: { kind: v as CenterMarkKind } })}
        options={options}
      />
    </Section>
  )
}
