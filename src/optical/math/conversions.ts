/** Convert angular size in mrad to a physical span on the reticle plane. */
export function mradToMm(mrad: number, eyepieceFL: number): number {
  return mrad * 0.001 * eyepieceFL
}

/** Inverse of mradToMm — used when entering manufacturing constraints in mm. */
export function mmToMrad(mm: number, eyepieceFL: number): number {
  if (eyepieceFL === 0) return 0
  return mm / (0.001 * eyepieceFL)
}
