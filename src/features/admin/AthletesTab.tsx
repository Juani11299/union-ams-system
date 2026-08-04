import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Badge, type BadgeTone } from '@/components/Badge'
import { Avatar } from '@/components/Avatar'
import { Field, inputClass } from '@/components/FormField'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getErrorMessage } from '@/utils/errors'
import type { Athlete, EstadoSalud, Posicion } from '@/types'

const POSICIONES: Posicion[] = [
  'Arquero',
  'Defensor Central',
  'Lateral',
  'Volante Central',
  'Volante Ofensivo',
  'Extremo',
  'Delantero',
]

const ESTADOS: { value: EstadoSalud; label: string }[] = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Rehabilitación', label: 'Rehabilitación' },
  { value: 'Baja Médica', label: 'Baja Médica' },
]

const ESTADO_TONE: Record<EstadoSalud, BadgeTone> = {
  Activo: 'green',
  Rehabilitación: 'yellow',
  'Baja Médica': 'red',
}

const FORM_VACIO = {
  nombre: '',
  fechaNacimiento: '',
  posiciones: [] as Posicion[],
  estadoSalud: 'Activo' as EstadoSalud,
  observacionesMedicas: '',
}

export function AthletesTab() {
  const athletes = useAppStore((s) => s.athletes)
  const createAthlete = useAppStore((s) => s.createAthlete)
  const updateAthlete = useAppStore((s) => s.updateAthlete)
  const deleteAthlete = useAppStore((s) => s.deleteAthlete)
  const showToast = useToastStore((s) => s.showToast)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [aEliminar, setAEliminar] = useState<Athlete | null>(null)
  const [eliminando, setEliminando] = useState(false)

  function togglePosicion(pos: Posicion) {
    setForm((f) => ({
      ...f,
      posiciones: f.posiciones.includes(pos)
        ? f.posiciones.filter((p) => p !== pos)
        : [...f.posiciones, pos],
    }))
  }

  function cargarParaEditar(athlete: Athlete) {
    setEditandoId(athlete.id)
    setForm({
      nombre: athlete.nombre,
      fechaNacimiento: athlete.fechaNacimiento,
      posiciones: athlete.posiciones,
      estadoSalud: athlete.estadoSalud,
      observacionesMedicas: athlete.observacionesMedicas ?? '',
    })
    setErrores({})
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setForm(FORM_VACIO)
    setErrores({})
  }

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio.'
    if (!form.fechaNacimiento) {
      nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria.'
    } else {
      const anio = Number(form.fechaNacimiento.slice(0, 4))
      if (anio < 1980 || anio > new Date().getFullYear()) {
        nuevosErrores.fechaNacimiento = 'Ingresá una fecha de nacimiento válida.'
      }
    }
    if (form.posiciones.length === 0) nuevosErrores.posiciones = 'Elegí al menos una posición.'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setGuardando(true)
    const input = {
      nombre: form.nombre.trim(),
      fechaNacimiento: form.fechaNacimiento,
      posiciones: form.posiciones,
      estadoSalud: form.estadoSalud,
      observacionesMedicas: form.observacionesMedicas.trim() || undefined,
    }

    try {
      if (editandoId) {
        await updateAthlete(editandoId, input)
        showToast('success', '¡Jugador actualizado exitosamente!')
      } else {
        await createAthlete(input)
        showToast('success', '¡Jugador creado exitosamente!')
      }
      cancelarEdicion()
    } catch (err) {
      showToast(
        'error',
        getErrorMessage(err, editandoId ? 'No se pudo actualizar el jugador.' : 'No se pudo crear el jugador.'),
      )
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    try {
      await deleteAthlete(aEliminar.id)
      showToast('success', 'Jugador eliminado.')
      setAEliminar(null)
      if (editandoId === aEliminar.id) cancelarEdicion()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar el jugador.'))
    } finally {
      setEliminando(false)
    }
  }

  const filtrados = athletes
    .filter((a) => a.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <Card as="form" onSubmit={handleSubmit} className="flex h-fit flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {editandoId ? 'Editar jugador' : 'Nuevo jugador'}
        </h2>

        <Field label="Nombre completo" error={errores.nombre} required>
          <input
            className={inputClass}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej. Juan Pérez"
          />
        </Field>

        <Field label="Fecha de nacimiento" error={errores.fechaNacimiento} required>
          <input
            type="date"
            className={inputClass}
            value={form.fechaNacimiento}
            onChange={(e) => setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
          />
        </Field>

        <Field label="Posiciones" error={errores.posiciones} required>
          <div className="flex flex-wrap gap-1.5">
            {POSICIONES.map((pos) => {
              const activo = form.posiciones.includes(pos)
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosicion(pos)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    activo
                      ? 'border-union-red-500 bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
                      : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {pos}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Estado Médico" required>
          <select
            className={inputClass}
            value={form.estadoSalud}
            onChange={(e) => setForm((f) => ({ ...f, estadoSalud: e.target.value as EstadoSalud }))}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Observaciones médicas (opcional)">
          <textarea
            className={inputClass}
            rows={2}
            value={form.observacionesMedicas}
            onChange={(e) => setForm((f) => ({ ...f, observacionesMedicas: e.target.value }))}
          />
        </Field>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear jugador'}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={cancelarEdicion}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Plantel completo ({athletes.length})
          </h2>
          <input
            className={`${inputClass} max-w-[200px]`}
            placeholder="Buscar…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {filtrados.length === 0 ? (
          <p className="text-sm text-slate-400">No se encontraron jugadores.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtrados.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nombre={athlete.nombre} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {athlete.nombre}
                    </p>
                    <p className="truncate text-xs text-slate-400">{athlete.posiciones.join(', ')}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={ESTADO_TONE[athlete.estadoSalud]}>{athlete.estadoSalud}</Badge>
                  <button
                    type="button"
                    onClick={() => cargarParaEditar(athlete)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAEliminar(athlete)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {aEliminar && (
        <ConfirmDialog
          titulo="Eliminar jugador"
          mensaje={`¿Seguro que querés eliminar a ${aEliminar.nombre}? Esto también borra su historial de cargas y wellness.`}
          onConfirm={handleEliminar}
          onCancel={() => setAEliminar(null)}
          confirmando={eliminando}
        />
      )}
    </div>
  )
}
