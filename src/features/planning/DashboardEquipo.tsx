import { useState } from 'react'
import {
  useAppStore,
  useAthletesActivos,
  useSessionExecutionsActivas,
  useSessionPlansActivos,
  useWellnessEntriesActivas,
  useGymExternalLoadsActivos,
} from '@/store/useAppStore'
import { StatCard } from '@/components/StatCard'
import { Card } from '@/components/Card'
import { Badge, type BadgeTone } from '@/components/Badge'
import { Avatar } from '@/components/Avatar'
import { MiniBarChart } from '@/components/MiniBarChart'
import {
  calcularAcwr,
  calcularSRpeSemana,
  calcularSerieUltimos7Dias,
  calcularCargaEjecutadaReal,
  calcularMonotonia,
  calcularStrain,
  compararConObjetivo,
  UMBRAL_MONOTONIA_ALTA,
  type NivelRiesgoAcwr,
} from '@/features/workload/calculations'
import { calcularReadiness, obtenerWellnessDelDia } from '@/features/wellness/calculations'
import { IngresoModal } from '@/features/wellness/IngresoModal'
import { fechaHoyLocal } from '@/utils/fecha'
import { InfoTooltip } from '@/components/InfoTooltip'
import { inputClass } from '@/components/FormField'
import { GRUPOS_POSICION, grupoDePosicion } from '@/utils/posicion'
import { evaluarRiesgoAtleta, nivelSemaforo, type NivelSemaforo } from './riskAssessment'
import { AnalisisGrupalModal } from './AnalisisGrupalModal'
import type { EstadoSalud } from '@/types'

const ESTADO_TONE: Record<EstadoSalud, BadgeTone> = {
  Activo: 'green',
  Rehabilitación: 'yellow',
  'Baja Médica': 'red',
}

const ESTADO_LABEL: Record<EstadoSalud, string> = {
  Activo: 'Activo',
  Rehabilitación: 'Rehabilitación',
  'Baja Médica': 'Baja Médica',
}

const RIESGO_TONE: Record<NivelRiesgoAcwr, BadgeTone> = {
  bajo: 'blue',
  optimo: 'green',
  precaucion: 'yellow',
  alto: 'red',
  'sin-datos': 'gray',
}

const RIESGO_LABEL: Record<NivelRiesgoAcwr, string> = {
  bajo: 'Baja carga',
  optimo: 'Óptimo',
  precaucion: 'Precaución',
  alto: 'Alto riesgo',
  'sin-datos': 'Sin datos',
}

const RIESGO_BARRA: Record<NivelRiesgoAcwr, string> = {
  bajo: 'bg-sky-500 dark:bg-sky-400',
  optimo: 'bg-emerald-500 dark:bg-emerald-400',
  precaucion: 'bg-amber-500 dark:bg-amber-400',
  alto: 'bg-rose-500 dark:bg-rose-400',
  'sin-datos': 'bg-slate-300 dark:bg-slate-600',
}

const CARD_BORDE_RIESGO: Record<NivelSemaforo, string> = {
  rojo: 'border-rose-300 dark:border-rose-500/40',
  amarillo: 'border-amber-300 dark:border-amber-500/40',
  verde: '',
}

const RIESGO_SEMAFORO_BADGE: Record<NivelSemaforo, { tone: BadgeTone; label: string } | null> = {
  rojo: { tone: 'red', label: '🔴 Riesgo alto' },
  amarillo: { tone: 'yellow', label: '🟡 Riesgo moderado' },
  verde: null,
}

export function DashboardEquipo() {
  const athletes = useAthletesActivos()
  const sessionExecutions = useSessionExecutionsActivas()
  const sessionPlans = useSessionPlansActivos()
  const wellnessEntries = useWellnessEntriesActivas()
  const gymExternalLoads = useGymExternalLoadsActivos()
  const categories = useAppStore((s) => s.categories)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const filtroNombre = useAppStore((s) => s.filtroNombre)
  const filtroPosicion = useAppStore((s) => s.filtroPosicion)
  const setFiltroNombre = useAppStore((s) => s.setFiltroNombre)
  const setFiltroPosicion = useAppStore((s) => s.setFiltroPosicion)
  const abrirModalIngreso = useAppStore((s) => s.abrirModalIngreso)
  const [analisisAbierto, setAnalisisAbierto] = useState(false)

  const categoriaActual = categories.find((c) => c.id === activeCategoryId)
  const hoy = fechaHoyLocal()
  // Fase 13 ("Doble Turno"): hoy puede tener varias sesiones (Campo + Gimnasio) —
  // el objetivo del día es la suma de las de todas, no la de una sola.
  const sesionesHoy = sessionPlans.filter((p) => p.fecha === hoy)
  const hayPlanHoy = sesionesHoy.length > 0
  const cargaObjetivoHoy = sesionesHoy.reduce((sum, p) => sum + p.cargaObjetivo, 0)

  const aptos = athletes.filter((a) => a.estadoSalud === 'Activo').length
  const bajasMedicas = athletes.filter((a) => a.estadoSalud !== 'Activo').length

  const acwrPorAtleta = athletes.map((athlete) => {
    const acwr = calcularAcwr(sessionExecutions, sessionPlans, athlete.id)
    const wellnessHoy = obtenerWellnessDelDia(wellnessEntries, athlete.id, hoy)
    const ejecucionesHoyAtleta = sessionExecutions.filter((e) => e.athleteId === athlete.id && e.fecha === hoy)
    const evaluacionRiesgo = evaluarRiesgoAtleta({ wellnessHoy, ejecucionesHoyAtleta, acwr })
    return { athlete, acwr, wellnessHoy, evaluacionRiesgo }
  })
  const alertasAltoRiesgo = acwrPorAtleta.filter((a) => a.acwr.riesgo === 'alto').length
  const alertasFatiga = acwrPorAtleta.filter((a) => a.evaluacionRiesgo.alertaFatiga).length

  const evaluaciones = new Map(acwrPorAtleta.map((a) => [a.athlete.id, a.evaluacionRiesgo]))

  const nombreBuscado = filtroNombre.trim().toLowerCase()
  // Fase 20: "Smart Sorting" — mayor Risk Score arriba (semáforos rojos primero),
  // empate se desempata alfabéticamente para que el orden no "salte" entre renders.
  const acwrFiltrado = acwrPorAtleta
    .filter(({ athlete }) => {
      const coincideNombre = athlete.nombre.toLowerCase().includes(nombreBuscado)
      const coincidePosicion =
        filtroPosicion === 'todas' || athlete.posiciones.some((p) => grupoDePosicion(p) === filtroPosicion)
      return coincideNombre && coincidePosicion
    })
    .sort((a, b) => {
      const diff = b.evaluacionRiesgo.riskScore - a.evaluacionRiesgo.riskScore
      return diff !== 0 ? diff : a.athlete.nombre.localeCompare(b.athlete.nombre)
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Control Carga Interna
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            sRPE semanal y riesgo de carga (ACWR) por jugador
          </p>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            ℹ️ Escala Readiness: 1 (Pésimo) ➡️ 5 (Óptimo)
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setAnalisisAbierto(true)}
            disabled={athletes.length === 0}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            📊 Análisis Grupal
          </button>
          <button
            type="button"
            onClick={() => abrirModalIngreso('wellness')}
            className="rounded-xl bg-union-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-union-red-700"
          >
            + Ingresar Datos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Plantel" value={athletes.length} />
        <StatCard label="Aptos" value={aptos} />
        <StatCard label="Bajas médicas" value={bajasMedicas} />
        <Card
          className={`flex flex-col gap-1 ${
            alertasAltoRiesgo > 0 ? 'border-rose-300 dark:border-rose-500/40' : ''
          }`}
        >
          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            Alertas ACWR
            <InfoTooltip
              titulo="ACWR (Acute:Chronic Workload Ratio)"
              descripcion="Carga aguda (7 días) sobre carga crónica (28 días, promedio semanal). Mantener el ACWR entre 0.8 y 1.3 minimiza el riesgo relativo de lesión (zona óptima/sweet spot de adaptación). Picos mayores a 1.5 representan la zona de peligro, con riesgo de lesión aumentando exponencialmente."
              cita="Gabbett, T.J. (2016). The training-injury prevention paradox: should athletes be training smarter and harder? British Journal of Sports Medicine. (Basado en deportes de equipo)."
            />
          </span>
          <span
            className={`text-2xl font-semibold ${
              alertasAltoRiesgo > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {alertasAltoRiesgo}
          </span>
          <span className="text-xs text-slate-400">Riesgo alto (ACWR &gt; 1.5)</span>
        </Card>
        <Card
          className={`flex flex-col gap-1 ${
            alertasFatiga > 0 ? 'border-rose-300 dark:border-rose-500/40' : ''
          }`}
        >
          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            Alertas Fatiga
            <InfoTooltip
              titulo="Alerta de Fatiga (Hooper + ACWR)"
              descripcion="Sin plataformas de fuerza para medir RSI modificado, la alerta usa sólo métricas subjetivas validadas: Wellness del día crítico (≤12/20, Índice de Hooper) o dolor muscular/fatiga severos, O ACWR en zona de peligro (&gt;1.5)."
              cita="Hooper, S.L. et al. (1995). Markers for monitoring overtraining and recovery. Medicine & Science in Sports & Exercise, 27(1). Gabbett, T.J. (2016), ACWR."
            />
          </span>
          <span
            className={`text-2xl font-semibold ${
              alertasFatiga > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {alertasFatiga}
          </span>
          <span className="text-xs text-slate-400">Wellness crítico o ACWR &gt; 1.5</span>
        </Card>
      </div>

      {athletes.length === 0 && (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No hay jugadores cargados para esta categoría en esta temporada.
        </Card>
      )}

      {athletes.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            placeholder="Buscar jugador por nombre…"
            className={`sm:max-w-xs ${inputClass}`}
          />
          <select
            value={filtroPosicion}
            onChange={(e) => setFiltroPosicion(e.target.value as typeof filtroPosicion)}
            className={`sm:max-w-[200px] ${inputClass}`}
          >
            <option value="todas">Todas las posiciones</option>
            {GRUPOS_POSICION.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      )}

      {athletes.length > 0 && acwrFiltrado.length === 0 && (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Ningún jugador coincide con la búsqueda/filtro.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {acwrFiltrado.map(({ athlete, acwr, wellnessHoy, evaluacionRiesgo }) => {
          const sRpeSemana = calcularSRpeSemana(sessionExecutions, sessionPlans, athlete.id)
          const serie = calcularSerieUltimos7Dias(sessionExecutions, sessionPlans, athlete.id)
          const monotonia = calcularMonotonia(serie)
          const strain = calcularStrain(sRpeSemana, monotonia)
          const monotoniaAlta = monotonia !== null && monotonia >= UMBRAL_MONOTONIA_ALTA
          const readiness = wellnessHoy ? calcularReadiness(wellnessHoy) : null
          const nivelRiesgo = nivelSemaforo(evaluacionRiesgo.riskScore)
          const riesgoBadge = RIESGO_SEMAFORO_BADGE[nivelRiesgo]

          let comparacionHoy: ReturnType<typeof compararConObjetivo> | null = null
          let faltaTiempoHoy = false
          if (hayPlanHoy) {
            const ejecucionesHoyAtleta = sessionExecutions.filter(
              (e) => e.athleteId === athlete.id && e.fecha === hoy,
            )
            const cargasHoy = ejecucionesHoyAtleta.map((e) => calcularCargaEjecutadaReal(e, sessionPlans))
            const huboRegistro = ejecucionesHoyAtleta.length > 0
            const hayCargaCalculable = cargasHoy.some((c) => c !== null)
            faltaTiempoHoy = huboRegistro && !hayCargaCalculable
            const ejecutadoHoy = cargasHoy.reduce((sum: number, c) => sum + (c ?? 0), 0)
            comparacionHoy = compararConObjetivo(
              huboRegistro && hayCargaCalculable ? ejecutadoHoy : null,
              cargaObjetivoHoy,
            )
          }

          return (
            <Card key={athlete.id} className={`flex flex-col gap-4 ${CARD_BORDE_RIESGO[nivelRiesgo]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar nombre={athlete.nombre} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {athlete.nombre}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {athlete.posiciones.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={ESTADO_TONE[athlete.estadoSalud]}>
                    {ESTADO_LABEL[athlete.estadoSalud]}
                  </Badge>
                  {riesgoBadge && (
                    <Badge tone={riesgoBadge.tone} className="whitespace-nowrap">
                      {riesgoBadge.label}
                    </Badge>
                  )}
                </div>
              </div>

              {wellnessHoy?.comentarioDolor && (
                <p className="-mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs italic leading-snug text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  🗨️ "{wellnessHoy.comentarioDolor}"
                </p>
              )}

              {(evaluacionRiesgo.alertaFatiga || acwr.riesgo === 'alto' || monotoniaAlta) && (
                <div className="-mt-2 flex flex-wrap gap-1.5">
                  {acwr.riesgo === 'alto' && acwr.acwr !== null && (
                    <Badge tone="red" className="whitespace-nowrap">
                      🔥 ACWR Peligroso: {acwr.acwr.toFixed(1)}
                    </Badge>
                  )}
                  {monotoniaAlta && (
                    <Badge tone="orange" className="whitespace-nowrap">
                      📈 Alta Monotonía
                    </Badge>
                  )}
                  {evaluacionRiesgo.alertaFatiga && (
                    <Badge tone="red" className="whitespace-nowrap">
                      🥵 Fatiga Severa
                    </Badge>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    sRPE semana
                    <InfoTooltip
                      titulo="sRPE (session-RPE)"
                      descripcion="RPE de la sesión (0-10) × duración en minutos = Unidades Arbitrarias (UA). Método válido para cuantificar la carga interna en fútbol, correlacionado fuertemente con la frecuencia cardíaca y el lactato en deportes de conjunto intermitentes."
                      cita="Impellizzeri, F.M. et al. (2004). Use of RPE-based training load in soccer. Medicine & Science in Sports & Exercise."
                    />
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {sRpeSemana} <span className="text-xs font-normal text-slate-400">AU</span>
                  </p>
                  <MiniBarChart valores={serie} className="mt-2" />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      Monotonía {monotonia !== null ? monotonia.toFixed(2) : '—'}
                      <InfoTooltip
                        titulo="Monotonía y Strain (Foster)"
                        descripcion="Monotonía = carga media semanal / desvío estándar semanal — entrenar siempre igual de fuerte, sin variar, es un factor de riesgo aunque la carga total no sea alta (valores ≥2 se consideran altos). Strain = carga total semanal × Monotonía."
                        cita="Foster, C. (1998). Monitoring training in athletes with reference to overtraining syndrome. Medicine & Science in Sports & Exercise, 30(7), 1164-1168."
                      />
                    </span>
                    <span>Strain {strain !== null ? strain.toLocaleString('es-AR') : '—'}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    ACWR
                    <InfoTooltip
                      titulo="ACWR (Acute:Chronic Workload Ratio)"
                      descripcion="Carga aguda (7 días) sobre carga crónica (28 días, promedio semanal). Mantener el ACWR entre 0.8 y 1.3 minimiza el riesgo relativo de lesión (zona óptima/sweet spot de adaptación). Picos mayores a 1.5 representan la zona de peligro, con riesgo de lesión aumentando exponencialmente."
                      cita="Gabbett, T.J. (2016). The training-injury prevention paradox: should athletes be training smarter and harder? British Journal of Sports Medicine. (Basado en deportes de equipo)."
                    />
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {acwr.acwr !== null ? (
                      acwr.acwr.toFixed(2)
                    ) : (
                      <span className="text-sm font-normal text-slate-400">Recopilando datos…</span>
                    )}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full ${RIESGO_BARRA[acwr.riesgo]}`}
                      style={{
                        width: acwr.acwr !== null ? `${Math.min((acwr.acwr / 2) * 100, 100)}%` : '0%',
                      }}
                    />
                  </div>
                  <Badge tone={RIESGO_TONE[acwr.riesgo]} className="mt-2">
                    {RIESGO_LABEL[acwr.riesgo]}
                  </Badge>
                </div>
              </div>

              {hayPlanHoy && comparacionHoy && (
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div className="flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Hoy: objetivo vs. ejecutado</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {cargaObjetivoHoy} AU
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        comparacionHoy.tone === 'red'
                          ? 'bg-rose-500'
                          : comparacionHoy.tone === 'yellow'
                            ? 'bg-amber-500'
                            : comparacionHoy.tone === 'green'
                              ? 'bg-emerald-500'
                              : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{
                        width:
                          comparacionHoy.ejecutado !== null && cargaObjetivoHoy > 0
                            ? `${Math.min((comparacionHoy.ejecutado / cargaObjetivoHoy) * 100, 130)}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {comparacionHoy.ejecutado !== null
                        ? `${comparacionHoy.ejecutado} AU`
                        : faltaTiempoHoy
                          ? 'RPE cargado'
                          : 'Sin registro'}
                    </span>
                    {faltaTiempoHoy ? (
                      <Badge tone="yellow">⏳ Falta tiempo</Badge>
                    ) : (
                      <Badge tone={comparacionHoy.tone}>{comparacionHoy.label}</Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  Readiness (hoy)
                  {wellnessHoy && (
                    <InfoTooltip
                      titulo="Desglose de Wellness de hoy"
                      descripcion={`🛌 Sueño: ${wellnessHoy.sueno} | 🧠 Estrés: ${wellnessHoy.estres} | 🔋 Fatiga: ${wellnessHoy.fatiga} | 🦵 Dolor: ${wellnessHoy.dolorMuscular}`}
                      cita="* Valores más cercanos a 5 indican un mejor estado de recuperación."
                    />
                  )}
                </span>
                {readiness !== null ? (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {readiness.toFixed(1)} / 5
                  </span>
                ) : (
                  <span className="text-slate-400">Sin registro hoy</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      <IngresoModal />
      {analisisAbierto && (
        <AnalisisGrupalModal
          athletes={athletes}
          evaluaciones={evaluaciones}
          wellnessEntries={wellnessEntries}
          sessionExecutions={sessionExecutions}
          gymExternalLoads={gymExternalLoads}
          sessionPlans={sessionPlans}
          categoriaNombre={categoriaActual?.nombre ?? 'Categoría'}
          hoy={hoy}
          onClose={() => setAnalisisAbierto(false)}
        />
      )}
    </div>
  )
}
