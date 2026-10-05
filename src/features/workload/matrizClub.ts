import type { TipoSesion } from '@/types'
import { diaSemanaFecha } from '@/utils/fecha'

/**
 * Matriz fija de RPE Esperado de Campo por día de semana (Fase 40) — el
 * microciclo estándar del club: sube de Lunes a Miércoles (pico MD-3), baja
 * Jueves-Viernes (descarga previa al partido). Sábado es día de Partido
 * (RPE alto fijo, no un bloque de Campo más). Domingo no tiene valor
 * definido a propósito — no se inventa un número que nadie pidió, se deja
 * el default genérico de siempre.
 * `Date.getDay()`: 0=domingo, 1=lunes, …, 6=sábado.
 */
const RPE_CAMPO_POR_DIA: Record<number, number> = {
  1: 4, // Lunes
  2: 8, // Martes
  3: 9, // Miércoles
  4: 7, // Jueves
  5: 4, // Viernes
  6: 9, // Sábado — día de Partido
}


/** Duración base del trabajo de campo del club (minutos). */
export const DURACION_CAMPO_BASE_MIN = 90

export interface DefaultsSesionDia {
  tipo: TipoSesion
  duracionEstimadaMin: number
  rpeEsperado: number
  /** `false` en Domingo (sin matriz del club definida) — cae en genéricos 60min/RPE5, no en una base real. */
  esBaseDelClub: boolean
}

/**
 * Defaults sugeridos al crear una sesión nueva, según el día de semana de
 * `fecha` (Fase 40) — 90 min de Campo + el RPE fijo de la matriz del club
 * de lunes a viernes; sábado sugiere directo un Partido (90 min, RPE 9) en
 * vez de una sesión de Campo más. Domingo no tiene matriz definida, así que
 * devuelve los genéricos de siempre (60 min / RPE 5), marcados
 * `esBaseDelClub: false` para que la UI (Fase 41) no muestre un cartel de
 * "esto es lo que toma hoy" con un número que en realidad no representa
 * ninguna base real del club.
 *
 * Deliberadamente NO toca datos ya guardados ni recalcula carga histórica
 * — sólo cambia el valor con el que arranca el formulario; el profe lo
 * ajusta como cualquier otro día.
 */
export function defaultsSesionParaFecha(fecha: string): DefaultsSesionDia {
  const diaSemana = diaSemanaFecha(fecha)
  const rpeCampo = RPE_CAMPO_POR_DIA[diaSemana]
  if (rpeCampo === undefined) {
    return { tipo: 'Campo', duracionEstimadaMin: 60, rpeEsperado: 5, esBaseDelClub: false }
  }
  if (diaSemana === 6) {
    return { tipo: 'Partido', duracionEstimadaMin: DURACION_CAMPO_BASE_MIN, rpeEsperado: rpeCampo, esBaseDelClub: true }
  }
  return { tipo: 'Campo', duracionEstimadaMin: DURACION_CAMPO_BASE_MIN, rpeEsperado: rpeCampo, esBaseDelClub: true }
}
