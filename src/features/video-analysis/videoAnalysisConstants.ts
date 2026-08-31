import type { EventoTipoTag, FaseJuego, BandaCancha, CarrilCancha, ZonaCancha, VideoTag } from '@/types'

/** Botones de tagging rápido (Paso 2) — orden = orden de aparición en el panel. `tecla` = atajo de teclado (Fase 34.2, Paso 1). */
export const EVENTOS_TAG: { tipo: EventoTipoTag; icono: string; label: string; tecla: string }[] = [
  { tipo: 'gol', icono: '⚽', label: 'Gol', tecla: 'G' },
  { tipo: 'perdida_salida', icono: '🔴', label: 'Pérdida en salida', tecla: 'P' },
  { tipo: 'recuperacion_campo_rival', icono: '🟢', label: 'Recuperación campo rival', tecla: 'R' },
  { tipo: 'tiro_libre', icono: '🎯', label: 'Tiro libre', tecla: 'L' },
  { tipo: 'falta', icono: '🟨', label: 'Falta', tecla: 'F' },
  { tipo: 'transicion', icono: '⚡', label: 'Transición', tecla: 'T' },
]

export const EVENTO_LABEL: Record<EventoTipoTag, string> = Object.fromEntries(
  EVENTOS_TAG.map((e) => [e.tipo, e.label]),
) as Record<EventoTipoTag, string>

export const EVENTO_ICONO: Record<EventoTipoTag, string> = Object.fromEntries(
  EVENTOS_TAG.map((e) => [e.tipo, e.icono]),
) as Record<EventoTipoTag, string>

/** Atajo de teclado (una tecla) → tipo de evento (Fase 34.2, Paso 1) — ver el `useEffect` de `LiveTaggingView`. */
export const ATAJOS_TECLADO: Record<string, EventoTipoTag> = Object.fromEntries(
  EVENTOS_TAG.map((e) => [e.tecla, e.tipo]),
)

/**
 * Fase de juego por defecto de cada tipo de evento (Paso 3 original) —
 * usada cuando `sugerirContexto` no encuentra un evento reciente que
 * justifique pisarla (ver más abajo).
 */
export const FASE_POR_EVENTO: Record<EventoTipoTag, FaseJuego> = {
  gol: 'ataque_organizado',
  perdida_salida: 'transicion_defensiva',
  recuperacion_campo_rival: 'transicion_ofensiva',
  tiro_libre: 'abp',
  falta: 'defensa',
  transicion: 'transicion_ofensiva',
}

export const FASE_LABEL: Record<FaseJuego, string> = {
  ataque_organizado: 'Ataque organizado',
  defensa: 'Defensa',
  transicion_ofensiva: 'Transición ofensiva',
  transicion_defensiva: 'Transición defensiva',
  abp: 'ABP',
}

// ---------------------------------------------------------------------------
// Matriz de Zonas de la Cancha (Fase 34.2, Paso 2) — 6 bandas × 3 carriles.
// ---------------------------------------------------------------------------

export const BANDA_LABEL: Record<BandaCancha, string> = {
  iniciacion_propia: 'Iniciación propia',
  creacion_propia: 'Creación propia',
  finalizacion_propia: 'Finalización propia',
  finalizacion_rival: 'Finalización rival',
  creacion_rival: 'Creación rival',
  iniciacion_rival: 'Iniciación rival',
}

export const CARRIL_LABEL: Record<CarrilCancha, string> = {
  izquierdo: 'Carril izquierdo',
  central: 'Carril central',
  derecho: 'Carril derecho',
}

/** Orden longitudinal de las 6 bandas (izq→der en la Pizarra = fondo propio → fondo rival). */
export const ORDEN_BANDAS: BandaCancha[] = [
  'iniciacion_propia',
  'creacion_propia',
  'finalizacion_propia',
  'finalizacion_rival',
  'creacion_rival',
  'iniciacion_rival',
]

export const ORDEN_CARRILES: CarrilCancha[] = ['izquierdo', 'central', 'derecho']

/** Las 18 zonas de la matriz, en orden de grilla (fila = carril, columna = banda). */
export const ZONAS_CANCHA: ZonaCancha[] = ORDEN_CARRILES.flatMap((carril) =>
  ORDEN_BANDAS.map((banda) => ({ banda, carril })),
)

export function zonaLabel(zona: ZonaCancha): string {
  return `${BANDA_LABEL[zona.banda]} · ${CARRIL_LABEL[zona.carril]}`
}

export function zonasIguales(a: ZonaCancha | null, b: ZonaCancha | null): boolean {
  if (!a || !b) return a === b
  return a.banda === b.banda && a.carril === b.carril
}

/**
 * Coordenadas normalizadas (0-1, x=izquierda→derecha del gráfico, y=arriba→abajo)
 * del CENTRO de una zona — el consumidor multiplica por el ancho/alto real
 * (`TacticalCanvas2D` usa su viewBox 700x450, el mini-gráfico del informe
 * usa el suyo propio). Cancha horizontal: banda = columna, carril = fila.
 */
export function coordenadasDeZona(zona: ZonaCancha): { x: number; y: number } {
  const col = ORDEN_BANDAS.indexOf(zona.banda)
  const fila = ORDEN_CARRILES.indexOf(zona.carril)
  const x = (col + 0.5) / ORDEN_BANDAS.length
  const y = (fila + 0.5) / ORDEN_CARRILES.length
  return { x, y }
}

// ---------------------------------------------------------------------------
// Smart Context Tagging (Fase 34.2, Paso 1) — heurística explícita sobre el
// HISTORIAL DE TAGS YA CARGADOS, no un modelo de IA/visión por computadora:
// este módulo nunca procesa el video en sí, sólo la secuencia de eventos
// que el propio analista fue marcando. Es "inteligente" en el sentido de
// "usa contexto reciente para ahorrarle un click al profe", no en el
// sentido de detección automática por imagen.
// ---------------------------------------------------------------------------

const VENTANA_CONTEXTO_SEGUNDOS = 5

export interface SugerenciaContexto {
  fase: FaseJuego
  zona: ZonaCancha | null
  /** Explica en una frase por qué se sugirió esto — transparencia, mismo criterio que `AlertaGeneralRiesgo.motivo` del motor de riesgo. */
  motivo: string
}

/**
 * Sugiere fase y zona para un evento nuevo mirando los tags de los últimos
 * `VENTANA_CONTEXTO_SEGUNDOS` segundos del MISMO partido:
 *
 * - Si el evento más reciente en la ventana fue una pérdida (`perdida_salida`),
 *   todo lo que pase justo después es, tácticamente, Transición Defensiva
 *   (recién perdimos la pelota, el equipo tiene que reorganizarse atrás).
 * - Si fue una recuperación (`recuperacion_campo_rival`) o una transición ya
 *   marcada, lo que sigue es Transición Ofensiva (recién la recuperamos,
 *   estamos en contraataque).
 * - Sin evento reciente relevante, cae al default estático de `FASE_POR_EVENTO`.
 *
 * La zona sugerida es la del evento reciente más cercano en el tiempo (una
 * secuencia de juego suele mantenerse en la misma zona de cancha por unos
 * segundos) — `null` si no hay ningún tag reciente con zona cargada.
 */
export function sugerirContexto(
  tagsDelPartido: VideoTag[],
  timestampActual: number,
  tipoNuevo: EventoTipoTag,
): SugerenciaContexto {
  const recientes = tagsDelPartido
    .filter((t) => {
      const delta = timestampActual - t.timestampSegundos
      return delta >= 0 && delta <= VENTANA_CONTEXTO_SEGUNDOS
    })
    .sort((a, b) => b.timestampSegundos - a.timestampSegundos)

  const masReciente = recientes[0]

  if (!masReciente) {
    return {
      fase: FASE_POR_EVENTO[tipoNuevo],
      zona: null,
      motivo: 'Sin eventos recientes cerca — fase por defecto del tipo de evento.',
    }
  }

  const segundosDesde = (timestampActual - masReciente.timestampSegundos).toFixed(1)

  if (masReciente.tipo === 'perdida_salida') {
    return {
      fase: 'transicion_defensiva',
      zona: masReciente.zona,
      motivo: `Hubo una Pérdida en salida hace ${segundosDesde}s — se sugiere Transición Defensiva.`,
    }
  }

  if (masReciente.tipo === 'recuperacion_campo_rival' || masReciente.tipo === 'transicion') {
    return {
      fase: 'transicion_ofensiva',
      zona: masReciente.zona,
      motivo: `Hubo una Recuperación/Transición hace ${segundosDesde}s — se sugiere Transición Ofensiva.`,
    }
  }

  return {
    fase: FASE_POR_EVENTO[tipoNuevo],
    zona: masReciente.zona,
    motivo: `Fase por defecto del tipo de evento — zona heredada del último tag (hace ${segundosDesde}s).`,
  }
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
