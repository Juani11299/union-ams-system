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
import { Avatar } from '@/components/Avatar'
import { Badge, type BadgeTone } from '@/components/Badge'
import { calcularSerieDiasAtleta } from '@/features/workload/calculations'
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
  const datosTendencia = serieSRpe.map((punto, i) => ({
    fecha: formatFechaCorta(punto.fecha),
    sRpe: punto.carga,
    wellness: serieWellness[i]?.score ?? null,
  }))

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
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sRpe"
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
