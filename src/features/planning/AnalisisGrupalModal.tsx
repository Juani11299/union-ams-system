import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Avatar } from '@/components/Avatar'
import { StatCard } from '@/components/StatCard'
import { calcularWellnessScore20 } from '@/features/wellness/calculations'
import { calcularTendenciaTonelaje } from '@/features/external-load/calculations'
import { nivelSemaforo, type EvaluacionRiesgoAtleta } from './riskAssessment'
import type { Athlete, GymExternalLoad, SessionExecution, SessionPlan, WellnessEntry } from '@/types'

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

/**
 * Análisis Grupal (Fase 20) — consolida los datos de la categoría/temporada
 * activa: promedios de equipo, y un plan de acción automatizado por atleta
 * en Zona Roja, cruzando wellness/RPE de hoy con ACWR, fatiga neuromuscular
 * (CMJ/RSI mod) y tendencia de tonelaje en Terminal de Fuerza.
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

  const zonaRoja = athletes
    .map((athlete) => ({ athlete, evaluacion: evaluaciones.get(athlete.id) }))
    .filter(
      (a): a is { athlete: Athlete; evaluacion: EvaluacionRiesgoAtleta } =>
        !!a.evaluacion && a.evaluacion.enZonaRoja,
    )
    .sort((a, b) => b.evaluacion.riskScore - a.evaluacion.riskScore)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900">
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
