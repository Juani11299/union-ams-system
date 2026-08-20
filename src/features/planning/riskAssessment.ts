import type { SessionExecution, WellnessEntry } from '@/types'
import { calcularWellnessScore20 } from '@/features/wellness/calculations'
import type { AcwrResult } from '@/features/workload/calculations'

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
}

export type NivelSemaforo = 'rojo' | 'amarillo' | 'verde'

export function nivelSemaforo(riskScore: number): NivelSemaforo {
  if (riskScore >= 20) return 'rojo'
  if (riskScore >= 8) return 'amarillo'
  return 'verde'
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
}): EvaluacionRiesgoAtleta {
  const { wellnessHoy, ejecucionesHoyAtleta, acwr } = params

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

  if (acwr.riesgo === 'alto') {
    riskScore += 20
    factores.push({
      clave: 'acwr-alto',
      etiqueta: 'ACWR en zona de riesgo (>1.5)',
      sugerencia: 'Sobrecarga aguda respecto a la crónica. Reducir volumen de la semana y priorizar recuperación.',
    })
  } else if (acwr.riesgo === 'precaucion') {
    riskScore += 8
    factores.push({
      clave: 'acwr-precaucion',
      etiqueta: 'ACWR en zona de precaución',
      sugerencia: 'ACWR elevándose. Monitorear de cerca antes de sumar más carga esta semana.',
    })
  }

  // Alerta de Fatiga (Fase 24): wellness crítico (≤12/20, o dolor/fatiga en
  // rojo aunque el total no baje de 12) O ACWR en zona de peligro (>1.5).
  const wellnessCritico =
    (wellnessScore !== null && wellnessScore <= UMBRAL_WELLNESS_CRITICO) ||
    (!!wellnessHoy && (wellnessHoy.dolorMuscular <= UMBRAL_RATING_SEVERO || wellnessHoy.fatiga <= UMBRAL_RATING_SEVERO))
  const alertaFatiga = wellnessCritico || acwr.riesgo === 'alto'

  return { riskScore, wellnessScore, rpeHoy, factores, enZonaRoja: factores.length > 0, alertaFatiga }
}
