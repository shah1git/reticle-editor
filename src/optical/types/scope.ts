export interface ScopeProfile {
  type: 'FFP' | 'SFP'
  referenceMag?: number      // required when type === 'SFP'
  eyepieceFL: number         // mm
  glassDiameter: number      // mm
  glassThickness: number     // mm
  minLineWidth: number       // mm (manufacturing constraint)
  minGap: number             // mm (manufacturing constraint)
}
