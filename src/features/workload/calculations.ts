import type { SessionExecution, SessionPlan } from '@/types'

export function calcularCargaInterna(rpe: number, duracionMin: number): number {
  return rpe * duracionMin
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
 * Devuelve `null` ("Falta tiempo") si ninguna sesión del día tiene todavía la
 * duración real cargada.
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
  if (planesDelDia.length === 0) return null

  const partido = planesDelDia.find((p) => p.tipo === 'Partido')
  if (partido) {
    if (ejecucion.duracionMin === 0) return null
    return ejecucion.rpe * ejecucion.duracionMin
  }

  const sesionesConDuracion = planesDelDia.filter((p) => p.duracionRealMin !== undefined)
  if (sesionesConDuracion.length === 0) return null
  return sesionesConDuracion.reduce((sum, p) => sum + ejecucion.rpe * (p.duracionRealMin ?? 0), 0)
}

/** Color del semáforo de RPE (0-10), de verde a rojo. */
export function colorRpe(rpe: number): string {
  if (rpe <= 2) return '#22c55e'
  if (rpe <= 4) return '#84cc16'
  if (rpe <= 6) return '#f59e0b'
  if (rpe <= 8) return '#f97316'
  return '#ef4444'
}

export type NivelRiesgoAcwr = 'bajo' | 'optimo' | 'precaucion' | 'alto' | 'sin-datos'

export interface AcwrResult {
  cargaAguda: number
  cargaCronica: number
  acwr: number | null
  riesgo: NivelRiesgoAcwr
}

const DIA_MS = 24 * 60 * 60 * 1000

function dentroDeVentana(fecha: string, referencia: Date, dias: number): boolean {
  const diff = referencia.getTime() - new Date(fecha).getTime()
  return diff >= 0 && diff < dias * DIA_MS
}

export function calcularAcwr(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteId: string,
  fechaReferencia: Date = new Date(),
): AcwrResult {
  const propias = ejecuciones.filter((e) => e.athleteId === athleteId)

  const agudas = propias.filter((e) => dentroDeVentana(e.fecha, fechaReferencia, 7))
  const cronicas = propias.filter((e) => dentroDeVentana(e.fecha, fechaReferencia, 28))

  const cargaAguda = agudas.reduce((sum, e) => sum + (calcularCargaEjecutadaReal(e, sessionPlans) ?? 0), 0)
  const cargaCronicaTotal = cronicas.reduce(
    (sum, e) => sum + (calcularCargaEjecutadaReal(e, sessionPlans) ?? 0),
    0,
  )
  const cargaCronica = cargaCronicaTotal / 4

  if (cargaCronica === 0) {
    return { cargaAguda, cargaCronica, acwr: null, riesgo: 'sin-datos' }
  }

  const acwr = cargaAguda / cargaCronica

  let riesgo: NivelRiesgoAcwr
  if (acwr < 0.8) riesgo = 'bajo'
  else if (acwr <= 1.3) riesgo = 'optimo'
  else if (acwr <= 1.5) riesgo = 'precaucion'
  else riesgo = 'alto'

  return { cargaAguda, cargaCronica, acwr, riesgo }
}

export function calcularSRpeSemana(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteId: string,
  fechaReferencia: Date = new Date(),
): number {
  return ejecuciones
    .filter((e) => e.athleteId === athleteId && dentroDeVentana(e.fecha, fechaReferencia, 7))
    .reduce((sum, e) => sum + (calcularCargaEjecutadaReal(e, sessionPlans) ?? 0), 0)
}

export type ToneComparacion = 'green' | 'yellow' | 'red' | 'gray'

export interface Comparacion {
  ejecutado: number | null
  ratio: number | null
  tone: ToneComparacion
  label: string
}

/** Compara la carga ejecutada contra la carga objetivo de una sesión planificada. */
export function compararConObjetivo(ejecutado: number | null, objetivo: number): Comparacion {
  if (ejecutado === null) {
    return { ejecutado: null, ratio: null, tone: 'gray', label: 'Pendiente' }
  }
  const ratio = ejecutado / objetivo
  if (ratio > 1.15) {
    return {
      ejecutado,
      ratio,
      tone: 'red',
      label: `+${Math.round((ratio - 1) * 100)}% sobre objetivo`,
    }
  }
  if (ratio < 0.85) {
    return {
      ejecutado,
      ratio,
      tone: 'yellow',
      label: `-${Math.round((1 - ratio) * 100)}% bajo objetivo`,
    }
  }
  return { ejecutado, ratio, tone: 'green', label: 'En objetivo' }
}

export function calcularSerieUltimos7Dias(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteId: string,
  fechaReferencia: Date = new Date(),
): number[] {
  const dias: number[] = new Array(7).fill(0)
  const propias = ejecuciones.filter((e) => e.athleteId === athleteId)

  for (const ejecucion of propias) {
    const diff = fechaReferencia.getTime() - new Date(ejecucion.fecha).getTime()
    if (diff < 0 || diff >= 7 * DIA_MS) continue
    const indiceDesdeHoy = Math.floor(diff / DIA_MS)
    const indice = 6 - indiceDesdeHoy
    if (indice >= 0 && indice < 7) {
      dias[indice] += calcularCargaEjecutadaReal(ejecucion, sessionPlans) ?? 0
    }
  }

  return dias
}
