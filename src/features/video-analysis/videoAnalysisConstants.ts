import type { EventoTipoTag, FaseJuego } from '@/types'

/** Botones de tagging rápido (Paso 2) — orden = orden de aparición en el panel. */
export const EVENTOS_TAG: { tipo: EventoTipoTag; icono: string; label: string }[] = [
  { tipo: 'gol', icono: '⚽', label: 'Gol' },
  { tipo: 'perdida_salida', icono: '🔴', label: 'Pérdida en salida' },
  { tipo: 'recuperacion_campo_rival', icono: '🟢', label: 'Recuperación campo rival' },
  { tipo: 'tiro_libre', icono: '🎯', label: 'Tiro libre' },
  { tipo: 'falta', icono: '🟨', label: 'Falta' },
  { tipo: 'transicion', icono: '⚡', label: 'Transición' },
]

export const EVENTO_LABEL: Record<EventoTipoTag, string> = Object.fromEntries(
  EVENTOS_TAG.map((e) => [e.tipo, e.label]),
) as Record<EventoTipoTag, string>

export const EVENTO_ICONO: Record<EventoTipoTag, string> = Object.fromEntries(
  EVENTOS_TAG.map((e) => [e.tipo, e.icono]),
) as Record<EventoTipoTag, string>

/**
 * Fase de juego por defecto de cada tipo de evento (Paso 3, filtro por
 * "Ataque organizado / Defensa / ABP") — el profe puede corregirla al
 * cargar el tag (ej. una pérdida en salida que en realidad ocurrió en plena
 * transición), pero esto cubre el caso típico con un solo click.
 */
export const FASE_POR_EVENTO: Record<EventoTipoTag, FaseJuego> = {
  gol: 'ataque_organizado',
  perdida_salida: 'defensa',
  recuperacion_campo_rival: 'transicion',
  tiro_libre: 'abp',
  falta: 'defensa',
  transicion: 'transicion',
}

export const FASE_LABEL: Record<FaseJuego, string> = {
  ataque_organizado: 'Ataque organizado',
  defensa: 'Defensa',
  abp: 'ABP',
  transicion: 'Transición',
}

/** `true` si el link es de VEO (`app.veo.co/...` o `veo.co/...`) — determina si el reproductor usa el Cronómetro Manual (VEO rechaza ser embebido, confirmado en producción) o `<video>` nativo (control total). Ver nota de capacidad en `VideoPlayerModule.tsx`. */
export function esUrlVeo(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host.endsWith('veo.co') || host.endsWith('veo.com')
  } catch {
    return false
  }
}

/** `mm:ss` (o `h:mm:ss` si pasa la hora) a partir de segundos totales — mismo formato en player, tags y reporte. */
export function formatTimestamp(segundosTotales: number): string {
  const segundos = Math.max(0, Math.round(segundosTotales))
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
