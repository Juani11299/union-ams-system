import { useMemo, useState } from 'react'
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
import { useAppStore, useAthletesActivos, useSessionExecutionsActivas } from '@/store/useAppStore'
import { Card } from '@/components/Card'
import { Field, inputClass } from '@/components/FormField'
import { parsearFechaLocal, inicioDeSemana, fechaHoyLocal } from '@/utils/fecha'
import type { Athlete, GymExternalLoad } from '@/types'

const UNION_ROJO = '#ed1c24'
const AZUL = '#3b82f6'

type RangoTemporal = 'ultima' | '1s' | '4s' | 'todo'

const RANGOS: { id: RangoTemporal; label: string; dias: number | null }[] = [
  { id: 'ultima', label: 'Última sesión', dias: null },
  { id: '1s', label: 'Última semana', dias: 7 },
  { id: '4s', label: 'Últimas 4 semanas', dias: 28 },
  { id: 'todo', label: 'Todo el historial', dias: null },
]

/** Top Set (kg de la serie más pesada) de un registro de carga externa. */
function topSetKg(load: GymExternalLoad): number {
  return load.setsData.length > 0 ? Math.max(...load.setsData.map((s) => s.weightKg)) : 0
}

interface LoadConContexto {
  load: GymExternalLoad
  athlete: Athlete
  fecha: string
  topSet: number
}

/**
 * Dashboard de Rendimiento y Control de Carga Externa (Fase 42) — el cuerpo
 * técnico ve, filtra y compara las cargas que los jugadores registraron ellos
 * mismos en los ejercicios 🎯 al enviar su RPE (`FormularioRpe`) o en la
 * Terminal de Fuerza. Todo escopeado a la división/temporada activa del
 * TopBar, como el resto de la app. Filtros propios: ejercicio objetivo y
 * rango temporal.
 */
export function ExternalLoadDashboardTab() {
  const athletes = useAthletesActivos()
  const sessionExecutions = useSessionExecutionsActivas()
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const sessionPlans = useAppStore((s) => s.sessionPlans)
  const categories = useAppStore((s) => s.categories)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)

  const divisionNombre = categories.find((c) => c.id === activeCategoryId)?.nombre ?? 'Sin división'
  const athletesById = useMemo(() => new Map(athletes.map((a) => [a.id, a])), [athletes])
  const fechaPorSesion = useMemo(
    () => new Map(sessionPlans.map((p) => [p.id, p.fecha])),
    [sessionPlans],
  )

  // Todos los registros de gym de la división/temporada activa, con su fecha
  // (la de la sesión planificada a la que están vinculados) y el atleta.
  const loadsDivision: LoadConContexto[] = useMemo(() => {
    const idsSesionesActivas = new Set(
      sessionPlans
        .filter((p) => p.season_id === activeSeasonId && p.category_id === activeCategoryId)
        .map((p) => p.id),
    )
    return gymExternalLoads
      .filter((g) => idsSesionesActivas.has(g.sessionId))
      .map((load) => {
        const athlete = athletesById.get(load.athleteId)
        const fecha = fechaPorSesion.get(load.sessionId)
        return athlete && fecha ? { load, athlete, fecha, topSet: topSetKg(load) } : null
      })
      .filter((x): x is LoadConContexto => x !== null)
  }, [gymExternalLoads, sessionPlans, activeSeasonId, activeCategoryId, athletesById, fechaPorSesion])

  const ejerciciosDisponibles = useMemo(
    () =>
      Array.from(new Set(loadsDivision.map((l) => l.load.exerciseName))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [loadsDivision],
  )

  const [ejercicio, setEjercicio] = useState('__todos__')
  const [rango, setRango] = useState<RangoTemporal>('4s')
  const [atletaOverlay, setAtletaOverlay] = useState('')

  // Filtro por ejercicio (base de todo lo que sigue).
  const loadsEjercicio = useMemo(
    () =>
      ejercicio === '__todos__'
        ? loadsDivision
        : loadsDivision.filter((l) => l.load.exerciseName === ejercicio),
    [loadsDivision, ejercicio],
  )

  // Filtro por rango temporal — 'ultima' = sólo la fecha más reciente con
  // datos; '1s'/'4s' = ventana de días; 'todo' = sin recorte.
  const loadsFiltrados = useMemo(() => {
    if (rango === 'todo') return loadsEjercicio
    if (rango === 'ultima') {
      const max = loadsEjercicio.map((l) => l.fecha).sort((a, b) => b.localeCompare(a))[0]
      return max ? loadsEjercicio.filter((l) => l.fecha === max) : []
    }
    const cfg = RANGOS.find((r) => r.id === rango)!
    const limite = new Date()
    limite.setHours(0, 0, 0, 0)
    limite.setDate(limite.getDate() - cfg.dias!)
    return loadsEjercicio.filter((l) => parsearFechaLocal(l.fecha) >= limite)
  }, [loadsEjercicio, rango])

  // Fecha más reciente con datos dentro del filtro — la "matriz del día".
  const fechaMasReciente = useMemo(
    () =>
      loadsFiltrados
        .map((l) => l.fecha)
        .sort((a, b) => b.localeCompare(a))[0] ?? null,
    [loadsFiltrados],
  )
  const loadsDelDia = useMemo(
    () => loadsFiltrados.filter((l) => l.fecha === fechaMasReciente),
    [loadsFiltrados, fechaMasReciente],
  )
  // TODOS los registros de carga externa de ese día (sin el filtro de
  // ejercicio) — sirve para saber si un jugador cargó *algo*, aunque haya
  // sido de un ejercicio que después dejó de estar marcado con 🎯 (pasa
  // cuando el profe cambia el ejercicio a trackear). Así el "⚠️ Falta" y la
  // adhesión no penalizan a alguien que sí registró carga.
  const idsConAlgunaCargaDelDia = useMemo(
    () =>
      new Set(
        fechaMasReciente
          ? loadsDivision.filter((l) => l.fecha === fechaMasReciente).map((l) => l.athlete.id)
          : [],
      ),
    [loadsDivision, fechaMasReciente],
  )

  // Récord personal (histórico completo, sin filtro de rango) y sesión previa
  // por atleta+ejercicio, para la comparativa de la matriz.
  function contexto(athleteId: string, exerciseName: string, fecha: string) {
    const historial = loadsDivision
      .filter((l) => l.athlete.id === athleteId && l.load.exerciseName === exerciseName)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
    const pr = historial.reduce((max, l) => Math.max(max, l.topSet), 0)
    const previa = [...historial].reverse().find((l) => l.fecha < fecha)?.topSet ?? null
    return { pr, previa }
  }

  // Atletas que mandaron RPE el día de la matriz (proxy de "entrenó ese día").
  const idsRpeDelDia = useMemo(
    () =>
      new Set(
        fechaMasReciente
          ? sessionExecutions.filter((e) => e.fecha === fechaMasReciente).map((e) => e.athleteId)
          : [],
      ),
    [sessionExecutions, fechaMasReciente],
  )
  // Base de la adhesión = todos los que se sabe que entrenaron ese día:
  // mandaron RPE O cargaron alguna carga externa (un jugador puede cargar en
  // la Terminal de Fuerza sin mandar RPE — dos flujos distintos — así que el
  // ratio crudo "kilos / RPE" puede pasar de 100%). "⚠️ Falta" = mandó RPE
  // pero NO cargó NINGÚN ejercicio ese día (no penaliza al que cargó otro
  // ejercicio si el 🎯 cambió).
  const idsEntrenaronDelDia = new Set([...idsRpeDelDia, ...idsConAlgunaCargaDelDia])
  const atletasSinCargar = [...idsRpeDelDia]
    .filter((id) => !idsConAlgunaCargaDelDia.has(id))
    .map((id) => athletesById.get(id))
    .filter((a): a is Athlete => !!a)

  // KPIs del día.
  const cargaPromedioDia = loadsDelDia.length
    ? Math.round((loadsDelDia.reduce((s, l) => s + l.topSet, 0) / loadsDelDia.length) * 10) / 10
    : null
  const topLifter = loadsDelDia.reduce<LoadConContexto | null>(
    (max, l) => (!max || l.topSet > max.topSet ? l : max),
    null,
  )
  const adhesionPct = idsEntrenaronDelDia.size
    ? Math.min(100, Math.round((idsConAlgunaCargaDelDia.size / idsEntrenaronDelDia.size) * 100))
    : null

  // Progresión temporal: promedio de Top Set por semana (media de la
  // división) para el ejercicio elegido, + línea opcional de un atleta.
  const progresion = useMemo(() => {
    if (ejercicio === '__todos__') return []
    const porSemana = new Map<string, { suma: number; n: number; atleta: number | null }>()
    for (const l of loadsDivision) {
      if (l.load.exerciseName !== ejercicio) continue
      const claveSemana = fechaHoyLocal(inicioDeSemana(parsearFechaLocal(l.fecha)))
      const acc = porSemana.get(claveSemana) ?? { suma: 0, n: 0, atleta: null }
      acc.suma += l.topSet
      acc.n += 1
      if (atletaOverlay && l.athlete.id === atletaOverlay) {
        acc.atleta = Math.max(acc.atleta ?? 0, l.topSet)
      }
      porSemana.set(claveSemana, acc)
    }
    return Array.from(porSemana.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, v]) => ({
        semana: parsearFechaLocal(semana).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
        media: Math.round((v.suma / v.n) * 10) / 10,
        atleta: v.atleta,
      }))
  }, [loadsDivision, ejercicio, atletaOverlay])

  const sinDatos = loadsDivision.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          División: <span className="font-semibold text-slate-800 dark:text-slate-200">{divisionNombre}</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          <Field label="Ejercicio objetivo">
            <select
              className={inputClass}
              value={ejercicio}
              onChange={(e) => setEjercicio(e.target.value)}
            >
              <option value="__todos__">Todos</option>
              {ejerciciosDisponibles.map((ej) => (
                <option key={ej} value={ej}>
                  {ej}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rango">
            <select
              className={inputClass}
              value={rango}
              onChange={(e) => setRango(e.target.value as RangoTemporal)}
            >
              {RANGOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {sinDatos ? (
        <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay registros de carga externa de gimnasio para esta división. Los jugadores los
          cargan al enviar su RPE (ejercicios 🎯) o en la Terminal de Fuerza.
        </Card>
      ) : (
        <>
          {/* KPIs del día */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Carga promedio del grupo
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {cargaPromedioDia != null ? `${cargaPromedioDia} kg` : '—'}
              </span>
              <span className="text-xs text-slate-400">
                {ejercicio === '__todos__' ? 'Todos los ejercicios' : ejercicio}
                {fechaMasReciente
                  ? ` · ${parsearFechaLocal(fechaMasReciente).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`
                  : ''}
              </span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Top Lifter del día
              </span>
              <span className="text-2xl font-bold text-union-red-600 dark:text-union-red-400">
                {topLifter ? `${topLifter.topSet} kg` : '—'}
              </span>
              <span className="truncate text-xs text-slate-400">
                {topLifter ? `${topLifter.athlete.nombre} · ${topLifter.load.exerciseName}` : 'Sin datos'}
              </span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Adhesión de carga externa
              </span>
              <span
                className={`text-2xl font-bold ${
                  adhesionPct == null
                    ? 'text-slate-400'
                    : adhesionPct >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : adhesionPct >= 50
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {adhesionPct != null ? `${adhesionPct}%` : '—'}
              </span>
              <span className="text-xs text-slate-400">
                {idsEntrenaronDelDia.size
                  ? `${idsConAlgunaCargaDelDia.size} de ${idsEntrenaronDelDia.size} que entrenaron`
                  : 'Sin actividad registrada ese día'}
              </span>
            </Card>
          </div>

          {/* Matriz de Rendimiento Diario */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Matriz de rendimiento
                {fechaMasReciente && (
                  <span className="ml-1 font-normal text-slate-400">
                    — {parsearFechaLocal(fechaMasReciente).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                )}
              </h2>
            </div>
            {loadsDelDia.length === 0 && atletasSinCargar.length === 0 ? (
              <p className="text-sm text-slate-400">Sin registros en el rango seleccionado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
                      <th className="py-2 pr-3">Jugador</th>
                      <th className="py-2 pr-3">Ejercicio</th>
                      <th className="py-2 pr-3 text-right">Kg últ. serie</th>
                      <th className="py-2 pr-3 text-right">Tonelaje</th>
                      <th className="py-2 pr-3 text-right">vs. sesión previa</th>
                      <th className="py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadsDelDia
                      .sort((a, b) => b.topSet - a.topSet)
                      .map(({ load, athlete, fecha, topSet }) => {
                        const { pr, previa } = contexto(athlete.id, load.exerciseName, fecha)
                        const esPr = topSet >= pr && topSet > 0
                        const diff = previa != null ? topSet - previa : null
                        const diffPct = previa ? Math.round((diff! / previa) * 100) : null
                        return (
                          <tr
                            key={load.id}
                            className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                          >
                            <td className="py-2 pr-3 font-medium text-slate-800 dark:text-slate-200">
                              {athlete.nombre}
                            </td>
                            <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                              {load.exerciseName}
                              {esPr && (
                                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                                  PR
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {topSet} kg
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-500 dark:text-slate-400">
                              {load.totalTonnage.toLocaleString('es-AR')} kg
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums">
                              {diff == null ? (
                                <span className="text-slate-300 dark:text-slate-600">—</span>
                              ) : (
                                <span
                                  className={
                                    diff > 0
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : diff < 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-slate-400'
                                  }
                                >
                                  {diff > 0 ? '+' : ''}
                                  {diff} kg{diffPct != null ? ` (${diffPct > 0 ? '+' : ''}${diffPct}%)` : ''}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-center">
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                ✅ Completó
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    {atletasSinCargar.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="py-2 pr-3 font-medium text-slate-500 dark:text-slate-400">{a.nombre}</td>
                        <td className="py-2 pr-3 text-slate-400" colSpan={4}>
                          Mandó RPE, no registró kilos
                        </td>
                        <td className="py-2 text-center">
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                            ⚠️ Falta
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Progresión temporal */}
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Progresión de carga externa (media de la división por semana)
              </h2>
              {ejercicio !== '__todos__' && (
                <select
                  className={`${inputClass} max-w-[200px] py-1.5 text-xs`}
                  value={atletaOverlay}
                  onChange={(e) => setAtletaOverlay(e.target.value)}
                >
                  <option value="">Comparar con un jugador…</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {ejercicio === '__todos__' ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Elegí un ejercicio objetivo arriba para ver su evolución en el tiempo.
              </p>
            ) : progresion.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Sin registros de "{ejercicio}" para graficar todavía.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progresion} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" kg" width={52} />
                    <Tooltip formatter={(v) => [`${v} kg`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="media"
                      name="Media división"
                      stroke={UNION_ROJO}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      connectNulls
                    />
                    {atletaOverlay && (
                      <Line
                        type="monotone"
                        dataKey="atleta"
                        name={athletesById.get(atletaOverlay)?.nombre ?? 'Jugador'}
                        stroke={AZUL}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
