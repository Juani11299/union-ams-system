import type { SessionExecution, SessionPlan } from '@/types'
import { diaSemanaFecha } from '@/utils/fecha'
import { defaultsSesionParaFecha, DURACION_CAMPO_BASE_MIN } from './matrizClub'

export { DURACION_CAMPO_BASE_MIN }

// ─────────────────────────────────────────────────────────────────────────────
// Fallback para RPE en días SIN sesión planificada (Fase 49)
// ─────────────────────────────────────────────────────────────────────────────

/** Duración estándar de un partido por categoría (min) cuando no hay minutos jugados registrados. */
const DURACION_PARTIDO_POR_CATEGORIA: Array<{ patron: RegExp; minutos: number }> = [
  { patron: /\b(9na|8va)\b/, minutos: 70 },
  { patron: /\b(7ma|6ta)\b/, minutos: 80 },
]
/** Fallback seguro cuando la categoría no está en la tabla (o no se conoce). */
export const DURACION_PARTIDO_FALLBACK_MIN = 70

const categoriasPorId = new Map<string, string>()

/**
 * Registra los nombres de las categorías del club para poder resolver la duración
 * estándar de partido de cada una. Lo llama `useAppStore` cada vez que cambian
 * las categorías; así `calcularCargaEjecutadaReal` sigue siendo una función con
 * la misma firma (sin tener que pasar los nombres por todos los callers).
 */
export function registrarCategorias(categorias: Array<{ id: string; nombre: string }>): void {
  categoriasPorId.clear()
  for (const c of categorias) categoriasPorId.set(c.id, c.nombre)
}

export function duracionPartidoCategoria(nombreCategoria: string | undefined): number {
  const n = (nombreCategoria ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return DURACION_PARTIDO_POR_CATEGORIA.find((c) => c.patron.test(n))?.minutos ?? DURACION_PARTIDO_FALLBACK_MIN
}

export interface BaseSinSesion {
  minutos: number
  /** `partido` se contabiliza como Partido; `campo` como Campo (el regenerativo del domingo también es trabajo de campo). */
  tipo: 'campo' | 'partido'
  etiqueta: string
}

/**
 * Duración que se asume cuando un jugador manda RPE un día SIN ninguna sesión
 * planificada (para esa temporada+categoría). El trabajo de campo nunca es
 * cero: que no haya sesión cargada significa que no hubo pesas.
 *  · Lunes a Viernes → Campo base de la matriz del club (`defaultsSesionParaFecha`, 90 min).
 *  · Sábado (Match Day) → los minutos jugados si el jugador los tiene registrados
 *    (`ejecucion.duracionMin`); si no, la duración estándar de partido de su categoría
 *    (9na/8va 70′, 7ma/6ta 80′, resto 70′) — no 90′ cerrados.
 *  · Domingo → la base regenerativa genérica de `defaultsSesionParaFecha` (60 min).
 */
export function baseSinSesion(ejecucion: SessionExecution): BaseSinSesion {
  const dia = diaSemanaFecha(ejecucion.fecha)
  if (dia === 6) {
    if (ejecucion.duracionMin > 0) return { minutos: ejecucion.duracionMin, tipo: 'partido', etiqueta: `Partido (${ejecucion.duracionMin}m jugados)` }
    const min = duracionPartidoCategoria(categoriasPorId.get(ejecucion.category_id))
    return { minutos: min, tipo: 'partido', etiqueta: `Partido (${min}m estándar de la categoría)` }
  }
  const base = defaultsSesionParaFecha(ejecucion.fecha)
  if (dia === 0) return { minutos: base.duracionEstimadaMin, tipo: 'campo', etiqueta: `Regenerativo (Base ${base.duracionEstimadaMin}m)` }
  return { minutos: base.duracionEstimadaMin, tipo: 'campo', etiqueta: `Campo (Base ${base.duracionEstimadaMin}m)` }
}

/**
 * Carga interna real ejecutada por un jugador — Fase 9.2: el jugador sólo
 * manda su RPE, la duración ("Tiempo Total de Trabajo") la carga el profe en
 * el plan de ese día (`SessionPlan.duracionRealMin`). Cruza ambos dinámicamente
 * en vez de confiar en un valor guardado en el momento del envío.
 *
 * Fase 13 ("Doble Turno"): un día puede tener MÁS DE UN `SessionPlan` (ej.
 * Campo + Gimnasio) — el sRPE del día es la sumatoria del sRPE de cada sesión
 * de ese día que ya tenga `duracionRealMin` cargado (una sesión sin duración
 * todavía simplemente no suma, no bloquea a las demás). El jugador sigue
 * mandando UN solo RPE por día (no se le pide discriminar por sesión), así
 * que ese mismo RPE se aplica contra la duración de cada sesión del día.
 *
 * Excepción — sesiones `Partido` (Fase 11, "Día de Partido"): ahí la duración
 * NO es compartida por todo el equipo (cada jugador juega minutos distintos),
 * así que se usa directo `ejecucion.duracionMin` (real, por atleta, cargado
 * desde el Registro de Minutos) en vez de `plan.duracionRealMin` — un partido
 * nunca comparte día con otra sesión en la práctica, pero si lo hiciera, la
 * regla de Partido tiene prioridad y el resto de las sesiones de ese día se
 * ignoran (evita mezclar "minutos jugados" con "duración de equipo").
 *
 * Fallback a la sesión BASE del club (Fase 49, ajustado en Fase 50): si el día NO
 * tiene ninguna sesión planificada para esa temporada+categoría, el jugador igual
 * entrenó (el trabajo de campo nunca es cero; que no haya sesión cargada significa
 * que no hubo pesas) y el RPE se calcula con la duración de `baseSinSesion`: Lun–Vie
 * 90′ de campo, Sábado minutos jugados o duración estándar de partido de la
 * categoría, Domingo 60′ regenerativos — en vez de descartar el RPE. Si el día SÍ tiene sesión planificada se mantiene la lógica integrada
 * de siempre (Campo + Gimnasio, sin tocar nada).
 *
 * Devuelve `null` ("Falta tiempo") si el día tiene sesión planificada pero
 * ninguna tiene todavía la duración real cargada.
 */
export function calcularCargaEjecutadaReal(
  ejecucion: SessionExecution,
  sessionPlans: SessionPlan[],
): number | null {
  const planesDelDia = sessionPlans.filter(
    (p) =>
      p.fecha === ejecucion.fecha &&
      p.season_id === ejecucion.season_id &&
      p.category_id === ejecucion.category_id,
  )
  if (planesDelDia.length === 0) return ejecucion.rpe * baseSinSesion(ejecucion).minutos

  const partido = planesDelDia.find((p) => p.tipo === 'Partido')
  if (partido) {
    if (ejecucion.duracionMin === 0) return null
    return ejecucion.rpe * ejecucion.duracionMin
  }

  const sesionesConDuracion = planesDelDia.filter((p) => p.duracionRealMin !== undefined)
  if (sesionesConDuracion.length === 0) return null
  return sesionesConDuracion.reduce((sum, p) => sum + ejecucion.rpe * (p.duracionRealMin ?? 0), 0)
}
