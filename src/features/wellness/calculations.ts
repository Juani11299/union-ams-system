import type { WellnessEntry } from '@/types'

type WellnessInput = Pick<WellnessEntry, 'sueno' | 'dolorMuscular' | 'estres' | 'fatiga'>

export function calcularReadiness(entry: WellnessInput): number {
  const suenoInv = entry.sueno
  const dolorInv = 6 - entry.dolorMuscular
  const estresInv = 6 - entry.estres
  const fatigaInv = 6 - entry.fatiga
  return Number(((suenoInv + dolorInv + estresInv + fatigaInv) / 4).toFixed(1))
}

/** Wellness reportado por un atleta en una fecha exacta (por defecto, hoy). */
export function obtenerWellnessDelDia(
  entries: WellnessEntry[],
  athleteId: string,
  fecha: string,
): WellnessEntry | null {
  return entries.find((e) => e.athleteId === athleteId && e.fecha === fecha) ?? null
}
