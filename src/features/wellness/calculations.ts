import type { WellnessEntry } from '@/types'

type WellnessInput = Pick<WellnessEntry, 'sueno' | 'dolorMuscular' | 'estres' | 'fatiga'>

/**
 * Fase 25 — Normalización de escala: las 4 variables del Índice de Hooper
 * (`sueno`, `dolorMuscular`, `estres`, `fatiga`) se guardan TODAS con la
 * misma convención "5 = óptimo, 1 = pésimo" (antes `dolorMuscular`/`estres`/
 * `fatiga` se guardaban al revés — 5 = mucho dolor/estrés/fatiga — y esta
 * función las invertía acá con `6 - x`). Con las 4 ya normalizadas en el
 * origen (sliders de `MagicLinkView`/`IngresoModal`), sumar directo alcanza
 * y el número crudo de cada campo es legible tal cual se ve en pantalla
 * (ver el desglose de Readiness en `DashboardEquipo`). Requiere haber
 * corrido `migration_fase25_normalizar_hooper.sql` sobre los datos viejos.
 */
export function calcularReadiness(entry: WellnessInput): number {
  return Number(((entry.sueno + entry.dolorMuscular + entry.estres + entry.fatiga) / 4).toFixed(1))
}

/**
 * Puntuación total de Wellness del día sobre 20 (Fase 20) — mismos 4 campos
 * ya normalizados que `calcularReadiness`, sin promediar, para compararla
 * contra el umbral de riesgo "< 12 sobre 20" del Dashboard de Riesgo.
 */
export function calcularWellnessScore20(entry: WellnessInput): number {
  return entry.sueno + entry.dolorMuscular + entry.estres + entry.fatiga
}

/** Wellness reportado por un atleta en una fecha exacta (por defecto, hoy). */
export function obtenerWellnessDelDia(
  entries: WellnessEntry[],
  athleteId: string,
  fecha: string,
): WellnessEntry | null {
  return entries.find((e) => e.athleteId === athleteId && e.fecha === fecha) ?? null
}
