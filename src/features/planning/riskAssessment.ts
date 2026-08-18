import type { SessionExecution, WellnessEntry } from '@/types'
import { calcularWellnessScore20 } from '@/features/wellness/calculations'
import type { AcwrResult } from '@/features/workload/calculations'
import type { FatigaResult } from '@/features/external-load/calculations'

export const WELLNESS_SCORE_MAX = 20
export const UMBRAL_WELLNESS_BAJO = 12
export const UMBRAL_RPE_ALTO = 8
export const UMBRAL_DOLOR_INTENSO = 4

export type ClaveFactorRiesgo =
  | 'wellness-bajo'
  | 'rpe-alto'
  | 'doms'
  | 'acwr-alto'
  | 'acwr-precaucion'
  | 'fatiga-neuromuscular'

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
}

export type NivelSemaforo = 'rojo' | 'amarillo' | 'verde'

export function nivelSemaforo(riskScore: number): NivelSemaforo {
  if (riskScore >= 20) return 'rojo'
  if (riskScore >= 8) return 'amarillo'
  return 'verde'
}

/**
 * Algoritmo de Risk Score (Fase 20) — combina las 3 señales pedidas por el
 * profe (Wellness del día bajo, sRPE de hoy por las nubes, DOMS intenso) con
 * las 2 alertas que el Dashboard ya calculaba por separado (ACWR y fatiga
 * neuromuscular por CMJ/RSI mod) en un único puntaje, así el sorting "mayor
 * riesgo arriba" y la Zona Roja del Análisis Grupal usan la misma fuente de
 * verdad. Los pesos son ordinales (no una escala clínica validada): más
 * severidad del desvío ⇒ más puntos, para que el orden dentro de la lista
 * también tenga sentido y no sólo el corte binario "en riesgo o no".
 */
export function evaluarRiesgoAtleta(params: {
  wellnessHoy: WellnessEntry | null
  ejecucionesHoyAtleta: SessionExecution[]
  acwr: AcwrResult
  fatiga: FatigaResult
}): EvaluacionRiesgoAtleta {
  const { wellnessHoy, ejecucionesHoyAtleta, acwr, fatiga } = params

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

  if (wellnessHoy && wellnessHoy.dolorMuscular >= UMBRAL_DOLOR_INTENSO) {
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

  if (fatiga.enFatiga) {
    riskScore += 15
    factores.push({
      clave: 'fatiga-neuromuscular',
      etiqueta: fatiga.motivo === 'mrsi' ? 'Caída de RSI modificado' : 'Posible fatiga (CMJ)',
      sugerencia:
        'Caída de rendimiento neuromuscular. Priorizar recuperación, evitar pliometría de alta intensidad hoy.',
    })
  }

  return { riskScore, wellnessScore, rpeHoy, factores, enZonaRoja: factores.length > 0 }
}
