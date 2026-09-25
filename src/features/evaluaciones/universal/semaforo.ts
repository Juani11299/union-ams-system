/**
 * Semáforo clínico estricto de asimetrías (Fase 47, pedido explícito):
 * < 5 % verde · 5–10 % amarillo · > 10 % rojo. Se aplica sobre el valor absoluto
 * a TODA métrica cuyo nombre indique asimetría (ver `esAsim` en `datos.ts`).
 */
export const ASIM_VERDE = 5
export const ASIM_ROJO = 10

export type AsimLvl = 'g' | 'a' | 'r' | 'n'

export const asymLvlGenerico = (v: number | null | undefined): AsimLvl =>
  typeof v !== 'number' || !Number.isFinite(v) ? 'n' : Math.abs(v) < ASIM_VERDE ? 'g' : Math.abs(v) <= ASIM_ROJO ? 'a' : 'r'

export const ASIM_TXT: Record<AsimLvl, string> = { g: 'Aceptable', a: 'Precaución', r: 'Alerta médica', n: '—' }
export const ASIM_COLOR: Record<AsimLvl, string> = { g: '#10b981', a: '#f59e0b', r: '#ef4444', n: '#64748b' }
