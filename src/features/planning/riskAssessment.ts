import type { SessionExecution, WellnessEntry } from '@/types'
import { calcularReadiness, calcularWellnessScore20 } from '@/features/wellness/calculations'
import type { AcwrResult } from '@/features/workload/calculations'

const UMBRAL_MONOTONIA_PELIGRO = 2.0
const UMBRAL_MONOTONIA_PRECAUCION = 1.5

export const WELLNESS_SCORE_MAX = 20
export const UMBRAL_WELLNESS_BAJO = 12
export const UMBRAL_RPE_ALTO = 8
/**
 * Fase 25: `dolorMuscular` ahora sigue la misma convención "5 = óptimo
 * (sin dolor), 1 = pésimo (dolor severo)" que el resto del Wellness — antes
 * era al revés. DOMS intenso ahora es un valor BAJO, no alto.
 */
export const UMBRAL_DOLOR_INTENSO = 2

/**
 * Umbral de "Alerta de Fatiga" (Fase 24) — el club no cuenta con
 * plataformas de fuerza para medir RSI modificado de forma confiable, así
 * que la alerta roja de fatiga se basa exclusivamente en el Índice de
 * Hooper (wellness subjetivo) y el ACWR, ambas métricas validadas que no
 * dependen de hardware. Ver `evaluarRiesgoAtleta`.
 * Fuente Hooper: Hooper, S.L., Mackinnon, L.T., Howard, A., Gordon, R.D.,
 * Bachmann, A.W. (1995). Markers for monitoring overtraining and recovery.
 * Medicine & Science in Sports & Exercise, 27(1), 106-112 (mismas 4
 * dimensiones que ya trackea el formulario de Wellness: sueño, estrés,
 * fatiga, dolor muscular).
 */
export const UMBRAL_WELLNESS_CRITICO = 12
/** Fase 25: "severo" es ahora el extremo BAJO (1) de la escala normalizada. */
const UMBRAL_RATING_SEVERO = 1

export type ClaveFactorRiesgo = 'wellness-bajo' | 'rpe-alto' | 'doms' | 'acwr-alto' | 'acwr-precaucion'

export interface FactorRiesgo {
  clave: ClaveFactorRiesgo
  etiqueta: string
  sugerencia: string
}

export interface EvaluacionRiesgoAtleta {
  riskScore: number
  wellnessScore: number | null
  rpeHoy: number | null
  factores: FactorRiesgo[]
  enZonaRoja: boolean
  /** Alerta de Fatiga (Fase 24) — Hooper + ACWR únicamente, sin RSI. */
  alertaFatiga: boolean
  /** Alerta General de Riesgo (Fase 32) — cruce ACWR × Wellness, ver `calcularAlertaGeneralRiesgo`. */
  alertaGeneral: AlertaGeneralRiesgo
}

export type NivelSemaforo = 'rojo' | 'amarillo' | 'verde'

export function nivelSemaforo(riskScore: number): NivelSemaforo {
  if (riskScore >= 20) return 'rojo'
  if (riskScore >= 8) return 'amarillo'
  return 'verde'
}

export type NivelRiesgoGeneral = 'critico' | 'alto' | 'moderado' | 'bajo'

export interface AlertaGeneralRiesgo {
  nivel: NivelRiesgoGeneral
  /** Explicación corta del disparador (Paso 4, transparencia en la UI) — ej. "ACWR en Zona de Peligro (2.76 > 1.5)". */
  motivo: string
}

/**
 * Alerta General de Riesgo (Fase 32, extendida en Fase 33) — tabla de
 * decisión clínica explícita que cruza ACWR (Gabbett, 2016), Readiness/
 * Wellness promedio (escala 1-5, Índice de Hooper, `clasificarReadiness`) y
 * Monotonía de Foster (1998, `clasificarMonotonia`), evaluada en orden de
 * severidad: Crítico primero, y el primer nivel que matchea gana.
 *
 * Período de calibración del ACWR (`acwr.enPeriodoGracia`, Fase 33): con
 * menos de 21 días de historial real el ACWR está artificialmente inflado
 * (denominador crónico incompleto) — acá se lo trata directamente como
 * "sin dato" (`acwrValor = null`), así nunca dispara ninguna rama de la
 * alerta mientras el jugador es nuevo. El riesgo a corto plazo queda
 * apoyado exclusivamente en Wellness y Monotonía, que no dependen de una
 * ventana larga de historial. Pasado ese período, el ACWR vuelve a
 * combinarse con las otras dos métricas en pie de igualdad.
 */
export function calcularAlertaGeneralRiesgo(
  acwr: AcwrResult,
  readiness: number | null,
  monotonia: number | null,
): AlertaGeneralRiesgo {
  const acwrValor = acwr.enPeriodoGracia ? null : acwr.acwr
  const acwrPeligro = acwrValor !== null && acwrValor > 1.5
  const acwrPrecaucion = acwrValor !== null && acwrValor > 1.3 && acwrValor <= 1.5
  const wellnessSevero = readiness !== null && readiness < 2.0
  const wellnessModerado = readiness !== null && readiness >= 2.0 && readiness <= 2.9
  const wellnessBajo3 = readiness !== null && readiness < 3.0
  const monotoniaPeligro = monotonia !== null && monotonia > UMBRAL_MONOTONIA_PELIGRO
  const monotoniaPrecaucion = monotonia !== null && monotonia >= UMBRAL_MONOTONIA_PRECAUCION && monotonia <= UMBRAL_MONOTONIA_PELIGRO

  const motivoAcwrPeligro = () => `ACWR en Zona de Peligro (${acwrValor!.toFixed(2)} > 1.5)`
  const motivoAcwrPrecaucion = () => `ACWR en Zona de Precaución (${acwrValor!.toFixed(2)})`
  const motivoWellnessSevero = () => `Wellness en Fatiga Severa (${readiness!.toFixed(1)} < 2.0)`
  const motivoWellnessModerado = () => `Wellness en Fatiga Moderada (${readiness!.toFixed(1)})`
  const motivoWellnessBajo3 = () => `Wellness bajo (${readiness!.toFixed(1)} < 3.0)`
  const motivoMonotoniaPeligro = () => `Monotonía en Zona de Peligro (${monotonia!.toFixed(2)} > 2.0)`
  const motivoMonotoniaPrecaucion = () => `Monotonía en Zona de Precaución (${monotonia!.toFixed(2)})`

  if (acwrPeligro || wellnessSevero || monotoniaPeligro) {
    const razones = [
      acwrPeligro && motivoAcwrPeligro(),
      wellnessSevero && motivoWellnessSevero(),
      monotoniaPeligro && motivoMonotoniaPeligro(),
    ].filter((r): r is string => !!r)
    return { nivel: 'critico', motivo: razones.join(' + ') }
  }

  if ((acwrPrecaucion || monotoniaPrecaucion) && wellnessBajo3) {
    const razones = [
      acwrPrecaucion && motivoAcwrPrecaucion(),
      monotoniaPrecaucion && motivoMonotoniaPrecaucion(),
      motivoWellnessBajo3(),
    ].filter((r): r is string => !!r)
    return { nivel: 'alto', motivo: razones.join(' + ') }
  }

  if (acwrPrecaucion || wellnessModerado || monotoniaPrecaucion) {
    const razones = [
      acwrPrecaucion && motivoAcwrPrecaucion(),
      wellnessModerado && motivoWellnessModerado(),
      monotoniaPrecaucion && motivoMonotoniaPrecaucion(),
    ].filter((r): r is string => !!r)
    return { nivel: 'moderado', motivo: razones.join(' + ') }
  }

  return {
    nivel: 'bajo',
    motivo: acwr.enPeriodoGracia
      ? 'Wellness y Monotonía dentro de rango seguro (ACWR en calibración).'
      : 'ACWR, Wellness y Monotonía dentro de rango seguro.',
  }
}

/**
 * Algoritmo de Risk Score (Fase 20, revisado en Fase 24) — combina Wellness
 * del día bajo, sRPE de hoy por las nubes, DOMS intenso y ACWR en un único
 * puntaje, así el sorting "mayor riesgo arriba" y la Zona Roja del Análisis
 * Grupal usan la misma fuente de verdad. Los pesos son ordinales (no una
 * escala clínica validada): más severidad del desvío ⇒ más puntos.
 */
export function evaluarRiesgoAtleta(params: {
  wellnessHoy: WellnessEntry | null
  ejecucionesHoyAtleta: SessionExecution[]
  acwr: AcwrResult
  /** Monotonía de Foster de los últimos 7 días (Fase 33) — ver `calcularMonotonia`. */
  monotonia: number | null
}): EvaluacionRiesgoAtleta {
  const { wellnessHoy, ejecucionesHoyAtleta, acwr, monotonia } = params

  const wellnessScore = wellnessHoy ? calcularWellnessScore20(wellnessHoy) : null
  const rpeHoy = ejecucionesHoyAtleta.length > 0 ? Math.max(...ejecucionesHoyAtleta.map((e) => e.rpe)) : null

  const factores: FactorRiesgo[] = []
  let riskScore = 0

  if (wellnessScore !== null && wellnessScore < UMBRAL_WELLNESS_BAJO) {
    riskScore += (UMBRAL_WELLNESS_BAJO - wellnessScore) * 3
    factores.push({
      clave: 'wellness-bajo',
      etiqueta: `Wellness bajo (${wellnessScore}/20)`,
      sugerencia:
        wellnessHoy && wellnessHoy.sueno <= 2 && rpeHoy !== null && rpeHoy >= UMBRAL_RPE_ALTO
          ? 'Mala calidad de sueño + RPE alto. Reducir volumen de campo un 20%. Asignar a Cuadrante 1 (Regenerativo/Movilidad).'
          : 'Wellness general bajo. Sesión regenerativa y monitoreo cercano hoy.',
    })
  }

  if (rpeHoy !== null && rpeHoy >= UMBRAL_RPE_ALTO) {
    riskScore += 10
    factores.push({
      clave: 'rpe-alto',
      etiqueta: `RPE de hoy alto (${rpeHoy}/10)`,
      sugerencia: 'Percepción de esfuerzo muy alta. Evitar sumar volumen extra hoy; priorizar recuperación activa.',
    })
  }

  if (wellnessHoy && wellnessHoy.dolorMuscular <= UMBRAL_DOLOR_INTENSO) {
    riskScore += 15
    factores.push({
      clave: 'doms',
      etiqueta: 'Dolor muscular intenso (DOMS)',
      sugerencia: 'Dolor muscular localizado. Derivar a Kinesiología. Evitar excéntricos pesados hoy.',
    })
  }

  // Fase 26 — "Cold start" (sesiones): `acwr.riesgo` sólo vale
  // 'alto'/'precaucion' con suficiente historial (ver
  // MINIMO_SESIONES_CRONICAS); durante ese período de gracia viene
  // 'sin-datos'. Fase 33 — "Cold start" (días): además, aunque
  // `acwr.riesgo` ya sea 'alto'/'precaucion', si el jugador todavía está en
  // `enPeriodoGracia` (< 21 días distintos de historial) el ACWR sigue sin
  // ser confiable — se lo excluye también acá para no sumar puntaje ni
  // aparecer como factor mientras el jugador es nuevo.
  if (!acwr.enPeriodoGracia && acwr.riesgo === 'alto') {
    riskScore += 20
    factores.push({
      clave: 'acwr-alto',
      etiqueta: 'ACWR en zona de riesgo (>1.5)',
      sugerencia: 'Sobrecarga aguda respecto a la crónica. Reducir volumen de la semana y priorizar recuperación.',
    })
  } else if (!acwr.enPeriodoGracia && acwr.riesgo === 'precaucion') {
    riskScore += 8
    factores.push({
      clave: 'acwr-precaucion',
      etiqueta: 'ACWR en zona de precaución',
      sugerencia: 'ACWR elevándose. Monitorear de cerca antes de sumar más carga esta semana.',
    })
  }

  // Alerta de Fatiga (Fase 24, revisada en Fase 26 y 33): wellness crítico
  // (≤12/20, o dolor/fatiga en rojo aunque el total no baje de 12) O ACWR en
  // zona de peligro (>1.5), ignorando el ACWR mientras el jugador está en
  // período de calibración (Fase 33).
  const wellnessCritico =
    (wellnessScore !== null && wellnessScore <= UMBRAL_WELLNESS_CRITICO) ||
    (!!wellnessHoy && (wellnessHoy.dolorMuscular <= UMBRAL_RATING_SEVERO || wellnessHoy.fatiga <= UMBRAL_RATING_SEVERO))
  const alertaFatiga = wellnessCritico || (!acwr.enPeriodoGracia && acwr.riesgo === 'alto')

  const readiness = wellnessHoy ? calcularReadiness(wellnessHoy) : null
  const alertaGeneral = calcularAlertaGeneralRiesgo(acwr, readiness, monotonia)

  return { riskScore, wellnessScore, rpeHoy, factores, enZonaRoja: factores.length > 0, alertaFatiga, alertaGeneral }
}
