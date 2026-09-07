import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { parsearNumero, SERIES_DEFAULT, REPS_DEFAULT } from './RegistroModal'
import type { Athlete, GymSet, GymSheetEjercicio } from '@/types'

interface ListaControlCargaProps {
  jugadores: Athlete[]
  sesionId: string
  ejercicios: GymSheetEjercicio[]
}

/**
 * "Modo Lista" (Fase 37) — el "Modo Jugador" (`RegistroModal`, tocar tu
 * nombre y cargar) sigue existiendo para que el plantel se autogestione,
 * pero cuando el PROFE quiere completar la carga de todo el equipo de una
 * sentada (desde una notebook/tablet, no pasando el celular jugador por
 * jugador), una tabla es muchísimo más rápida: todos los jugadores en
 * filas, un grupo de columnas (Series / Reps / Top Set) por cada ejercicio
 * trackeado, sin abrir un modal por persona.
 *
 * Guarda solo, por celda, al salir del campo de Top Set (no hay botón
 * "Guardar" general) — igual que el resto de los inputs "chicos" de la app
 * (ver `ConfiguracionSesionDiaria`/Microciclo semanal). Series/Reps también
 * se guardan si se tocan, pero sólo junto con un Top Set > 0 — cargar
 * series sin peso no crea un registro fantasma.
 *
 * Ajuste (2026-09-08): el campo que importa recorrer rápido, jugador tras
 * jugador, es UNO solo — el Top Set. Series/Reps casi nunca cambian del
 * plan, así que en vez de 3 inputs por ejercicio (mucho ruido visual para
 * recorrer 26 filas), la celda muestra Series/Reps como texto fijo con un
 * lápiz al lado — sólo se abren como inputs si alguien realmente necesita
 * corregirlos para un jugador puntual ese día. Un jugador ausente
 * simplemente se deja con el Top Set vacío — no bloquea nada, no hace
 * falta marcarlo aparte, el resto de la tabla (mismo u otro ejercicio) se
 * completa en cualquier orden.
 */
export function ListaControlCarga({ jugadores, sesionId, ejercicios }: ListaControlCargaProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="bg-white/5">
            <th className="sticky left-0 z-10 bg-union-charcoal px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
              Jugador
            </th>
            {ejercicios.map((ej) => (
              <th
                key={ej.id}
                className="border-l border-white/10 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                {ej.nombre}
                {(ej.series || ej.repeticiones) && (
                  <span className="block text-[10px] font-normal normal-case text-white/40">
                    Plan: {ej.series || '—'} x {ej.repeticiones || '—'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jugadores.map((jugador) => (
            <tr key={jugador.id} className="border-t border-white/10 odd:bg-white/[0.02]">
              <td className="sticky left-0 z-10 bg-union-charcoal px-4 py-2 text-left font-semibold">
                {jugador.nombre}
              </td>
              {ejercicios.map((ej) => (
                <CeldaEjercicio
                  key={ej.id}
                  jugador={jugador}
                  sesionId={sesionId}
                  ejercicio={ej}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CeldaEjercicio({
  jugador,
  sesionId,
  ejercicio,
}: {
  jugador: Athlete
  sesionId: string
  ejercicio: GymSheetEjercicio
}) {
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const submitGymExternalLoad = useAppStore((s) => s.submitGymExternalLoad)
  const showToast = useToastStore((s) => s.showToast)

  const registroExistente = gymExternalLoads.find(
    (g) => g.athleteId === jugador.id && g.sessionId === sesionId && g.exerciseName === ejercicio.nombre,
  )

  const seriesPlanificadas = parsearNumero(ejercicio.series, SERIES_DEFAULT)
  const repsPlanificadas = parsearNumero(ejercicio.repeticiones, REPS_DEFAULT)

  const [series, setSeries] = useState(registroExistente?.setsData.length ?? seriesPlanificadas)
  const [reps, setReps] = useState(registroExistente?.setsData[0]?.reps ?? repsPlanificadas)
  const [topSetKg, setTopSetKg] = useState(
    registroExistente && registroExistente.setsData.length > 0
      ? Math.max(...registroExistente.setsData.map((s) => s.weightKg))
      : 0,
  )
  const [guardando, setGuardando] = useState(false)
  // Series/Reps arrancan cerrados (sólo texto "4x5") — se abren como inputs
  // editables sólo si el profe realmente necesita corregirlos para este
  // jugador puntual, en vez de ocupar espacio en las 26 filas de siempre.
  const [editandoPlan, setEditandoPlan] = useState(false)

  async function guardarSiCorresponde() {
    // Sin Top Set cargado no hay nada que guardar — evita crear un registro
    // "vacío" sólo porque el profe tocó el campo de series de alguien que
    // todavía no entrenó ese ejercicio.
    if (topSetKg <= 0) return
    setGuardando(true)
    try {
      const setsData: GymSet[] = Array.from({ length: series }, () => ({ reps, weightKg: topSetKg }))
      await submitGymExternalLoad({
        athleteId: jugador.id,
        sessionId: sesionId,
        exerciseName: ejercicio.nombre,
        setsData,
        totalTonnage: series * reps * topSetKg,
      })
    } catch (err) {
      showToast('error', getErrorMessage(err, `No se pudo guardar ${ejercicio.nombre} de ${jugador.nombre}.`))
    } finally {
      setGuardando(false)
    }
  }

  const celdaChicaClase =
    'w-11 rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-center text-xs text-white focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 disabled:opacity-50'

  return (
    <td className="border-l border-white/10 px-3 py-2">
      <div className="flex flex-col items-center gap-1">
        <input
          type="number"
          min={0}
          step={2.5}
          value={topSetKg || ''}
          placeholder="—"
          disabled={guardando}
          onChange={(e) => setTopSetKg(Number(e.target.value) || 0)}
          onBlur={guardarSiCorresponde}
          className={`w-24 rounded-lg border-2 bg-white/5 px-2 py-2 text-center text-2xl font-black focus:outline-none focus:ring-2 focus:ring-union-red-500 disabled:opacity-50 ${
            registroExistente ? 'border-emerald-500/60 text-emerald-400' : 'border-white/10 text-white'
          }`}
          aria-label={`Top Set en kg de ${ejercicio.nombre} para ${jugador.nombre}`}
        />

        {editandoPlan ? (
          <div className="flex items-center gap-1 text-white/60">
            <input
              type="number"
              min={1}
              value={series}
              disabled={guardando}
              onChange={(e) => setSeries(Number(e.target.value) || 1)}
              onBlur={guardarSiCorresponde}
              className={celdaChicaClase}
              aria-label={`Series de ${ejercicio.nombre} para ${jugador.nombre}`}
            />
            <span className="text-[10px]">x</span>
            <input
              type="number"
              min={1}
              value={reps}
              disabled={guardando}
              onChange={(e) => setReps(Number(e.target.value) || 1)}
              onBlur={guardarSiCorresponde}
              className={celdaChicaClase}
              aria-label={`Repeticiones de ${ejercicio.nombre} para ${jugador.nombre}`}
            />
            <button
              type="button"
              onClick={() => setEditandoPlan(false)}
              aria-label="Cerrar edición de series/repeticiones"
              className="px-1 text-white/40 hover:text-white/70"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditandoPlan(true)}
            title="Corregir series/repeticiones para este jugador"
            className="text-[10px] text-white/40 hover:text-white/70"
          >
            ✏️ {series}x{reps}
          </button>
        )}
      </div>
    </td>
  )
}
