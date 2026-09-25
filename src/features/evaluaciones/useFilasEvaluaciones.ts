import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import type { PerformanceEvaluation } from '@/types'
import { TEST_CMJ_BILATERAL, TEST_CMJ_UNILATERAL, TEST_NORDBORD } from './dinamicas'
import type { FilaEvaluacionDinamica } from './dinamicas'

/**
 * Las evaluaciones que se importaron con el panel viejo siguen en la tabla
 * `performance_evaluations` (ej. las de CMJ Bilateral). Para que la plantilla
 * universal las vea sin migrar nada, se leen y se traducen al formato de
 * `dynamic_evaluations`: `evaluationName` → `test_name`, métricas con las
 * claves sin espacios sobrantes y el peso corporal como metadato `_bw`.
 * Si una misma fila (test + jugador + fecha) existe en las dos tablas, gana la de
 * `dynamic_evaluations`. Los archivos nuevos siempre se guardan en la tabla nueva.
 */
function nombreDeTest(evaluationName: string, hayNordBordNuevo: boolean): string | null {
  if (/nord|curl/i.test(evaluationName)) return hayNordBordNuevo ? null : TEST_NORDBORD
  if (/1\s*pp|slj|unilateral|single|1 pierna|una pierna/i.test(evaluationName)) return TEST_CMJ_UNILATERAL
  if (/cmj|salto|jump/i.test(evaluationName)) return TEST_CMJ_BILATERAL
  return evaluationName
}

export function combinarFilas(dinamicas: FilaEvaluacionDinamica[], legacy: PerformanceEvaluation[]): FilaEvaluacionDinamica[] {
  if (legacy.length === 0) return dinamicas
  const hayNordBordNuevo = dinamicas.some((f) => f.test_name === TEST_NORDBORD)
  const existentes = new Set(dinamicas.map((f) => `${f.test_name}|${f.player_key}|${f.fecha}`))
  const extra: FilaEvaluacionDinamica[] = []
  for (const e of legacy) {
    const test = nombreDeTest(e.evaluationName, hayNordBordNuevo)
    if (!test || existentes.has(`${test}|${e.playerKey}|${e.fecha}`)) continue
    const metrics: FilaEvaluacionDinamica['metrics'] = {}
    for (const [k, v] of Object.entries(e.metrics)) if (typeof v === 'number' && Number.isFinite(v)) metrics[k.trim()] = v
    if (e.bodyWeightKg && e.bodyWeightKg > 0) metrics._bw = e.bodyWeightKg
    existentes.add(`${test}|${e.playerKey}|${e.fecha}`)
    extra.push({ test_name: test, player_name: e.playerName, player_key: e.playerKey, category_label: e.categoryLabel, fecha: e.fecha, metrics, test_config: { archivo: e.evaluationName, desde_legacy: true } })
  }
  return [...dinamicas, ...extra]
}

/** Filas de todos los tests: `dynamic_evaluations` + lo importado antes en `performance_evaluations`. */
export function useFilasEvaluaciones(): FilaEvaluacionDinamica[] {
  const dinamicas = useEvaluacionesDinamicasStore((s) => s.filas)
  const legacy = useAppStore((s) => s.performanceEvaluations)
  return useMemo(() => combinarFilas(dinamicas, legacy), [dinamicas, legacy])
}
