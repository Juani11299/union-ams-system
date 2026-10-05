import type { SessionExecution, SessionPlan, WellnessEntry } from '@/types'
import { calcularWellnessScore20 } from '@/features/wellness/calculations'
import { fechaHoyLocal, diferenciaDias as diferenciaDiasLocal, inicioSemanaFecha, sumarDiasFecha } from '@/utils/fecha'
import { calcularCargaEjecutadaReal } from './cargaEjecutada'
import { campoBaseImplicito, DURACION_CAMPO_BASE_MIN } from './matrizClub'
import { construirContexto, resumenCarga, type EstadoDato } from './cargaInterna'

export function calcularCargaInterna(rpe: number, duracionMin: number): number {
  return rpe * duracionMin
}

// La matriz base del club (RPE de Campo por día, 90 min) vive en `matrizClub.ts` (la usa también el fallback de `cargaEjecutada.ts` sin import circular).
export { defaultsSesionParaFecha, type DefaultsSesionDia } from './matrizClub'

/**
 * sRPE Esperado del día combinando TODAS las sesiones planificadas (Fase 40
 * — "Opción A: Suma de Volúmenes y Ponderación de Intensidad"). Evita que
 * Campo + Gimnasio el mismo día disparen la carga sumando linealmente dos
 * `cargaObjetivo` calculados por separado, como si fueran dos sesiones
 * completamente aisladas del método de Foster en vez de un único bloque de
 * estrés diario.
 *
 * Regla (estándar sRPE de Foster): si el día tiene Campo Y Gimnasio (sin
 * Partido de por medio), el sRPE esperado del día es
 * `minutos totales del día × RPE predominante` (el más alto de los RPE
 * Esperado de esas sesiones) — UNA sola sesión de entrenamiento con UNA
 * sola intensidad representativa, exactamente el criterio real de "session
 * RPE": no importa si el pico de esfuerzo fue en el bloque de Campo o en
 * el de Gimnasio, el día entero queda coloreado por esa intensidad
 * predominante, no diluido promediándola con el bloque más liviano.
 * (Antes esta función usaba un factor de atenuación 0.7 inventado sin
 * respaldo científico sobre el bloque de menor `cargaObjetivo` — se sacó:
 * comparaba el resultado contra la suma de dos sRPE calculados por
 * separado, que es justamente el número irreal que había que evitar, no
 * una meta a igualar o superar.)
 *
 * Cualquier otro caso (una sola sesión, día de Partido, dos sesiones del
 * mismo tipo) usa la suma simple de siempre — es exactamente lo que ya se
 * guarda en `cargaObjetivo` de cada sesión desde Fase 14, no hay
 * ambigüedad que resolver ahí.
 *
 * `rpeEsperado` es opcional en sesiones viejas (pre-Fase 14) — si falta, se
 * reconstruye desde `cargaObjetivo / duracionEstimadaMin` en vez de asumir
 * 0, para no subestimar el RPE predominante de una sesión histórica.
 */
export function calcularCargaEsperadaDia(sesiones: SessionPlan[]): number {
  const sumaSimple = sesiones.reduce((sum, s) => sum + s.cargaObjetivo, 0)

  // Fase 52 — Lun–Vie con Gimnasio y sin Campo planificado: el Campo base (90 min, RPE de la matriz) existe
  // igual. Foster: minutos totales (90 + gimnasio) × RPE predominante (el más alto de los bloques).
  const campoImplicito = campoBaseImplicito(sesiones)
  if (campoImplicito) {
    const minutos = campoImplicito.minutos + sesiones.reduce((sum, s) => sum + s.duracionEstimadaMin, 0)
    const rpe = Math.max(
      campoImplicito.rpe,
      ...sesiones.map((s) => s.rpeEsperado ?? (s.duracionEstimadaMin > 0 ? s.cargaObjetivo / s.duracionEstimadaMin : 0)),
    )
    return Math.round(minutos * rpe)
  }

  if (sesiones.length <= 1) return sumaSimple

  const tienePartido = sesiones.some((s) => s.tipo === 'Partido')
  const tieneCampo = sesiones.some((s) => s.tipo === 'Campo')
  const tieneGimnasio = sesiones.some((s) => s.tipo === 'Gimnasio')
  if (tienePartido || !tieneCampo || !tieneGimnasio) return sumaSimple

  const minutosTotales = sesiones.reduce((sum, s) => sum + s.duracionEstimadaMin, 0)
  const rpePredominante = Math.max(
    ...sesiones.map(
      (s) => s.rpeEsperado ?? (s.duracionEstimadaMin > 0 ? s.cargaObjetivo / s.duracionEstimadaMin : 0),
    ),
  )
  return minutosTotales * rpePredominante
}

// `calcularCargaEjecutadaReal` vive en `cargaEjecutada.ts` (evita un import circular con el motor de `cargaInterna.ts`).
export { calcularCargaEjecutadaReal, DURACION_CAMPO_BASE_MIN }

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
  /** Días con dato real de RPE dentro de la ventana crónica (28 días). */
  diasConDatos: number
  /**
   * `true` mientras el dato NO es confiable (cobertura < 70 % de las sesiones
   * planificadas, o menos de 4 sesiones con RPE): el ACWR se muestra igual —con
   * imputación conservadora de los faltantes— pero no dispara alertas (ver
   * `calcularAlertaGeneralRiesgo`). Ya NO es un bloqueo: antes exigía 21 días
   * distintos de reporte y casi nadie lo alcanzaba.
   */
  enPeriodoGracia: boolean
  // ── Fase 48 (motor de `cargaInterna.ts`) ──
  estadoDato: EstadoDato
  /** Sesiones planificadas con RPE real / planificadas en 28 días (0–1). */
  cobertura: number | null
  diasImputados: number
  motivoEstado: string
  /** ACWR por EWMA (λ = 2/(N+1)), más estable que el de promedios móviles ante baches de datos. */
  acwrEwma: number | null
  riesgoEwma: NivelRiesgoAcwr
  /** Carga de los últimos 7 días vs los 7 anteriores (0.12 = +12 %). */
  variacionSemanal: number | null
  spikeSemanal: 'alto' | 'medio' | 'ok' | null
  monotonia: number | null
  strain: number | null
}

/**
 * Período de calibración legado (Fase 33). Se conserva la constante porque el
 * Dashboard la importa, pero el ACWR ya no se bloquea por ella: ver
 * `COBERTURA_MINIMA` en `cargaInterna.ts`.
 */
export const UMBRAL_DIAS_CALIBRACION = 21

/**
 * ACWR de un atleta al cierre de `fechaReferencia` (día civil del club). Fase 48:
 * delega en el motor de `cargaInterna.ts` — serie diaria continua en fechas
 * YYYY-MM-DD (sin `Date` + horas, así no depende de la hora del día ni de la
 * zona del dispositivo), imputación conservadora de los días planificados sin
 * RPE, y ACWR tanto por promedios móviles como por EWMA.
 */
export function calcularAcwr(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteId: string,
  fechaReferencia: Date = new Date(),
): AcwrResult {
  const r = resumenCarga(construirContexto(ejecuciones, sessionPlans), athleteId, fechaHoyLocal(fechaReferencia))
  const sinDatos = r.estado === 'sin-datos'
  return {
    cargaAguda: r.aguda,
    cargaCronica: r.cronica,
    acwr: sinDatos ? null : r.acwr,
    riesgo: sinDatos ? 'sin-datos' : r.riesgo,
    diasConDatos: r.diasReales,
    enPeriodoGracia: r.estado !== 'confiable',
    estadoDato: r.estado,
    cobertura: r.cobertura,
    diasImputados: r.diasImputados,
    motivoEstado: r.motivoEstado,
    acwrEwma: sinDatos ? null : r.acwrEwma,
    riesgoEwma: sinDatos ? 'sin-datos' : r.riesgoEwma,
    variacionSemanal: r.variacionSemanal,
    spikeSemanal: r.spikeSemanal,
    monotonia: r.monotonia,
    strain: r.strain,
  }
}

/** sRPE real de los últimos 7 días (hoy incluido), sin imputar faltantes. Fechas civiles del club. */
export function calcularSRpeSemana(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteId: string,
  fechaReferencia: Date = new Date(),
): number {
  return calcularSerieUltimos7Dias(ejecuciones, sessionPlans, athleteId, fechaReferencia).reduce((s, v) => s + v, 0)
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
  const hoy = fechaHoyLocal(fechaReferencia)
  const dias: number[] = new Array(7).fill(0)
  for (const ejecucion of ejecuciones) {
    if (ejecucion.athleteId !== athleteId) continue
    const atras = diferenciaDiasLocal(hoy, ejecucion.fecha)
    if (atras < 0 || atras > 6) continue
    dias[6 - atras] += calcularCargaEjecutadaReal(ejecucion, sessionPlans) ?? 0
  }
  return dias
}

/** Suma día a día la serie de últimos 7 días de varios atletas — sparkline de sRPE del equipo (Fase 24). */
export function calcularSerieEquipoUltimos7Dias(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteIds: string[],
  fechaReferencia: Date = new Date(),
): number[] {
  const total = new Array(7).fill(0)
  for (const athleteId of athleteIds) {
    const serie = calcularSerieUltimos7Dias(ejecuciones, sessionPlans, athleteId, fechaReferencia)
    serie.forEach((valor, i) => {
      total[i] += valor
    })
  }
  return total
}

/** A partir de qué Monotonía se considera "alta" (Fase 24) — ver `calcularMonotonia`. */
export const UMBRAL_MONOTONIA_ALTA = 2

/**
 * Monotonía de Foster — carga media semanal / desvío estándar semanal, sobre
 * la serie de 7 cargas diarias (`calcularSerieUltimos7Dias`). Entrenar
 * siempre con la misma intensidad, sin días de descarga que bajen la
 * variabilidad, se asocia a mayor riesgo de enfermedad/sobreentrenamiento
 * aunque la carga TOTAL de la semana no sea extrema — por eso es una señal
 * distinta e independiente del ACWR.
 * Fuente: Foster, C. (1998). Monitoring training in athletes with reference
 * to overtraining syndrome. Medicine & Science in Sports & Exercise, 30(7),
 * 1164-1168.
 */
export function calcularMonotonia(serieUltimos7Dias: number[]): number | null {
  if (serieUltimos7Dias.length === 0) return null
  const media = serieUltimos7Dias.reduce((sum, v) => sum + v, 0) / serieUltimos7Dias.length
  if (media === 0) return null

  const varianza =
    serieUltimos7Dias.reduce((sum, v) => sum + (v - media) ** 2, 0) / serieUltimos7Dias.length
  const desviacion = Math.sqrt(varianza)
  // Misma carga los 7 días: monotonía máxima — un valor alto fijo en vez de
  // dividir por cero (matemáticamente sería infinito, pero eso no se puede
  // mostrar en una tarjeta).
  if (desviacion === 0) return 99

  return Number((media / desviacion).toFixed(2))
}

export type NivelMonotonia = 'optimo' | 'precaucion' | 'peligro'

/**
 * Cortes científicos de Foster (1998) para la Monotonía (Fase 33) — misma
 * fuente y misma serie de 7 días que `calcularMonotonia`. Independiente de
 * `UMBRAL_MONOTONIA_ALTA` (el flag binario "alta" que ya usaba el badge
 * "📈 Alta Monotonía" del Dashboard): esta clasificación de 3 niveles es la
 * que alimenta el semáforo dedicado a Monotonía y la Alerta General de
 * Riesgo durante el período de calibración del ACWR.
 */
export function clasificarMonotonia(monotonia: number): NivelMonotonia {
  if (monotonia > 2.0) return 'peligro'
  if (monotonia >= 1.5) return 'precaucion'
  return 'optimo'
}

/**
 * Strain de Foster — carga total semanal × Monotonía. Combina volumen y
 * falta de variación en un único número: dos semanas con la misma carga
 * total pueden tener un Strain muy distinto según cuán monótona haya sido
 * cada una. Misma fuente que `calcularMonotonia` (Foster, 1998).
 */
export function calcularStrain(cargaTotalSemanal: number, monotonia: number | null): number | null {
  if (monotonia === null) return null
  return Number((cargaTotalSemanal * monotonia).toFixed(0))
}

export interface PuntoSerieDiaria {
  fecha: string
  /** sRPE total del día (UA) — siempre igual a `rpe * duracionMin` por construcción. */
  srpe: number
  /** RPE crudo (0-10) autoreportado ese día. 0 si el jugador no reportó nada. */
  rpe: number
  /** Minutos totales que explican el sRPE del día (suma de `duracionRealMin` de las sesiones, o minutos jugados si fue Partido). */
  duracionMin: number
}

/**
 * Serie diaria de sRPE de un atleta sobre una ventana arbitraria de días
 * (Fase 27, "Athlete Trend Analysis"; desglose RPE×Tiempo agregado en Fase
 * 34, ver AthleteDetailModal) — a diferencia de `calcularSerieUltimos7Dias`
 * (siempre 7 días, sin fechas), ésta devuelve la fecha de cada punto para
 * poder graficarla con Recharts (eje X con fechas reales, no sólo un índice
 * 0-6). `duracionMin` se deriva de `srpe / rpe` en vez de recalcular el
 * matching de sesiones del día — es exacto porque `calcularCargaEjecutadaReal`
 * SIEMPRE construye el sRPE como ese mismo producto, así el desglose que ve
 * el profe nunca puede desincronizarse del número total.
 */
export function calcularSerieDiasAtleta(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  athleteId: string,
  dias: number,
  fechaReferencia: Date = new Date(),
): PuntoSerieDiaria[] {
  const propias = ejecuciones.filter((e) => e.athleteId === athleteId)
  const resultado: PuntoSerieDiaria[] = []

  const hoy = fechaHoyLocal(fechaReferencia)
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = sumarDiasFecha(hoy, -i)
    const ejecucionDelDia = propias.find((e) => e.fecha === fecha)

    if (!ejecucionDelDia) {
      resultado.push({ fecha, srpe: 0, rpe: 0, duracionMin: 0 })
      continue
    }

    const srpe = calcularCargaEjecutadaReal(ejecucionDelDia, sessionPlans) ?? 0
    const duracionMin = ejecucionDelDia.rpe > 0 ? Math.round(srpe / ejecucionDelDia.rpe) : 0
    resultado.push({ fecha, srpe, rpe: ejecucionDelDia.rpe, duracionMin })
  }

  return resultado
}

export interface PuntoTendenciaEquipo {
  fecha: string
  sRpePromedio: number | null
  wellnessPromedio: number | null
}

/**
 * Tendencia diaria del equipo (Fase 27, LineChart principal del Análisis
 * Grupal) — promedio de sRPE y de Wellness (/20) del día, calculado sólo
 * sobre quienes reportaron ESE día (no diluye el promedio con jugadores que
 * no entrenaron o no cargaron wellness). `null` cuando nadie reportó ese
 * día, para que el gráfico muestre un hueco en vez de una caída falsa a 0.
 */
export function calcularTendenciaEquipo(
  ejecuciones: SessionExecution[],
  sessionPlans: SessionPlan[],
  wellnessEntries: WellnessEntry[],
  athleteIds: string[],
  dias: number,
  fechaReferencia: Date = new Date(),
): PuntoTendenciaEquipo[] {
  const idsSet = new Set(athleteIds)
  const resultado: PuntoTendenciaEquipo[] = []

  const hoy = fechaHoyLocal(fechaReferencia)
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = sumarDiasFecha(hoy, -i)

    const cargasDelDia: number[] = []
    for (const athleteId of athleteIds) {
      const ejecucionesDia = ejecuciones.filter((e) => e.athleteId === athleteId && e.fecha === fecha)
      if (ejecucionesDia.length === 0) continue
      cargasDelDia.push(
        ejecucionesDia.reduce((sum, e) => sum + (calcularCargaEjecutadaReal(e, sessionPlans) ?? 0), 0),
      )
    }
    const sRpePromedio =
      cargasDelDia.length > 0 ? Number((cargasDelDia.reduce((s, v) => s + v, 0) / cargasDelDia.length).toFixed(1)) : null

    const wellnessDelDia = wellnessEntries.filter((w) => idsSet.has(w.athleteId) && w.fecha === fecha)
    const wellnessPromedio =
      wellnessDelDia.length > 0
        ? Number(
            (wellnessDelDia.reduce((s, w) => s + calcularWellnessScore20(w), 0) / wellnessDelDia.length).toFixed(1),
          )
        : null

    resultado.push({ fecha, sRpePromedio, wellnessPromedio })
  }

  return resultado
}

export interface PuntoMacrociclo {
  /** Lunes de la semana (YYYY-MM-DD) — clave de agrupación y eje X del gráfico. */
  semanaInicio: string
  /** Volumen semanal = suma de `duracionRealMin` de las sesiones YA ejecutadas esa semana. */
  volumenMin: number
  /** Intensidad semanal = promedio del RPE reportado por los jugadores esa semana. `null` si nadie reportó. */
  intensidadRpe: number | null
}

/**
 * Torre de Control de Temporada (Fase 33, ver docs/Propuesta_Integracion_NSCA.md
 * sección 2) — agrupa el historial real por semana (lunes a domingo, mismo
 * criterio que `diasDeLaSemanaActual`) para graficar Volumen vs. Intensidad.
 * Sólo cuenta sesiones con `duracionRealMin` cargado (sesiones ya ejecutadas,
 * no planificadas a futuro) — mismo criterio que `calcularCargaEjecutadaReal`.
 */
export function calcularVolumenIntensidadPorSemana(
  sessionPlans: SessionPlan[],
  sessionExecutions: SessionExecution[],
): PuntoMacrociclo[] {
  const semanas = new Map<string, { volumenMin: number; rpes: number[] }>()

  for (const plan of sessionPlans) {
    if (plan.duracionRealMin === undefined) continue
    const clave = inicioSemanaFecha(plan.fecha)
    const entry = semanas.get(clave) ?? { volumenMin: 0, rpes: [] }
    entry.volumenMin += plan.duracionRealMin
    semanas.set(clave, entry)
  }

  for (const ejecucion of sessionExecutions) {
    const clave = inicioSemanaFecha(ejecucion.fecha)
    const entry = semanas.get(clave) ?? { volumenMin: 0, rpes: [] }
    entry.rpes.push(ejecucion.rpe)
    semanas.set(clave, entry)
  }

  return Array.from(semanas.entries())
    .map(([semanaInicio, { volumenMin, rpes }]) => ({
      semanaInicio,
      volumenMin,
      intensidadRpe: rpes.length > 0 ? Number((rpes.reduce((s, v) => s + v, 0) / rpes.length).toFixed(2)) : null,
    }))
    .sort((a, b) => a.semanaInicio.localeCompare(b.semanaInicio))
}

/** Minutos totales esperados del día: los de las sesiones planificadas + el Campo base implícito de los días con gimnasio (Fase 52). */
export function minutosEsperadosDia(sesiones: SessionPlan[]): number {
  return sesiones.reduce((sum, s) => sum + s.duracionEstimadaMin, 0) + (campoBaseImplicito(sesiones)?.minutos ?? 0)
}
