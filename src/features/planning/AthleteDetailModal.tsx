import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Avatar } from '@/components/Avatar'
import { Badge, type BadgeTone } from '@/components/Badge'
import { calcularSerieDiasAtleta, colorRpe } from '@/features/workload/calculations'
import { calcularSerieWellnessAtleta, obtenerWellnessDelDia } from '@/features/wellness/calculations'
import { diagnosticarWellness, type TipoDiagnostico } from './wellnessDiagnostico'
import { formatFechaCorta } from '@/utils/fecha'
import type { Athlete, SessionExecution, SessionPlan, WellnessEntry } from '@/types'

interface AthleteDetailModalProps {
  athlete: Athlete
  sessionExecutions: SessionExecution[]
  sessionPlans: SessionPlan[]
  wellnessEntries: WellnessEntry[]
  hoy: string
  onClose: () => void
}

const DIAS_TENDENCIA = 14

const UNION_ROJO = '#ed1c24'
const VERDE = '#10b981'
const AMARILLO = '#f59e0b'

function colorPorValor(valor: number): string {
  if (valor <= 2) return '#f43f5e'
  if (valor === 3) return AMARILLO
  return VERDE
}

/** Semáforo del Readiness (Wellness /20) — mismo corte crítico (≤12) que `UMBRAL_WELLNESS_CRITICO` de riskAssessment.ts. */
function colorReadiness20(score: number): string {
  if (score <= 12) return '#f43f5e'
  if (score <= 15) return AMARILLO
  return VERDE
}

interface PuntoTendenciaDia {
  fecha: string
  srpe: number
  rpe: number
  duracionMin: number
  wellness: number | null
}

/** Tooltip personalizado del gráfico de tendencia (Fase 34) — desglosa el sRPE en RPE crudo × Tiempo, no sólo el total. */
function TooltipTendencia({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0]?.payload as PuntoTendenciaDia | undefined
  if (!d) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{d.fecha}</p>
      <p className="text-slate-600 dark:text-slate-300">
        Readiness:{' '}
        <span className="font-medium" style={{ color: d.wellness !== null ? colorReadiness20(d.wellness) : undefined }}>
          {d.wellness !== null ? `${d.wellness} / 20` : 'Sin registro'}
        </span>
      </p>
      <p className="font-medium" style={{ color: UNION_ROJO }}>
        sRPE Total: {d.srpe} UA
      </p>
      <p className="text-slate-400">
        Desglose: {d.rpe > 0 ? `RPE ${d.rpe} × ${d.duracionMin} min` : 'Sin entrenamiento registrado'}
      </p>
    </div>
  )
}

const DIAGNOSTICO_TONE: Record<TipoDiagnostico, string> = {
  'fatiga-acumulada':
    'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  'episodio-aislado':
    'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  estable:
    'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  'sin-datos':
    'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400',
}

const ESTADO_TONE: Record<Athlete['estadoSalud'], BadgeTone> = {
  Activo: 'green',
  Rehabilitación: 'yellow',
  'Baja Médica': 'red',
}

const WELLNESS_DIMENSIONES = [
  { key: 'sueno', label: '🛌 Sueño' },
  { key: 'estres', label: '🧠 Estrés' },
  { key: 'fatiga', label: '🔋 Fatiga' },
  { key: 'dolorMuscular', label: '🦵 Dolor' },
] as const

/**
 * Modal de Detalle Individual (Fase 27, "Athlete Trend Analysis") — a
 * diferencia del snapshot del día que ya muestra la tarjeta del Dashboard,
 * acá el foco es la EVOLUCIÓN: sRPE + Wellness de los últimos 14 días
 * (para distinguir un mal día puntual de una tendencia real de
 * sobreentrenamiento) y el desglose de hoy coloreado por severidad.
 */
export function AthleteDetailModal({
  athlete,
  sessionExecutions,
  sessionPlans,
  wellnessEntries,
  hoy,
  onClose,
}: AthleteDetailModalProps) {
  const serieSRpe = calcularSerieDiasAtleta(sessionExecutions, sessionPlans, athlete.id, DIAS_TENDENCIA)
  const serieWellness = calcularSerieWellnessAtleta(wellnessEntries, athlete.id, DIAS_TENDENCIA)
  const datosTendencia: PuntoTendenciaDia[] = serieSRpe.map((punto, i) => ({
    fecha: formatFechaCorta(punto.fecha),
    srpe: punto.srpe,
    rpe: punto.rpe,
    duracionMin: punto.duracionMin,
    wellness: serieWellness[i]?.score ?? null,
  }))
  const historialReciente = [...datosTendencia].reverse()

  const diagnostico = diagnosticarWellness(serieWellness)

  const wellnessHoy = obtenerWellnessDelDia(wellnessEntries, athlete.id, hoy)
  const datosHoy = wellnessHoy
    ? WELLNESS_DIMENSIONES.map((d) => ({ dimension: d.label, valor: wellnessHoy[d.key] }))
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar nombre={athlete.nombre} />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{athlete.nombre}</h3>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{athlete.posiciones.join(', ')}</span>
                <Badge tone={ESTADO_TONE[athlete.estadoSalud]}>{athlete.estadoSalud}</Badge>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${DIAGNOSTICO_TONE[diagnostico.tipo]}`}>
            {diagnostico.mensaje}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              📉 Tendencia — últimos {DIAS_TENDENCIA} días
            </p>
            <div className="mt-2 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosTendencia} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 20]}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={(props) => <TooltipTendencia {...props} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="srpe"
                    name="sRPE"
                    stroke={UNION_ROJO}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="wellness"
                    name="Wellness /20"
                    stroke={VERDE}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">🩺 Wellness de hoy</p>
            {datosHoy.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
                Sin registro de Wellness hoy.
              </div>
            ) : (
              <div className="mt-2 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosHoy} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value} / 5`, 'Valor']} />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {datosHoy.map((d, i) => (
                        <Cell key={i} fill={colorPorValor(d.valor)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <details className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800" open>
            <summary className="cursor-pointer select-none rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60">
              📋 Historial Detallado (Últimos {DIAS_TENDENCIA} días)
            </summary>
            <div className="max-h-64 overflow-y-auto border-t border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Duración</th>
                    <th className="px-3 py-2 font-medium">RPE</th>
                    <th className="px-3 py-2 font-medium">Carga (UA)</th>
                    <th className="px-3 py-2 font-medium">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {historialReciente.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-300">{d.fecha}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500 dark:text-slate-400">
                        {d.duracionMin > 0 ? `${d.duracionMin} min` : '—'}
                      </td>
                      <td
                        className="px-3 py-2 font-semibold"
                        style={{ color: d.rpe > 0 ? colorRpe(d.rpe) : undefined }}
                      >
                        {d.rpe > 0 ? d.rpe : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-300">
                        {d.srpe > 0 ? `${d.srpe} UA` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {d.wellness !== null ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: colorReadiness20(d.wellness) }}
                            />
                            {d.wellness} / 20
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
