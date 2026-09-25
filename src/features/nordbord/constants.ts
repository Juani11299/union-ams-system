import type { Lvl, MetricDef, MetricKey, PillarKey } from './types'

/** Umbral de riesgo de isquiotibiales (pierna débil, N) — Timmins et al. 2016 (fútbol profesional). */
export const RISK_N = 337
/** Semáforo de asimetría: < 10 % verde · 10–20 % ámbar · > 20 % rojo. */
export const ASYM_A = 10
export const ASYM_R = 20
/** Días mínimos entre sesiones para considerar una evaluación "anterior" (un re-test del día siguiente es la misma campaña). */
export const PREV_GAP_DAYS = 14

export const CAT_ORDER = ['Primera', 'Reserva', '4ta', '5ta', '6ta', '7ma', '8va', '9na', 'Pre 9na', '10ma', 'Sin categoría']

export const C = {
  green: '#10b981',
  blue: '#0ea5e9',
  orange: '#f97316',
  red: '#ef4444',
  amber: '#f59e0b',
  cyan: '#0891b2',
  violet: '#7c3aed',
  club: '#ED1C24',
}
export const L_COL = C.cyan
export const R_COL = C.violet

/** Posiciones a completar a mano: "Nombre NordBord": "DEF" | "MED" | "DEL" | "ARQ" — habilita el filtro de posición. */
export const POSITIONS: Record<string, string> = {}
/** Correcciones manuales de cruce: "Nombre NordBord": { cat: "4ta", bw: 70.1 }. */
export const MANUAL_MATCH: Record<string, { cat?: string; bw?: number }> = {}

export const METRICS: MetricDef[] = [
  { k: 'forceRel', label: 'Fuerza excéntrica relativa (media I/D)', short: 'Fuerza relativa', u: 'N/kg', d: 2 },
  { k: 'forceMean', label: 'Fuerza excéntrica pico (media I/D)', short: 'Fuerza pico', u: 'N', d: 0 },
  { k: 'weakF', label: 'Fuerza pico · pierna débil', short: 'Pierna débil', u: 'N', d: 0 },
  { k: 'torqueRel', label: 'Torque relativo (media I/D)', short: 'Torque relativo', u: 'Nm/kg', d: 2 },
  { k: 'torque', label: 'Torque pico (media I/D)', short: 'Torque pico', u: 'Nm', d: 0 },
  { k: 'avgForce', label: 'Fuerza media sostenida (media I/D)', short: 'Fuerza media', u: 'N', d: 0 },
  { k: 'impulse', label: 'Impulso excéntrico total (media I/D)', short: 'Impulso', u: 'N·s', d: 0 },
  { k: 'asymAbs', label: 'Asimetría de fuerza pico |I−D|', short: 'Asimetría fuerza', u: '%', d: 1, inv: true },
  { k: 'impAsymAbs', label: 'Asimetría de impulso |I−D|', short: 'Asimetría impulso', u: '%', d: 1, inv: true },
]
export const M = Object.fromEntries(METRICS.map((m) => [m.k, m])) as Record<MetricKey, MetricDef>

/** Métricas de la comparativa "Evaluación actual vs. anterior". */
export const EVO_METS: Record<string, { lab: string; u: string; d: number; inv?: boolean }> = {
  forceMean: { lab: 'Fuerza pico', u: 'N', d: 0 },
  forceRel: { lab: 'Fuerza relativa', u: 'N/kg', d: 2 },
  torqueRel: { lab: 'Torque relativo', u: 'Nm/kg', d: 2 },
  asymAbs: { lab: 'Asimetría lateral', u: '%', d: 1, inv: true },
}

/** Ejes del radar neuromuscular. */
export const PILLARS: Array<{ k: PillarKey; label: [string, string] }> = [
  { k: 'forceMean', label: ['Fuerza pico', '(N)'] },
  { k: 'forceRel', label: ['Fuerza relativa', '(N/kg)'] },
  { k: 'torqueRel', label: ['Torque relativo', '(Nm/kg)'] },
  { k: 'weakF', label: ['Pierna débil', '(N)'] },
  { k: 'avgForce', label: ['Fuerza media', 'sostenida (N)'] },
  { k: 'sym', label: ['Simetría', 'bilateral'] },
]

export const LVL_TXT: Record<Lvl, string> = { g: 'Apto', a: 'Precaución', r: 'Intervención' }
export const LVL_ICO: Record<Lvl, string> = { g: '🟢', a: '🟡', r: '🔴' }
export const LVL_COLOR: Record<Lvl, string> = { g: C.green, a: C.amber, r: C.red }

export type { MetricKey }
