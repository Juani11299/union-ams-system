import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Badge, type BadgeTone } from '@/components/Badge'
import { Field, inputClass } from '@/components/FormField'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getErrorMessage } from '@/utils/errors'
import {
  TIPOS_PLANTILLA_FUERZA,
  type TipoPlantillaFuerza,
  type StrengthTemplate,
  type StrengthTemplateExercise,
} from '@/types'

/** MIME type custom usado para el drag & drop de plantillas sobre los días del microciclo (Fase 12). */
export const DRAG_MIME_PLANTILLA = 'application/x-strength-template'

const TIPO_TONE: Record<TipoPlantillaFuerza, BadgeTone> = {
  General: 'blue',
  Vitamina: 'green',
}

const TIPO_DESCRIPCION: Record<TipoPlantillaFuerza, string> = {
  General: 'Troncal del equipo (Fuerza Máxima, Potencia, Hipertrofia)',
  Vitamina: 'Preventivo/compensatorio para jugadores puntuales',
}

interface EjercicioMiniFormProps {
  templateId: string
  onClose: () => void
}

function EjercicioMiniForm({ templateId, onClose }: EjercicioMiniFormProps) {
  const addStrengthTemplateExercise = useAppStore((s) => s.addStrengthTemplateExercise)
  const showToast = useToastStore((s) => s.showToast)
  const [titulo, setTitulo] = useState('')
  const [seriesReps, setSeriesReps] = useState('')
  const [cargaPct, setCargaPct] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !seriesReps.trim()) {
      setError('Completá al menos el ejercicio y series x reps.')
      return
    }
    setError(null)
    setGuardando(true)
    try {
      await addStrengthTemplateExercise({
        templateId,
        titulo: titulo.trim(),
        seriesReps: seriesReps.trim(),
        cargaPct: cargaPct.trim() || undefined,
      })
      setTitulo('')
      setSeriesReps('')
      setCargaPct('')
    } catch (err) {
      const msg = getErrorMessage(err, 'No se pudo agregar el ejercicio.')
      setError(msg)
      showToast('error', msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-1.5 rounded-lg border border-dashed border-slate-300 p-2 dark:border-slate-600"
    >
      {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <input
        className={`${inputClass} text-xs`}
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ejercicio (ej. Sentadilla trasera)"
        autoFocus
      />
      <div className="flex gap-1.5">
        <input
          className={`${inputClass} text-xs`}
          value={seriesReps}
          onChange={(e) => setSeriesReps(e.target.value)}
          placeholder="Series x reps"
        />
        <input
          className={`${inputClass} text-xs`}
          value={cargaPct}
          onChange={(e) => setCargaPct(e.target.value)}
          placeholder="Carga (opc.)"
        />
      </div>
      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-md bg-union-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : '+ Agregar'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Listo
        </button>
      </div>
    </form>
  )
}

interface TemplateCardProps {
  template: StrengthTemplate
  ejercicios: StrengthTemplateExercise[]
}

function TemplateCard({ template, ejercicios }: TemplateCardProps) {
  const deleteStrengthTemplate = useAppStore((s) => s.deleteStrengthTemplate)
  const deleteStrengthTemplateExercise = useAppStore((s) => s.deleteStrengthTemplateExercise)
  const showToast = useToastStore((s) => s.showToast)
  const [expandido, setExpandido] = useState(false)
  const [agregandoEjercicio, setAgregandoEjercicio] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(DRAG_MIME_PLANTILLA, JSON.stringify({ templateId: template.id, tipo: template.tipo }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  async function handleEliminarPlantilla() {
    setEliminando(true)
    try {
      await deleteStrengthTemplate(template.id)
      showToast('success', 'Plantilla eliminada.')
      setConfirmandoEliminar(false)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar la plantilla.'))
    } finally {
      setEliminando(false)
    }
  }

  async function handleEliminarEjercicio(id: string) {
    try {
      await deleteStrengthTemplateExercise(id)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar el ejercicio.'))
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{template.nombre}</p>
          {template.descripcion && (
            <p className="truncate text-[11px] text-slate-400">{template.descripcion}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirmandoEliminar(true)}
          aria-label="Eliminar plantilla"
          className="shrink-0 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
        >
          ✕
        </button>
      </div>

      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="mt-1.5 text-[11px] font-medium text-union-red-600 hover:underline dark:text-union-red-400"
      >
        {expandido ? '▾' : '▸'} {ejercicios.length} ejercicio{ejercicios.length === 1 ? '' : 's'}
      </button>

      {expandido && (
        <div className="mt-2 flex flex-col gap-1.5">
          {ejercicios.map((ej) => (
            <div
              key={ej.id}
              className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1 text-[11px] dark:bg-slate-900/60"
            >
              <span className="truncate text-slate-600 dark:text-slate-300">
                {ej.titulo} · {ej.seriesReps}
                {ej.cargaPct ? ` · ${ej.cargaPct}` : ''}
              </span>
              <button
                type="button"
                onClick={() => handleEliminarEjercicio(ej.id)}
                aria-label="Eliminar ejercicio"
                className="shrink-0 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          ))}

          {agregandoEjercicio ? (
            <EjercicioMiniForm templateId={template.id} onClose={() => setAgregandoEjercicio(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAgregandoEjercicio(true)}
              className="rounded-md border border-dashed border-slate-200 py-1 text-[11px] font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
            >
              + Agregar ejercicio
            </button>
          )}
        </div>
      )}

      {confirmandoEliminar && (
        <ConfirmDialog
          titulo="Eliminar plantilla"
          mensaje={`¿Seguro que querés eliminar "${template.nombre}"? Esto borra sus ejercicios y las asignaciones ya hechas a días del microciclo.`}
          onConfirm={handleEliminarPlantilla}
          onCancel={() => setConfirmandoEliminar(false)}
          confirmando={eliminando}
        />
      )}
    </div>
  )
}

function NuevaPlantillaForm({ onClose }: { onClose: () => void }) {
  const createStrengthTemplate = useAppStore((s) => s.createStrengthTemplate)
  const club = useAppStore((s) => s.club)
  const showToast = useToastStore((s) => s.showToast)
  const [tipo, setTipo] = useState<TipoPlantillaFuerza>('General')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la plantilla es obligatorio.')
      return
    }
    if (!club) return
    setError(null)
    setGuardando(true)
    try {
      await createStrengthTemplate({
        clubId: club.id,
        tipo,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      })
      showToast('success', '¡Plantilla creada!')
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la plantilla.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-slate-300 p-2.5 dark:border-slate-600"
    >
      {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <Field label="Tipo" required>
        <select
          className={`${inputClass} text-xs`}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoPlantillaFuerza)}
        >
          {TIPOS_PLANTILLA_FUERZA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-400">{TIPO_DESCRIPCION[tipo]}</span>
      </Field>
      <Field label="Nombre" required>
        <input
          className={`${inputClass} text-xs`}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Fuerza Máxima - Tren Inferior"
          autoFocus
        />
      </Field>
      <Field label="Descripción (opcional)">
        <input
          className={`${inputClass} text-xs`}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej. Preventivo isquios"
        />
      </Field>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Crear plantilla'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function TemplateLibraryPanel() {
  const strengthTemplates = useAppStore((s) => s.strengthTemplates)
  const strengthTemplateExercises = useAppStore((s) => s.strengthTemplateExercises)
  const [creando, setCreando] = useState(false)

  return (
    <Card className="flex w-full flex-col gap-3 md:w-72">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">📚 Biblioteca de Plantillas</h2>
        <p className="text-[11px] text-slate-400">
          Arrastrá una plantilla sobre un día del microciclo para asignarla.
        </p>
      </div>

      {TIPOS_PLANTILLA_FUERZA.map((tipo) => {
        const deTipo = strengthTemplates.filter((t) => t.tipo === tipo)
        return (
          <div key={tipo} className="flex flex-col gap-1.5">
            <Badge tone={TIPO_TONE[tipo]} className="self-start">
              {tipo}
            </Badge>
            {deTipo.length === 0 && (
              <p className="text-[11px] text-slate-400">Todavía no hay plantillas de este tipo.</p>
            )}
            {deTipo.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                ejercicios={strengthTemplateExercises.filter((e) => e.templateId === t.id)}
              />
            ))}
          </div>
        )
      })}

      {creando ? (
        <NuevaPlantillaForm onClose={() => setCreando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="rounded-xl border-2 border-dashed border-slate-200 py-2 text-xs font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
        >
          + Nueva plantilla
        </button>
      )}
    </Card>
  )
}
