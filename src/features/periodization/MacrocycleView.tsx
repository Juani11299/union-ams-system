import { useMemo } from 'react'
import { useAppStore, useSessionPlansActivos, useSessionExecutionsActivas } from '@/store/useAppStore'
import { calcularVolumenIntensidadPorSemana, type PuntoMacrociclo } from '@/features/workload/calculations'
import { parsearFechaLocal } from '@/utils/fecha'
import { Card } from '@/components/Card'

/**
 * Torre de Control de Temporada (Fase 33, ver
 * docs/Propuesta_Integracion_NSCA.md sección 2) — Volumen vs. Intensidad
 * semanal a partir del historial real (`sessionPlans`/`sessionExecutions` del
 * store principal, vía `calcularVolumenIntensidadPorSemana`). SVG nativo, sin
 * librería de gráficos. Cada serie se normaliza contra SU PROPIO máximo en la
 * ventana visible (Volumen en minutos, Intensidad en RPE 1-10 — escalas muy
 * distintas, no tiene sentido compartir un solo eje).
 */
const MAX_SEMANAS_VISIBLES = 12

const ANCHO = 760
const ALTO = 260
const PADDING = { top: 16, right: 16, bottom: 36, left: 16 }
const ALTO_UTIL = ALTO - PADDING.top - PADDING.bottom

function labelSemana(semanaInicio: string): string {
  return parsearFechaLocal(semanaInicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function puntosPoligono(datos: PuntoMacrociclo[], valores: number[], max: number): string {
  const anchoUtil = ANCHO - PADDING.left - PADDING.right
  const paso = datos.length > 1 ? anchoUtil / (datos.length - 1) : 0
  return datos
    .map((_, i) => {
      const x = PADDING.left + i * paso
      const y = PADDING.top + ALTO_UTIL - (max > 0 ? (valores[i] / max) * ALTO_UTIL : 0)
      return `${x},${y}`
    })
    .join(' ')
}

export function MacrocycleView() {
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const sessionPlans = useSessionPlansActivos()
  const sessionExecutions = useSessionExecutionsActivas()

  const datos = useMemo(
    () => calcularVolumenIntensidadPorSemana(sessionPlans, sessionExecutions).slice(-MAX_SEMANAS_VISIBLES),
    [sessionPlans, sessionExecutions],
  )

  if (!activeSeasonId || !activeCategoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para ver la Torre de Control de Temporada.
      </Card>
    )
  }

  const volumenes = datos.map((d) => d.volumenMin)
  const intensidades = datos.map((d) => d.intensidadRpe ?? 0)
  const maxVolumen = Math.max(1, ...volumenes)
  const maxIntensidad = Math.max(1, ...intensidades)
  const anchoUtil = ANCHO - PADDING.left - PADDING.right
  const paso = datos.length > 1 ? anchoUtil / (datos.length - 1) : 0

  const puntosVolumen = puntosPoligono(datos, volumenes, maxVolumen)
  const puntosIntensidad = puntosPoligono(datos, intensidades, maxIntensidad)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">TORRE DE CONTROL DE TEMPORADA</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Volumen vs. Intensidad real por semana — jerarquía de periodización, Cap. 21 NSCA (Haff).
        </p>
      </div>

      {datos.length < 2 ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          📊 Recopilando datos de temporada… Necesitamos al menos 2 semanas con sesiones ejecutadas (tiempo real
          cargado) para trazar la tendencia de Volumen vs. Intensidad.
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-sky-500" /> Volumen (min/semana, pico de la ventana = 100%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-union-red-600" /> Intensidad (RPE promedio, pico de la
                ventana = 100%)
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${ANCHO} ${ALTO}`}
                className="min-w-[640px]"
                role="img"
                aria-label="Volumen vs. Intensidad real por semana"
              >
                {[0, 25, 50, 75, 100].map((marca) => {
                  const y = PADDING.top + ALTO_UTIL - (marca / 100) * ALTO_UTIL
                  return (
                    <line
                      key={marca}
                      x1={PADDING.left}
                      x2={ANCHO - PADDING.right}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth={1}
                      className="text-slate-100 dark:text-slate-800"
                    />
                  )
                })}

                {datos.map((d, i) => {
                  const x = PADDING.left + i * paso
                  return (
                    <text key={d.semanaInicio} x={x} y={ALTO - 8} fontSize={9} textAnchor="middle" className="fill-slate-400">
                      {labelSemana(d.semanaInicio)}
                    </text>
                  )
                })}

                <polyline points={puntosVolumen} fill="none" strokeWidth={2.5} className="stroke-sky-500" />
                <polyline points={puntosIntensidad} fill="none" strokeWidth={2.5} className="stroke-union-red-600" />

                {datos.map((d, i) => {
                  const x = PADDING.left + i * paso
                  const yVol = PADDING.top + ALTO_UTIL - (volumenes[i] / maxVolumen) * ALTO_UTIL
                  const yInt = PADDING.top + ALTO_UTIL - (intensidades[i] / maxIntensidad) * ALTO_UTIL
                  return (
                    <g key={d.semanaInicio}>
                      <circle cx={x} cy={yVol} r={3} className="fill-sky-500">
                        <title>{`Semana del ${labelSemana(d.semanaInicio)}: ${d.volumenMin} min`}</title>
                      </circle>
                      <circle cx={x} cy={yInt} r={3} className="fill-union-red-600">
                        <title>{`Semana del ${labelSemana(d.semanaInicio)}: RPE ${d.intensidadRpe ?? 'sin datos'}`}</title>
                      </circle>
                    </g>
                  )
                })}
              </svg>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Detalle por semana</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                    <th className="py-2 pr-3 font-medium">Semana (lunes)</th>
                    <th className="py-2 pr-3 font-medium">Volumen</th>
                    <th className="py-2 pr-3 font-medium">Intensidad (RPE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {datos.map((d) => (
                    <tr key={d.semanaInicio}>
                      <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300">{labelSemana(d.semanaInicio)}</td>
                      <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300">{d.volumenMin} min</td>
                      <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300">
                        {d.intensidadRpe ?? 'Sin datos'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
