import type { SessionExecution, SessionPlan } from '@/types'

/**
 * Duración base del trabajo de campo del club (minutos). Es la misma base de 90
 * min de la matriz de `defaultsSesionParaFecha` (Fase 40, `calculations.ts`); se
 * define acá para que `calcularCargaEjecutadaReal` no tenga que importar
 * `calculations.ts` (import circular).
 */
export const DURACION_CAMPO_BASE_MIN = 90

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
 * Fallback a la sesión BASE del club (Fase 49): si el día NO tiene ninguna sesión
 * planificada para esa temporada+categoría, el jugador igual entrenó en cancha
 * (el trabajo de campo nunca es cero; que no haya sesión cargada significa que
 * no hubo pesas). Se calcula como Campo base: `RPE × 90 min`, en vez de descartar
 * el RPE. Si el día SÍ tiene sesión planificada se mantiene la lógica integrada
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
  if (planesDelDia.length === 0) return ejecucion.rpe * DURACION_CAMPO_BASE_MIN

  const partido = planesDelDia.find((p) => p.tipo === 'Partido')
  if (partido) {
    if (ejecucion.duracionMin === 0) return null
    return ejecucion.rpe * ejecucion.duracionMin
  }

  const sesionesConDuracion = planesDelDia.filter((p) => p.duracionRealMin !== undefined)
  if (sesionesConDuracion.length === 0) return null
  return sesionesConDuracion.reduce((sum, p) => sum + ejecucion.rpe * (p.duracionRealMin ?? 0), 0)
}
