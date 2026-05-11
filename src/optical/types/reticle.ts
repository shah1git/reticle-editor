import type { ScopeProfile } from './scope'

export type Primitive =
  | { id: string; type: 'line'; x1: number; y1: number; x2: number; y2: number; thickness: number }
  | { id: string; type: 'dot'; x: number; y: number; size: number }

export interface Reticle {
  name: string
  scope: ScopeProfile
  primitives: Primitive[]
}
