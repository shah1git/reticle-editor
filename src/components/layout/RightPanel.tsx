import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import RasterTable from '../table/RasterTable'
import SummaryCards from './SummaryCards'
import styles from './RightPanel.module.css'

interface Props {
  reticle: Reticle
  ppm: PixelsPerMrad
  magnification: number
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

export default function RightPanel({ reticle, ppm, magnification, activeWing, setActiveWing }: Props) {
  return (
    <aside className={styles.panel}>
      <RasterTable
        reticle={reticle}
        ppm={ppm}
        magnification={magnification}
        focalPlane={reticle.focalPlane}
        activeWing={activeWing}
        setActiveWing={setActiveWing}
      />
      <SummaryCards ppm={ppm} reticle={reticle} activeWing={activeWing} />
    </aside>
  )
}
