/** Formateo compartido del módulo de Antropometrías (números en formato es-AR: coma decimal). */

export function fmtNum(valor: number | null, decimales = 1): string {
  if (valor === null) return '—'
  return valor.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
}

/** Diferencia con signo explícito: "+0,9" / "−1,2" / "0,0". */
export function fmtDelta(valor: number | null, decimales = 1): string {
  if (valor === null) return '—'
  const redondeado = Number(valor.toFixed(decimales))
  if (redondeado === 0) return fmtNum(0, decimales)
  return `${redondeado > 0 ? '+' : '−'}${fmtNum(Math.abs(redondeado), decimales)}`
}

/** "2026-03-15" → "15/03/26" */
export function fmtFechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a.slice(2)}`
}

/** "2026-03-15" → "15/03/2026" */
export function fmtFechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
