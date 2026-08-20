import type { PuntoSerieWellness } from '@/features/wellness/calculations'
import { UMBRAL_WELLNESS_CRITICO, WELLNESS_SCORE_MAX } from './riskAssessment'

export type TipoDiagnostico = 'fatiga-acumulada' | 'episodio-aislado' | 'estable' | 'sin-datos'

export interface DiagnosticoWellness {
  tipo: TipoDiagnostico
  mensaje: string
}

/** Wellness "excelente" — piso para considerar que el día anterior estaba realmente bien, no sólo "no crítico". */
const UMBRAL_WELLNESS_EXCELENTE = 18

/**
 * Diagnóstico Clínico Automatizado (Fase 27) — lee los últimos días de
 * Wellness de un atleta (con datos, ignorando huecos sin registro) y
 * distingue dos patrones bien distintos que un profe necesita separar:
 *
 * - "Episodio Aislado de Fatiga": hoy vino mal pero ayer estaba excelente
 *   (≥18/20) — probablemente un mal día puntual (durmió mal, examen, etc.),
 *   no necesariamente algo estructural.
 * - "Tendencia a Fatiga Acumulada": el Wellness viene cayendo 3 días
 *   seguidos y el último día ya está en zona crítica — la señal clásica de
 *   sobreentrenamiento/falta de recuperación, no un mal día aislado.
 *
 * No es un diagnóstico médico real — es una heurística de lectura rápida
 * para que el profe sepa a cuál de los dos casos prestarle atención primero.
 */
export function diagnosticarWellness(serieAscendente: PuntoSerieWellness[]): DiagnosticoWellness {
  const conDatos = serieAscendente.filter(
    (d): d is { fecha: string; score: number } => d.score !== null,
  )

  if (conDatos.length === 0) {
    return { tipo: 'sin-datos', mensaje: 'Todavía no hay registros de Wellness para analizar.' }
  }

  const ultimos3 = conDatos.slice(-3)
  const hoy = ultimos3[ultimos3.length - 1]

  if (ultimos3.length >= 2) {
    const ayer = ultimos3[ultimos3.length - 2]
    if (hoy.score <= UMBRAL_WELLNESS_CRITICO && ayer.score >= UMBRAL_WELLNESS_EXCELENTE) {
      return {
        tipo: 'episodio-aislado',
        mensaje: `ℹ️ Episodio Aislado de Fatiga — ayer el Wellness estaba en ${ayer.score}/${WELLNESS_SCORE_MAX}, hoy cayó puntualmente a ${hoy.score}/${WELLNESS_SCORE_MAX}.`,
      }
    }
  }

  if (ultimos3.length >= 3) {
    const [d1, d2, d3] = ultimos3
    const cayendoSeguido = d1.score > d2.score && d2.score > d3.score
    if (cayendoSeguido && d3.score <= UMBRAL_WELLNESS_CRITICO) {
      return {
        tipo: 'fatiga-acumulada',
        mensaje: `⚠️ Tendencia a Fatiga Acumulada — el Wellness viene bajando 3 días seguidos (${d1.score} → ${d2.score} → ${d3.score}/${WELLNESS_SCORE_MAX}).`,
      }
    }
  }

  return { tipo: 'estable', mensaje: '✅ Sin señales de alarma en los últimos días.' }
}
