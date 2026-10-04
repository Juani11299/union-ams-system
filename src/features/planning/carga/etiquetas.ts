import type { BadgeTone } from '@/components/Badge'
import type { NivelAcwr, ResumenCarga } from '@/features/workload/cargaInterna'

export const ACWR_TONE: Record<NivelAcwr, BadgeTone> = { bajo: 'blue', optimo: 'green', precaucion: 'yellow', alto: 'red', 'sin-datos': 'gray' }
export const ACWR_LABEL: Record<NivelAcwr, string> = {
  bajo: '⚪ Subentrenamiento (< 0,8)',
  optimo: '🟢 Zona óptima (0,8–1,3)',
  precaucion: '🟡 Precaución (1,3–1,5)',
  alto: '🔴 Zona de riesgo (> 1,5)',
  'sin-datos': 'Sin datos',
}

export const fmtNum = (v: number | null | undefined, d = 0): string =>
  v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

export const fmtPct = (v: number | null | undefined, d = 0): string => (v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(d).replace('.', ',')} %`)

/** Puntaje para ordenar por nivel de fatiga/carga: mayor = más atención. */
export function puntajeAtencion(r: ResumenCarga): number {
  if (r.estado === 'sin-datos') return -1
  let p = 0
  if (r.riesgo === 'alto') p += 4
  else if (r.riesgo === 'precaucion') p += 2
  if (r.riesgoEwma === 'alto') p += 1
  if (r.spikeSemanal === 'alto') p += 3
  else if (r.spikeSemanal === 'medio') p += 1
  if (r.semanaMonotona) p += 2
  if (r.riesgo === 'bajo') p += 0.5
  // Un dato provisorio cuenta a medias: no debe tapar a un alerta confiable.
  return r.estado === 'provisorio' ? p * 0.6 : p
}

export const ESTADO_BADGE: Record<ResumenCarga['estado'], { tone: BadgeTone; label: string }> = {
  confiable: { tone: 'green', label: 'Dato confiable' },
  provisorio: { tone: 'yellow', label: 'Provisorio' },
  'sin-datos': { tone: 'gray', label: 'Sin datos' },
}
