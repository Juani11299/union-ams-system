import { useState } from 'react'
import { useAppStore, useAthletesActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { Badge, type BadgeTone } from '@/components/Badge'
import { getErrorMessage } from '@/utils/errors'
import type { Athlete, EstadoSalud } from '@/types'

const ESTADO_TONE: Record<EstadoSalud, BadgeTone> = {
  Activo: 'green',
  Rehabilitación: 'yellow',
  'Baja Médica': 'red',
}

function FichaMedica({ athlete }: { athlete: Athlete }) {
  const updateAthlete = useAppStore((s) => s.updateAthlete)
  const showToast = useToastStore((s) => s.showToast)

  const [notas, setNotas] = useState(athlete.observacionesMedicas ?? '')
  const [guardandoNotas, setGuardandoNotas] = useState(false)
  const [dandoAlta, setDandoAlta] = useState(false)

  async function handleGuardarNotas() {
    setGuardandoNotas(true)
    try {
      await updateAthlete(athlete.id, {
        nombre: athlete.nombre,
        fechaNacimiento: athlete.fechaNacimiento,
        posiciones: athlete.posiciones,
        estadoSalud: athlete.estadoSalud,
        observacionesMedicas: notas.trim() || undefined,
      })
      showToast('success', 'Nota de evolución guardada.')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar la nota.'))
    } finally {
      setGuardandoNotas(false)
    }
  }

  async function handleDarDeAlta() {
    setDandoAlta(true)
    try {
      await updateAthlete(athlete.id, {
        nombre: athlete.nombre,
        fechaNacimiento: athlete.fechaNacimiento,
        posiciones: athlete.posiciones,
        estadoSalud: 'Activo',
        observacionesMedicas: notas.trim() || undefined,
      })
      showToast('success', `¡${athlete.nombre} recibió el alta médica!`)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo dar de alta al jugador.'))
    } finally {
      setDandoAlta(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar nombre={athlete.nombre} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {athlete.nombre}
            </p>
            <p className="truncate text-xs text-slate-400">{athlete.posiciones.join(', ')}</p>
          </div>
        </div>
        <Badge tone={ESTADO_TONE[athlete.estadoSalud]}>{athlete.estadoSalud}</Badge>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Notas de evolución</span>
        <textarea
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej. Evolución favorable, sin dolor en carga progresiva. Estimado 2 semanas más de RTP."
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGuardarNotas}
          disabled={guardandoNotas}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {guardandoNotas ? 'Guardando…' : 'Guardar nota'}
        </button>
        <button
          type="button"
          onClick={handleDarDeAlta}
          disabled={dandoAlta}
          className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {dandoAlta ? 'Dando de alta…' : '✓ Dar de Alta'}
        </button>
      </div>
    </Card>
  )
}

/** Dashboard Médico (Fase 11) — sólo jugadores en Rehabilitación o Baja Médica. */
export function MedicalView() {
  const athletes = useAthletesActivos()
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  if (!activeSeasonId || !activeCategoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para ver el Área Médica.
      </Card>
    )
  }

  const lesionados = athletes
    .filter((a) => a.estadoSalud !== 'Activo')
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">ÁREA MÉDICA</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Jugadores en Rehabilitación o Baja Médica — no aparecen como elegibles en Día de Partido hasta
          recibir el alta.
        </p>
      </div>

      {lesionados.length === 0 ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Ningún jugador de esta categoría está en Rehabilitación o Baja Médica ahora mismo. 🎉
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {lesionados.map((a) => (
            <FichaMedica key={a.id} athlete={a} />
          ))}
        </div>
      )}
    </div>
  )
}
