import type { WellnessEntry } from '@/types'

type WellnessInput = Pick<WellnessEntry, 'sueno' | 'dolorMuscular' | 'estres' | 'fatiga'>

export function calcularReadiness(entry: WellnessInput): number {
  const suenoInv = entry.sueno
  const dolorInv = 6 - entry.dolorMuscular
  const estresInv = 6 - entry.estres
  const fatigaInv = 6 - entry.fatiga
  return Number(((suenoInv + dolorInv + estresInv + fatigaInv) / 4).toFixed(1))
}

/**
 * Puntuación total de Wellness del día sobre 20 (Fase 20) — misma lógica de
 * inversión que `calcularReadiness` (a mayor dolor/estrés/fatiga, peor
 * puntaje) pero sin promediar, para poder compararla contra el umbral de
 * riesgo "< 12 sobre 20" que usa el Dashboard de Riesgo.
 */
export function calcularWellnessScore20(entry: WellnessInput): number {
  const suenoInv = entry.sueno
  const dolorInv = 6 - entry.dolorMuscular
  const estresInv = 6 - entry.estres
  const fatigaInv = 6 - entry.fatiga
  return suenoInv + dolorInv + estresInv + fatigaInv
}

/** Wellness reportado por un atleta en una fecha exacta (por defecto, hoy). */
export function obtenerWellnessDelDia(
  entries: WellnessEntry[],
  athleteId: string,
  fecha: string,
): WellnessEntry | null {
  return entries.find((e) => e.athleteId === athleteId && e.fecha === fecha) ?? null
}
