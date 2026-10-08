import type { Athlete, SessionExecution, WellnessEntry } from '@/types'
import { calcularCargaEsperadaDia } from './calculations'
import { desgloseEjecucion, rpeEsperadoDia, zContraGrupo, type ContextoCarga } from './cargaInterna'
import { calcularWellnessScore20, obtenerWellnessDelDia } from '@/features/wellness/calculations'
import { diaSemanaFecha, sumarDiasFecha } from '@/utils/fecha'

/**
 * Control diario del plantel (Control rápido): una fecha civil del club (ART) y TODOS los
 * atletas de la categoría, con quién respondió, quién debe la carga y las métricas de la
 * jornada. Funciones puras sobre el contexto indexado de `cargaInterna.ts`.
 */

/** Discordancia entrenador–atleta: diferencia absoluta entre el RPE percibido y el planificado (puntos CR-10). */
export const UMBRAL_DISCORDANCIA_RPE = 2
/** Sobrecarga del día: sRPE individual por encima de la carga objetivo del cuerpo técnico en más de este porcentaje. */
export const UMBRAL_SOBRECARGA_DIA = 0.2
/** Semanas hacia atrás para el "día habitual" del atleta y mínimo de muestras para mostrarlo. */
export const SEMANAS_BASELINE = 8
export const MIN_MUESTRAS_BASELINE = 3
/** Corte del Readiness (Wellness /20), igual que el resto de la app: ≤ 12 crítico, ≤ 15 atención. */
export const READINESS_CRITICO = 12
export const READINESS_ATENCION = 15

export type EstadoRespuesta = 'completado' | 'pendiente' | 'no-convocado'

export interface FilaDia {
  athleteId: string
  estado: EstadoRespuesta
  rpe: number | null
  /** sRPE del día (UA); null si no respondió o si todavía falta el "Tiempo Total de Trabajo". */
  ua: number | null
  /** Respondió pero la carga no es calculable aún (falta el tiempo real de la sesión). */
  faltaTiempo: boolean
  minCampo: number
  minGimnasio: number
  minOtros: number
  minTotal: number
  rpeEsperado: number | null
  /** RPE percibido − RPE planificado, sólo si la diferencia llega al umbral de discordancia. */
  discordancia: number | null
  /** Media histórica del atleta en ese mismo día de la semana (últimas `SEMANAS_BASELINE`) y desvío del RPE del día contra ella. */
  habitual: { media: number; n: number; delta: number } | null
  /** UA − media del plantel ese día, y su z-score (null con < 3 respondientes o sin variación). */
  deltaMedia: number | null
  z: number | null
  /** sRPE / carga objetivo del día (1 = cumplió exacto). */
  vsObjetivo: number | null
  sobrecarga: boolean
  /** Wellness /20 de ESA fecha (4 ítems de Hooper, 5 = óptimo). */
  readiness: number | null
  comentario: string | null
}

export interface KpisDia {
  /** Atletas que cuentan para la adhesión (activos + quien respondió aunque esté de baja). */
  esperados: number
  respondieron: number
  adhesion: number | null
  cargaMedia: number | null
  cargaObjetivo: number
  /** cargaMedia / cargaObjetivo (null si no hay objetivo o nadie tiene carga calculable). */
  cumplimiento: number | null
  rpeMedia: number | null
  rpeDesvio: number | null
  rpeModa: number | null
  nSobrecarga: number
  nDiscordancia: number
  nPendientes: number
  nNoConvocados: number
}

export interface ResumenDia {
  fecha: string
  hayPlan: boolean
  filas: FilaDia[]
  kpis: KpisDia
}

function ultimoRpe(ejecs: SessionExecution[] | undefined): number | null {
  return ejecs && ejecs.length > 0 ? ejecs[ejecs.length - 1].rpe : null
}

/** RPE medio del atleta en el mismo día de la semana, en las `SEMANAS_BASELINE` semanas anteriores a `fecha`. */
export function habitualDelDia(ctx: ContextoCarga, athleteId: string, fecha: string, rpeDia: number): FilaDia['habitual'] {
  const porFecha = ctx.ejecucionesPorAtleta.get(athleteId)
  if (!porFecha) return null
  const rpes: number[] = []
  for (let k = 1; k <= SEMANAS_BASELINE; k++) {
    const r = ultimoRpe(porFecha.get(sumarDiasFecha(fecha, -7 * k)))
    if (r !== null) rpes.push(r)
  }
  if (rpes.length < MIN_MUESTRAS_BASELINE) return null
  const media = rpes.reduce((s, v) => s + v, 0) / rpes.length
  return { media, n: rpes.length, delta: rpeDia - media }
}

export function nombreDiaSemana(fecha: string): string {
  return ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][diaSemanaFecha(fecha)] ?? ''
}

export function resumenDia(ctx: ContextoCarga, athletes: Athlete[], fecha: string, wellness: WellnessEntry[]): ResumenDia {
  const planes = ctx.planesPorFecha.get(fecha) ?? []
  const cargaObjetivo = planes.length > 0 ? calcularCargaEsperadaDia(planes) : 0
  const rpeEsperado = rpeEsperadoDia(planes)

  const filas: FilaDia[] = athletes.map((a) => {
    const ejecs = ctx.ejecucionesPorAtleta.get(a.id)?.get(fecha) ?? []
    const w = obtenerWellnessDelDia(wellness, a.id, fecha)
    const readiness = w ? calcularWellnessScore20(w) : null
    const nota = [...ejecs].reverse().find((e) => e.comentario?.trim())?.comentario?.trim() ?? w?.comentarioDolor?.trim() ?? null
    const base = { athleteId: a.id, readiness, comentario: nota || null, rpeEsperado }

    if (ejecs.length === 0) {
      return {
        ...base,
        estado: a.estadoSalud === 'Activo' ? 'pendiente' : 'no-convocado',
        rpe: null, ua: null, faltaTiempo: false, minCampo: 0, minGimnasio: 0, minOtros: 0, minTotal: 0,
        discordancia: null, habitual: null, deltaMedia: null, z: null, vsObjetivo: null, sobrecarga: false,
      }
    }

    const rpe = ejecs[ejecs.length - 1].rpe
    let ua: number | null = null
    let minCampo = 0, minGimnasio = 0, minOtros = 0
    for (const e of ejecs) {
      const d = desgloseEjecucion(e, planes)
      if (!d) continue
      ua = (ua ?? 0) + d.total
      minCampo += d.minCampo
      minGimnasio += d.minGimnasio
      minOtros += d.minPartido + d.minOtros
    }
    const dif = rpeEsperado === null ? null : rpe - rpeEsperado
    const vsObjetivo = ua !== null && cargaObjetivo > 0 ? ua / cargaObjetivo : null
    return {
      ...base,
      estado: 'completado',
      rpe,
      ua,
      faltaTiempo: ua === null,
      minCampo, minGimnasio, minOtros,
      minTotal: minCampo + minGimnasio + minOtros,
      discordancia: dif !== null && Math.abs(dif) >= UMBRAL_DISCORDANCIA_RPE ? dif : null,
      habitual: habitualDelDia(ctx, a.id, fecha, rpe),
      deltaMedia: null,
      z: null,
      vsObjetivo,
      sobrecarga: vsObjetivo !== null && vsObjetivo > 1 + UMBRAL_SOBRECARGA_DIA,
    } satisfies FilaDia
  })

  // Z-score diario: cuánto se desvió cada atleta de sus compañeros en LA MISMA jornada.
  const conUa = filas.filter((f) => f.ua !== null)
  if (conUa.length >= 3) {
    const grupo = conUa.map((f) => f.ua as number)
    for (const f of conUa) {
      const { z, delta } = zContraGrupo(f.ua as number, grupo)
      f.z = z
      f.deltaMedia = delta
    }
  }

  const completados = filas.filter((f) => f.estado === 'completado')
  const esperados = filas.filter((f) => f.estado !== 'no-convocado').length
  const rpes = completados.map((f) => f.rpe as number)
  const rpeMedia = rpes.length ? rpes.reduce((s, v) => s + v, 0) / rpes.length : null
  const rpeDesvio = rpes.length > 1 && rpeMedia !== null ? Math.sqrt(rpes.reduce((s, v) => s + (v - rpeMedia) ** 2, 0) / (rpes.length - 1)) : null
  const frecuencia = new Map<number, number>()
  for (const r of rpes) frecuencia.set(r, (frecuencia.get(r) ?? 0) + 1)
  // Moda; ante empate, la de mayor RPE (la lectura conservadora para el control de carga).
  const rpeModa = [...frecuencia.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null
  const uas = conUa.map((f) => f.ua as number)
  const cargaMedia = uas.length ? uas.reduce((s, v) => s + v, 0) / uas.length : null

  return {
    fecha,
    hayPlan: planes.length > 0,
    filas,
    kpis: {
      esperados,
      respondieron: completados.length,
      adhesion: esperados > 0 ? completados.length / esperados : null,
      cargaMedia,
      cargaObjetivo,
      cumplimiento: cargaMedia !== null && cargaObjetivo > 0 ? cargaMedia / cargaObjetivo : null,
      rpeMedia,
      rpeDesvio,
      rpeModa,
      nSobrecarga: filas.filter((f) => f.sobrecarga).length,
      nDiscordancia: filas.filter((f) => f.discordancia !== null).length,
      nPendientes: filas.filter((f) => f.estado === 'pendiente').length,
      nNoConvocados: filas.filter((f) => f.estado === 'no-convocado').length,
    },
  }
}
