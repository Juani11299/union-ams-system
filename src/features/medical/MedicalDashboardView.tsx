import { useState } from 'react'
import { useAthletesActivos, useAppStore } from '@/store/useAppStore'
import {
  useMedicalStore,
  FASES_CURACION,
  UMBRAL_ASIMETRIA_ALTA_PCT,
  type FaseCuracion,
  type RtpProtocolo,
} from '@/stores/useMedicalStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'

/** Stepper de las 3 fases de curación tisular (Cap. 22 NSCA, Tabla 22.1). */
function StepperFases({ faseActual, onCambiarFase }: { faseActual: FaseCuracion; onCambiarFase: (f: FaseCuracion) => void }) {
  const idxActual = FASES_CURACION.findIndex((f) => f.key === faseActual)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {FASES_CURACION.map((fase, idx) => {
          const alcanzada = idx <= idxActual
          return (
            <div key={fase.key} className="flex flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => onCambiarFase(fase.key)}
                title={fase.descripcion}
                className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors ${
                  fase.key === faseActual
                    ? 'bg-union-red-600 text-white'
                    : alcanzada
                      ? 'bg-union-red-100 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {idx + 1}. {fase.label}
              </button>
              {idx < FASES_CURACION.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-400">{FASES_CURACION[idxActual]?.descripcion}</p>
    </div>
  )
}

function TarjetaProtocolo({ protocolo, nombreAtleta }: { protocolo: RtpProtocolo; nombreAtleta: string }) {
  const actualizarFase = useMedicalStore((s) => s.actualizarFase)
  const actualizarAsimetria = useMedicalStore((s) => s.actualizarAsimetria)
  const actualizarNotas = useMedicalStore((s) => s.actualizarNotas)
  const darDeAlta = useMedicalStore((s) => s.darDeAlta)

  const [asimetriaInput, setAsimetriaInput] = useState(protocolo.asimetriaPct?.toString() ?? '')

  const asimetriaValida = asimetriaInput !== '' && !Number.isNaN(Number(asimetriaInput))
  const asimetriaGuardada = protocolo.asimetriaPct

  // Lógica de negocio crítica (Cap. 22, p. 1283): diferencias laterolaterales
  // >10% BLOQUEAN el alta — la decisión final sigue siendo del médico, pero
  // el sistema no deja avanzar el botón hasta que el dato esté dentro de rango.
  const puedeDarDeAlta = asimetriaGuardada !== null && asimetriaGuardada <= UMBRAL_ASIMETRIA_ALTA_PCT

  function handleGuardarAsimetria() {
    if (!asimetriaValida) return
    actualizarAsimetria(protocolo.id, Number(asimetriaInput))
  }

  function handleDarDeAlta() {
    darDeAlta(protocolo.id)
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar nombre={nombreAtleta} />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{nombreAtleta}</p>
            <p className="text-xs text-slate-400">
              {protocolo.lesionDescripcion} — inicio {protocolo.fechaInicio}
            </p>
          </div>
        </div>
        {protocolo.estado === 'alta' && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            Alta {protocolo.fechaAlta}
          </span>
        )}
      </div>

      <StepperFases faseActual={protocolo.faseActual} onCambiarFase={(f) => actualizarFase(protocolo.id, f)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Asimetría laterolateral (%) — umbral de alta: ≤{UMBRAL_ASIMETRIA_ALTA_PCT}%
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={asimetriaInput}
              onChange={(e) => setAsimetriaInput(e.target.value)}
              disabled={protocolo.estado === 'alta'}
              placeholder="Ej. 8.5"
            />
            <button
              type="button"
              onClick={handleGuardarAsimetria}
              disabled={!asimetriaValida || protocolo.estado === 'alta'}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Guardar
            </button>
          </div>
          {asimetriaGuardada !== null && (
            <span className={`text-xs ${asimetriaGuardada <= UMBRAL_ASIMETRIA_ALTA_PCT ? 'text-emerald-600' : 'text-union-red-600'}`}>
              Último valor registrado: {asimetriaGuardada}%
            </span>
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Notas de evolución</span>
        <textarea
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          rows={2}
          value={protocolo.notas}
          onChange={(e) => actualizarNotas(protocolo.id, e.target.value)}
          disabled={protocolo.estado === 'alta'}
        />
      </label>

      {protocolo.estado === 'activo' && (
        <div>
          <button
            type="button"
            onClick={handleDarDeAlta}
            disabled={!puedeDarDeAlta}
            title={
              puedeDarDeAlta
                ? undefined
                : `Bloqueado: la asimetría debe ser ≤${UMBRAL_ASIMETRIA_ALTA_PCT}% (Cap. 22 NSCA, p. 1283)`
            }
            className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:w-auto ${
              puedeDarDeAlta
                ? 'bg-union-red-600 text-white hover:bg-union-red-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            {puedeDarDeAlta ? '✓ Dar de Alta (RTP)' : `🔒 Dar de Alta (RTP) — asimetría > ${UMBRAL_ASIMETRIA_ALTA_PCT}%`}
          </button>
        </div>
      )}
    </Card>
  )
}

export function MedicalDashboardView() {
  const athletes = useAthletesActivos()
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  const protocolos = useMedicalStore((s) => s.protocolos)
  const crearProtocolo = useMedicalStore((s) => s.crearProtocolo)

  const [athleteId, setAthleteId] = useState('')
  const [lesionDescripcion, setLesionDescripcion] = useState('')
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10))

  if (!activeSeasonId || !activeCategoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para ver el Dashboard RTP.
      </Card>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!athleteId || !lesionDescripcion.trim()) return
    crearProtocolo({ athleteId, lesionDescripcion: lesionDescripcion.trim(), fechaInicio })
    setLesionDescripcion('')
  }

  const activos = protocolos.filter((p) => p.estado === 'activo')
  const dadosDeAlta = protocolos.filter((p) => p.estado === 'alta')
  const idsConProtocoloActivo = new Set(activos.map((p) => p.athleteId))
  const athletesDisponibles = athletes.filter((a) => !idsConProtocoloActivo.has(a.id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">PANEL DE KINESIOLOGÍA — RTP</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Puente Médico-Fuerza — fases de curación tisular y alta condicionada por asimetría laterolateral (Cap. 22 NSCA).
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Iniciar protocolo RTP</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Atleta</span>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
            >
              <option value="">Seleccioná un atleta…</option>
              {athletesDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Lesión</span>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={lesionDescripcion}
              onChange={(e) => setLesionDescripcion(e.target.value)}
              placeholder="Ej. Esguince LCA rodilla izq."
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Fecha inicio</span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={!athleteId || !lesionDescripcion.trim()}
            className="rounded-lg bg-union-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-4"
          >
            + Iniciar protocolo
          </button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Protocolos activos</h2>
        {activos.length === 0 ? (
          <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Ningún jugador en protocolo RTP activo ahora mismo. 🎉
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {activos.map((p) => {
              const atleta = athletes.find((a) => a.id === p.athleteId)
              return <TarjetaProtocolo key={p.id} protocolo={p} nombreAtleta={atleta?.nombre ?? 'Atleta'} />
            })}
          </div>
        )}
      </div>

      {dadosDeAlta.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Dados de alta</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dadosDeAlta.map((p) => {
              const atleta = athletes.find((a) => a.id === p.athleteId)
              return <TarjetaProtocolo key={p.id} protocolo={p} nombreAtleta={atleta?.nombre ?? 'Atleta'} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}
