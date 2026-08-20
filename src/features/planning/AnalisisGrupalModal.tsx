import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Avatar } from '@/components/Avatar'
import { StatCard } from '@/components/StatCard'
import { MiniBarChart } from '@/components/MiniBarChart'
import { useToastStore } from '@/store/useToastStore'
import { calcularWellnessScore20 } from '@/features/wellness/calculations'
import { calcularTendenciaTonelaje } from '@/features/external-load/calculations'
import { calcularSerieEquipoUltimos7Dias, calcularTendenciaEquipo } from '@/features/workload/calculations'
import { nivelSemaforo, type EvaluacionRiesgoAtleta } from './riskAssessment'
import { formatFechaCorta } from '@/utils/fecha'
import type { Athlete, GymExternalLoad, SessionExecution, SessionPlan, WellnessEntry } from '@/types'

const DIAS_TENDENCIA_EQUIPO = 14
const UNION_ROJO = '#ed1c24'
const VERDE = '#10b981'

interface AnalisisGrupalModalProps {
  athletes: Athlete[]
  evaluaciones: Map<string, EvaluacionRiesgoAtleta>
  wellnessEntries: WellnessEntry[]
  sessionExecutions: SessionExecution[]
  gymExternalLoads: GymExternalLoad[]
  sessionPlans: SessionPlan[]
  categoriaNombre: string
  hoy: string
  onClose: () => void
}

const TENDENCIA_ICONO: Record<string, string> = {
  subiendo: '📈',
  bajando: '📉',
  estable: '➖',
  'sin-datos': '—',
}

const TENDENCIA_LABEL: Record<string, string> = {
  subiendo: 'Subiendo',
  bajando: 'Bajando',
  estable: 'Estable',
  'sin-datos': 'Sin datos suficientes',
}

/** Mensaje prolijo para pegar en el grupo de WhatsApp del plantel (Fase 25, "Lista de Deudores"). */
function construirMensajeCumplimiento(
  categoriaNombre: string,
  sinWellness: Athlete[],
  sinRpe: Athlete[],
): string {
  const lineas = [`📋 Pendientes de hoy — ${categoriaNombre}`, '']
  if (sinWellness.length > 0) {
    lineas.push('🌅 Todavía no cargaron el Wellness:')
    lineas.push(...sinWellness.map((a) => `- ${a.nombre}`))
    lineas.push('')
  }
  if (sinRpe.length > 0) {
    lineas.push('🏁 Todavía no cargaron el RPE:')
    lineas.push(...sinRpe.map((a) => `- ${a.nombre}`))
    lineas.push('')
  }
  lineas.push('Por favor complétenlo cuanto antes 🙏')
  return lineas.join('\n')
}

/**
 * Análisis Grupal (Fase 20, revisado en Fase 24/25/27) — vista a pantalla
 * completa (Fase 27: el profe necesita todo el ancho para leer la
 * macro-estructura del plantel) que consolida los datos de la
 * categoría/temporada activa: promedios de equipo, LineChart de tendencia
 * (sRPE vs. Wellness promedio de los últimos 14 días, para ver correlación
 * carga↔recuperación en vez de sólo el snapshot de hoy), sparkline de sRPE
 * del plantel, Monitor de Cumplimiento (quién no cargó Wellness/RPE hoy, con
 * botón de copia para WhatsApp), y un plan de acción automatizado por
 * atleta en Zona Roja, cruzando wellness/RPE de hoy con ACWR y tendencia de
 * tonelaje en Terminal de Fuerza.
 */
export function AnalisisGrupalModal({
  athletes,
  evaluaciones,
  wellnessEntries,
  sessionExecutions,
  gymExternalLoads,
  sessionPlans,
  categoriaNombre,
  hoy,
  onClose,
}: AnalisisGrupalModalProps) {
  const showToast = useToastStore((s) => s.showToast)
  const wellnessHoy = wellnessEntries.filter((w) => w.fecha === hoy)
  const wellnessPromedio =
    wellnessHoy.length > 0
      ? wellnessHoy.reduce((sum, w) => sum + calcularWellnessScore20(w), 0) / wellnessHoy.length
      : null

  const rpePorAtleta = new Map<string, number>()
  sessionExecutions
    .filter((e) => e.fecha === hoy)
    .forEach((e) => {
      if (!rpePorAtleta.has(e.athleteId)) rpePorAtleta.set(e.athleteId, e.rpe)
    })
  const rpeValores = Array.from(rpePorAtleta.values())
  const rpePromedio = rpeValores.length > 0 ? rpeValores.reduce((sum, v) => sum + v, 0) / rpeValores.length : null

  const participacionPct =
    athletes.length > 0 ? Math.round((wellnessHoy.length / athletes.length) * 100) : 0

  const serieEquipo7d = calcularSerieEquipoUltimos7Dias(
    sessionExecutions,
    sessionPlans,
    athletes.map((a) => a.id),
  )

  const tendenciaEquipo = calcularTendenciaEquipo(
    sessionExecutions,
    sessionPlans,
    wellnessEntries,
    athletes.map((a) => a.id),
    DIAS_TENDENCIA_EQUIPO,
  ).map((p) => ({
    fecha: formatFechaCorta(p.fecha),
    sRpe: p.sRpePromedio,
    wellness: p.wellnessPromedio,
  }))

  // Monitor de Cumplimiento (Fase 25) — quiénes del plantel todavía no
  // cargaron Wellness/RPE hoy, cruzando contra `wellnessHoy`/`rpePorAtleta`.
  const idsConWellness = new Set(wellnessHoy.map((w) => w.athleteId))
  const idsConRpe = new Set(rpePorAtleta.keys())
  const sinWellness = athletes.filter((a) => !idsConWellness.has(a.id))
  const sinRpe = athletes.filter((a) => !idsConRpe.has(a.id))

  async function handleCopiarCumplimiento() {
    const mensaje = construirMensajeCumplimiento(categoriaNombre, sinWellness, sinRpe)
    try {
      await navigator.clipboard.writeText(mensaje)
      showToast('success', 'Mensaje copiado — pegalo en el grupo de WhatsApp')
    } catch {
      showToast('error', 'No se pudo copiar el mensaje.')
    }
  }

  const zonaRoja = athletes
    .map((athlete) => ({ athlete, evaluacion: evaluaciones.get(athlete.id) }))
    .filter(
      (a): a is { athlete: Athlete; evaluacion: EvaluacionRiesgoAtleta } =>
        !!a.evaluacion && a.evaluacion.enZonaRoja,
    )
    .sort((a, b) => b.evaluacion.riskScore - a.evaluacion.riskScore)

  return (
    <div className="fixed inset-0 z-50 flex h-full min-h-screen w-full flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">📊 Análisis Grupal</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{categoriaNombre} — hoy</p>
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
        <div className="mx-auto flex w-full max-w-6xl flex-col">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Wellness Promedio"
              value={wellnessPromedio !== null ? `${wellnessPromedio.toFixed(1)} / 20` : '—'}
              hint={`${wellnessHoy.length} de ${athletes.length} reportaron`}
            />
            <StatCard
              label="RPE Promedio Sesión"
              value={rpePromedio !== null ? `${rpePromedio.toFixed(1)} / 10` : '—'}
              hint={`${rpeValores.length} de ${athletes.length} reportaron`}
            />
            <StatCard label="% Participación" value={`${participacionPct}%`} hint="Wellness cargado hoy" />
          </div>

          <Card className="mt-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              📊 Carga vs. Recuperación del equipo — últimos {DIAS_TENDENCIA_EQUIPO} días
            </p>
            <p className="text-[11px] text-slate-400">
              sRPE promedio del plantel (izquierda) vs. Wellness promedio (derecha) — sirve para ver, por ejemplo, si
              el Wellness cae unos días después de que suba el sRPE.
            </p>
            <div className="mt-1 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaEquipo} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                    name="sRPE promedio"
                    stroke={UNION_ROJO}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="wellness"
                    name="Wellness promedio /20"
                    stroke={VERDE}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mt-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              📈 sRPE del equipo — últimos 7 días
            </p>
            <MiniBarChart valores={serieEquipo7d} barClassName="bg-union-red-500 dark:bg-union-red-400" />
            <p className="text-[11px] text-slate-400">Suma diaria de sRPE de todo el plantel (hoy a la derecha)</p>
          </Card>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                📋 Monitor de Cumplimiento
              </h4>
              {(sinWellness.length > 0 || sinRpe.length > 0) && (
                <button
                  type="button"
                  onClick={handleCopiarCumplimiento}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  📋 Copiar para WhatsApp
                </button>
              )}
            </div>

            {sinWellness.length === 0 && sinRpe.length === 0 ? (
              <Card className="mt-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                ✅ Todos cargaron Wellness y RPE hoy.
              </Card>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    🔴 No cargaron Wellness ({sinWellness.length})
                  </p>
                  {sinWellness.length === 0 ? (
                    <p className="text-xs text-slate-400">Todos cargaron.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {sinWellness.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        >
                          {a.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    🔴 No cargaron RPE ({sinRpe.length})
                  </p>
                  {sinRpe.length === 0 ? (
                    <p className="text-xs text-slate-400">Todos cargaron.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {sinRpe.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        >
                          {a.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}
          </div>

          <div className="mt-5">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-rose-700 dark:text-rose-400">
              🔴 Zona Roja — Atletas en riesgo
              <span className="text-xs font-normal text-slate-400">({zonaRoja.length})</span>
            </h4>

            {zonaRoja.length === 0 ? (
              <Card className="mt-2 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                ✅ Nadie en zona roja hoy.
              </Card>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                {zonaRoja.map(({ athlete, evaluacion }) => {
                  const tonelaje = calcularTendenciaTonelaje(gymExternalLoads, sessionPlans, athlete.id)
                  const nivel = nivelSemaforo(evaluacion.riskScore)
                  return (
                    <Card
                      key={athlete.id}
                      className={`flex flex-col gap-2.5 ${
                        nivel === 'rojo' ? 'border-rose-300 dark:border-rose-500/40' : 'border-amber-300 dark:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar nombre={athlete.nombre} size="sm" />
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{athlete.nombre}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {tonelaje.tendencia !== 'sin-datos' && (
                            <span
                              className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400"
                              title={`Tonelaje último ejercicio troncal: ${TENDENCIA_LABEL[tonelaje.tendencia]}${
                                tonelaje.variacionPct !== null ? ` (${tonelaje.variacionPct > 0 ? '+' : ''}${tonelaje.variacionPct}%)` : ''
                              }`}
                            >
                              {TENDENCIA_ICONO[tonelaje.tendencia]} Tonelaje gym
                            </span>
                          )}
                          <Badge tone={nivel === 'rojo' ? 'red' : 'yellow'}>Riesgo {evaluacion.riskScore}</Badge>
                        </div>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {evaluacion.factores.map((factor) => (
                          <li
                            key={factor.clave}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                          >
                            <p className="font-medium text-slate-700 dark:text-slate-300">⚠️ {factor.etiqueta}</p>
                            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-600 dark:text-slate-300">Sugerencia:</span>{' '}
                              {factor.sugerencia}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
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
  )
}
