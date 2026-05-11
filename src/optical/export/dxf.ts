import type { Reticle } from '../types/reticle'
import { mradToMm } from '../math/conversions'

/**
 * Serialize a reticle into AutoCAD 2000 (AC1015) DXF text. Units are mm
 * (mrad × 0.001 × eyepieceFL); the data convention +y = up matches DXF's
 * own +y = up, so we do NOT flip y here (unlike SVG render).
 *
 * Scope of this slice:
 *   - line  → LWPOLYLINE with 2 vertices, constant width (group 43)
 *   - dot   → CIRCLE with radius = size / 2
 *
 * Empty reticle still yields a valid file with an empty ENTITIES section.
 */

const HEADER: string[] = [
  '0', 'SECTION',
  '2', 'HEADER',
  '9', '$ACADVER',
  '1', 'AC1015',
  '9', '$INSUNITS',
  '70', '4',
  '0', 'ENDSEC',
]

const TABLES: string[] = [
  '0', 'SECTION',
  '2', 'TABLES',
  '0', 'TABLE',
  '2', 'LAYER',
  '70', '1',
  '0', 'LAYER',
  '2', 'RETICLE',
  '70', '0',
  '62', '7',
  '6', 'CONTINUOUS',
  '0', 'ENDTAB',
  '0', 'ENDSEC',
]

const ENTITIES_OPEN: string[] = [
  '0', 'SECTION',
  '2', 'ENTITIES',
]

const ENTITIES_CLOSE: string[] = [
  '0', 'ENDSEC',
  '0', 'EOF',
]

const fmt = (n: number): string => n.toFixed(4)

export function serializeDxf(reticle: Reticle): string {
  const fl = reticle.scope.eyepieceFL
  const lines: string[] = [...HEADER, ...TABLES, ...ENTITIES_OPEN]

  for (const p of reticle.primitives) {
    if (p.type === 'line') {
      lines.push(
        '0', 'LWPOLYLINE',
        '8', 'RETICLE',
        '90', '2',
        '70', '0',
        '43', fmt(mradToMm(p.thickness, fl)),
        '10', fmt(mradToMm(p.x1, fl)),
        '20', fmt(mradToMm(p.y1, fl)),
        '10', fmt(mradToMm(p.x2, fl)),
        '20', fmt(mradToMm(p.y2, fl)),
      )
    } else {
      lines.push(
        '0', 'CIRCLE',
        '8', 'RETICLE',
        '10', fmt(mradToMm(p.x, fl)),
        '20', fmt(mradToMm(p.y, fl)),
        '40', fmt(mradToMm(p.size / 2, fl)),
      )
    }
  }

  lines.push(...ENTITIES_CLOSE)
  return lines.join('\n') + '\n'
}
