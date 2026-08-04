import type { PhysicalTest } from '@/types'

function ultimosDosConCampo<K extends keyof PhysicalTest>(
  tests: PhysicalTest[],
  athleteId: string,
  campo: K,
): [PhysicalTest, PhysicalTest] | null {
  const propios = tests
    .filter((t) => t.athleteId === athleteId && t[campo] !== undefined)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  if (propios.length < 2) return null
  return [propios[0], propios[1]]
}

/** % de caída del último test CMJ (altura) respecto del anterior (positivo = cayó). */
export function calcularCaidaCmjPct(tests: PhysicalTest[], athleteId: string): number | null {
  const par = ultimosDosConCampo(tests, athleteId, 'cmjCm')
  if (!par) return null
  const [ultimo, anterior] = par
  if (anterior.cmjCm === 0) return null
  return Number((((anterior.cmjCm - ultimo.cmjCm) / anterior.cmjCm) * 100).toFixed(1))
}

/** % de caída del último RSI modificado respecto del anterior (positivo = cayó). */
export function calcularCaidaMrsiPct(tests: PhysicalTest[], athleteId: string): number | null {
  const par = ultimosDosConCampo(tests, athleteId, 'rsiModificado')
  if (!par) return null
  const [ultimo, anterior] = par
  const anteriorValor = anterior.rsiModificado
  const ultimoValor = ultimo.rsiModificado
  if (!anteriorValor) return null
  return Number((((anteriorValor - (ultimoValor ?? 0)) / anteriorValor) * 100).toFixed(1))
}

/**
 * Umbral de intervención por caída de RSI modificado.
 * Fuente: Martinez, D. (2016). "The Use of Reactive Strength Index, Reactive Strength
 * Index Modified, and Flight Time:Contraction Time as Monitoring Tools". J. Aust.
 * Strength Cond. 24(5), 37-41 — citando a Ronglan, Raastad & Borgesen (2006), balonmano
 * de élite (deporte de conjunto): "A decline of 8% in FT:CT or RSImod would indicate a
 * change requiring intervention".
 */
export const UMBRAL_FATIGA_MRSI_PCT = 8

/**
 * Piso de ruido de medición para la altura del CMJ (no confundir con umbral de fatiga):
 * CV% = 4.7 (protocolo sin balanceo de brazos, fiabilidad intersesión) reportado en
 * Heishman, A.D. et al. (2020). "Countermovement jump reliability performed with and
 * without an arm swing in NCAA Division I intercollegiate basketball players". JSCR,
 * 34(2), 546-558. Una caída menor a este valor puede ser sólo ruido de medición, no una
 * caída real. Aun así, la evidencia (Marques et al., 2026; TFM Robles, 2026) muestra que
 * la altura del salto es un indicador de baja sensibilidad frente al RSI modificado.
 */
export const UMBRAL_RUIDO_CMJ_PCT = 4.7

export type MotivoFatiga = 'mrsi' | 'cmj-debil' | null

export interface FatigaResult {
  enFatiga: boolean
  motivo: MotivoFatiga
  caidaMrsiPct: number | null
  caidaCmjPct: number | null
}

/**
 * Evalúa fatiga neuromuscular priorizando el RSI modificado sobre la altura del CMJ.
 * Fuente: Marques, J.B. et al. (2026). "Jump Height Lies: Force–Time CMJ Metrics Reveal
 * Hidden Neuromuscular Responses in Elite Football". Sport Perf & Science Reports, 293 —
 * RSI modificado ~2-4 veces más sensible que la altura de salto; la altura se mantuvo
 * prácticamente sin cambios pese a alteraciones neuromusculares reales. Ver también
 * docs/fundamentos_cientificos.md.
 */
export function evaluarFatiga(tests: PhysicalTest[], athleteId: string): FatigaResult {
  const caidaMrsiPct = calcularCaidaMrsiPct(tests, athleteId)
  const caidaCmjPct = calcularCaidaCmjPct(tests, athleteId)

  if (caidaMrsiPct !== null) {
    return {
      enFatiga: caidaMrsiPct >= UMBRAL_FATIGA_MRSI_PCT,
      motivo: 'mrsi',
      caidaMrsiPct,
      caidaCmjPct,
    }
  }
  if (caidaCmjPct !== null && caidaCmjPct >= UMBRAL_RUIDO_CMJ_PCT) {
    return { enFatiga: true, motivo: 'cmj-debil', caidaMrsiPct, caidaCmjPct }
  }
  return { enFatiga: false, motivo: null, caidaMrsiPct, caidaCmjPct }
}

/** Alerta de fatiga (booleano simple para badges/contadores). */
export function tieneAlertaFatiga(tests: PhysicalTest[], athleteId: string): boolean {
  return evaluarFatiga(tests, athleteId).enFatiga
}

export function obtenerUltimoCmj(tests: PhysicalTest[], athleteId: string): PhysicalTest | null {
  const propios = tests
    .filter((t) => t.athleteId === athleteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  return propios[0] ?? null
}
