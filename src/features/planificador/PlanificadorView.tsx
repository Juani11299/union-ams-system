import { useMemo, useState } from 'react'
import {
  useAppStore,
  useSessionPlansActivos,
  useSessionExecutionsActivas,
  useAthletesActivos,
  useStrengthAssignmentsActivas,
} from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Badge, type BadgeTone } from '@/components/Badge'
import { Field, inputClass } from '@/components/FormField'
import { InfoTooltip } from '@/components/InfoTooltip'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StrengthView } from '@/features/strength/StrengthView'
import { TacBoard } from '@/features/planificador/TacBoard'
import { GpsObjetivoForm } from '@/features/planificador/GpsObjetivoForm'
import { TemplateLibraryPanel, DRAG_MIME_PLANTILLA } from '@/features/planificador/TemplateLibraryPanel'
import { VitaminaAssignmentModal } from '@/features/planificador/VitaminaAssignmentModal'
import {
  compararConObjetivo,
  calcularCargaEjecutadaReal,
  calcularCargaInterna,
} from '@/features/workload/calculations'
import { diasDeLaSemanaActual, formatFechaCorta, fechaHoyLocal } from '@/utils/fecha'
import { getErrorMessage } from '@/utils/errors'
import type {
  SessionPlan,
  SessionExecution,
  DailyTask,
  TipoTarea,
  NivelCargaCognitiva,
  TipoSesion,
  MatchDayTag,
  TipoPlantillaFuerza,
} from '@/types'
import { TIPOS_TAREA, NIVELES_CARGA_COGNITIVA } from '@/types'

const TIPO_TONE: Record<TipoSesion, BadgeTone> = {
  Campo: 'green',
  Gimnasio: 'yellow',
  Recuperación: 'blue',
  Partido: 'red',
}

const TAREA_TONE: Record<TipoTarea, BadgeTone> = {
  'Físico de Campo': 'green',
  'Técnico-Táctico': 'orange',
  Gimnasio: 'blue',
}

const TIPO_OPCIONES: TipoSesion[] = ['Campo', 'Gimnasio', 'Partido', 'Recuperación']
const MD_OPCIONES: MatchDayTag[] = ['MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1']

/**
 * "Doble Turno" (Fase 13) — colores del selector de tipo al agregar una 2da+
 * sesión a un día ya con sesiones: verde/pasto para Campo, gris/fierros para
 * Gimnasio, pedido explícito del usuario (distinto del `TIPO_TONE` genérico
 * de arriba, que sigue usándose para los badges de resumen).
 */
const SESION_TIPO_ESTILO: Record<'Campo' | 'Gimnasio', string> = {
  Campo:
    'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Gimnasio: 'border-slate-500 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

// ---------------------------------------------------------------------------
// Resumen del día (tarjeta clickeable — Fase 10: ya no se edita acá mismo,
// abre la vista expandida del día).
// ---------------------------------------------------------------------------

interface ResumenDiaCardProps {
  sesiones: SessionPlan[]
  ejecucionesDelDia: SessionExecution[]
  sessionPlans: SessionPlan[]
  tareasDelDia: DailyTask[]
  onClick: () => void
  onDropTemplate: (templateId: string, tipo: TipoPlantillaFuerza) => void
}

/** Fase 13 — "Doble Turno": un día puede tener varias sesiones (`sesiones` nunca viene vacío acá; si el día no tiene ninguna, se usa `DiaVacio`). */
function ResumenDiaCard({
  sesiones,
  ejecucionesDelDia,
  sessionPlans,
  tareasDelDia,
  onClick,
  onDropTemplate,
}: ResumenDiaCardProps) {
  const [sobrevolada, setSobrevolada] = useState(false)
  const primeraSesion = sesiones[0]
  const cargaObjetivoTotal = sesiones.reduce((sum, s) => sum + s.cargaObjetivo, 0)
  const duracionEstimadaTotal = sesiones.reduce((sum, s) => sum + s.duracionEstimadaMin, 0)
  const tituloCombinado = sesiones.map((s) => s.titulo).join(' + ')
  const hayPartido = sesiones.some((s) => s.tipo === 'Partido')

  // calcularCargaEjecutadaReal ya suma internamente todas las sesiones del día
  // (Fase 13) — no hace falta iterar `sesiones` acá, sólo pasar las ejecuciones.
  const cargasDelDia = ejecucionesDelDia.map((e) => calcularCargaEjecutadaReal(e, sessionPlans))
  const valoresCalculables = cargasDelDia.filter((c): c is number => c !== null)
  const faltaTiempo = ejecucionesDelDia.length > 0 && valoresCalculables.length === 0
  const ejecutadoPromedio =
    valoresCalculables.length > 0
      ? Math.round(valoresCalculables.reduce((sum, c) => sum + c, 0) / valoresCalculables.length)
      : null

  const comparacion = compararConObjetivo(ejecutadoPromedio, cargaObjetivoTotal)
  const porcentajeBarra =
    comparacion.ejecutado !== null && cargaObjetivoTotal > 0
      ? Math.min((comparacion.ejecutado / cargaObjetivoTotal) * 100, 130)
      : 0

  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_MIME_PLANTILLA)) return
        e.preventDefault()
        setSobrevolada(true)
      }}
      onDragLeave={() => setSobrevolada(false)}
      onDrop={(e) => {
        setSobrevolada(false)
        const raw = e.dataTransfer.getData(DRAG_MIME_PLANTILLA)
        if (!raw) return
        e.preventDefault()
        const { templateId, tipo } = JSON.parse(raw) as { templateId: string; tipo: TipoPlantillaFuerza }
        onDropTemplate(templateId, tipo)
      }}
      className="h-full w-full text-left"
    >
      <Card
        className={`flex h-full flex-col gap-3 transition-shadow hover:shadow-md ${
          hayPartido ? 'border-rose-300 dark:border-rose-500/40' : ''
        } ${sobrevolada ? 'ring-2 ring-union-red-400/60' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            {primeraSesion.matchDay}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            {sesiones.map((s) => (
              <Badge key={s.id} tone={TIPO_TONE[s.tipo]}>
                {s.tipo}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs capitalize text-slate-400">{formatFechaCorta(primeraSesion.fecha)}</p>
          <h2 className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {tituloCombinado}
          </h2>
        </div>

        {tareasDelDia.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tareasDelDia.map((t) => (
              <Badge key={t.id} tone={TAREA_TONE[t.tipo]} className="text-[10px]">
                {t.enfoque}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Objetivo</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {cargaObjetivoTotal} AU
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="absolute inset-y-0 left-0 w-full border-r-2 border-dashed border-slate-400/60" />
            <div
              className={`h-full rounded-full transition-all ${
                comparacion.tone === 'red'
                  ? 'bg-rose-500'
                  : comparacion.tone === 'yellow'
                    ? 'bg-amber-500'
                    : comparacion.tone === 'green'
                      ? 'bg-emerald-500'
                      : 'bg-slate-300 dark:bg-slate-600'
              }`}
              style={{ width: `${porcentajeBarra}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {comparacion.ejecutado !== null
                ? `Ejecutado: ${comparacion.ejecutado} AU`
                : faltaTiempo
                  ? `${ejecucionesDelDia.length} RPE sin tiempo`
                  : `${duracionEstimadaTotal} min est.`}
            </span>
            {faltaTiempo ? (
              <Badge tone="yellow">⏳ Falta tiempo</Badge>
            ) : (
              <Badge tone={comparacion.tone}>{comparacion.label}</Badge>
            )}
          </div>
        </div>
      </Card>
    </button>
  )
}

function DiaVacio({
  fecha,
  onClick,
  onDropTemplate,
}: {
  fecha: string
  onClick: () => void
  onDropTemplate: (templateId: string, tipo: TipoPlantillaFuerza) => void
}) {
  const [sobrevolada, setSobrevolada] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_MIME_PLANTILLA)) return
        e.preventDefault()
        setSobrevolada(true)
      }}
      onDragLeave={() => setSobrevolada(false)}
      onDrop={(e) => {
        setSobrevolada(false)
        const raw = e.dataTransfer.getData(DRAG_MIME_PLANTILLA)
        if (!raw) return
        e.preventDefault()
        const { templateId, tipo } = JSON.parse(raw) as { templateId: string; tipo: TipoPlantillaFuerza }
        onDropTemplate(templateId, tipo)
      }}
      className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-slate-400 transition-colors hover:border-union-red-400 hover:text-union-red-600 dark:hover:border-union-red-500 dark:hover:text-union-red-400 ${
        sobrevolada ? 'border-union-red-400 text-union-red-600' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <p className="text-xs capitalize">{formatFechaCorta(fecha)}</p>
      <span className="text-2xl">+</span>
      <span className="text-xs font-medium">Agregar sesión</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Configuración de Sesión Diaria (Fase 9.2 — ahora vive dentro de la vista
// expandida del día en vez de un desplegable en la tarjeta resumen).
// ---------------------------------------------------------------------------

function ConfiguracionSesionDiaria({ plan }: { plan: SessionPlan }) {
  const updateSessionPlanConfig = useAppStore((s) => s.updateSessionPlanConfig)
  const showToast = useToastStore((s) => s.showToast)
  const [rpeEsperado, setRpeEsperado] = useState(plan.rpeEsperado ?? 5)
  const [duracionRealMin, setDuracionRealMin] = useState(plan.duracionRealMin ?? plan.duracionEstimadaMin)
  const [guardando, setGuardando] = useState(false)

  // "Carga Interna Proyectada" — Fase 14: rpeEsperado × duracionEstimadaMin,
  // la misma fórmula que fija `cargaObjetivo` al crear la sesión. Se
  // recalcula acá en vivo mientras el profe ajusta el RPE Esperado, y se
  // vuelve a guardar en `cargaObjetivo` al confirmar para que nunca quede
  // desincronizado del "Objetivo (UA)" mostrado en el resto de la app.
  const cargaProyectada = calcularCargaInterna(rpeEsperado, plan.duracionEstimadaMin)

  async function handleGuardar() {
    setGuardando(true)
    try {
      await updateSessionPlanConfig(plan.id, {
        rpeEsperado,
        duracionRealMin,
        cargaObjetivo: cargaProyectada,
      })
      showToast('success', '¡Configuración de la sesión guardada!')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar la configuración.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
        ⚙️ Configuración de Sesión Diaria
        <InfoTooltip
          titulo="RPE Esperado vs. Tiempo Total de Trabajo"
          descripcion="RPE Esperado: se carga antes de la sesión, sirve para comparar Carga Esperada vs. Carga Real. Tiempo Total de Trabajo: se carga al finalizar la sesión y es lo que se cruza con el RPE de cada jugador para calcular el sRPE real."
        />
      </span>
      <div className="grid grid-cols-2 gap-2">
        <Field label="RPE Esperado (1-10)">
          <input
            type="number"
            min={1}
            max={10}
            className={inputClass}
            value={rpeEsperado}
            onChange={(e) => setRpeEsperado(Number(e.target.value))}
          />
        </Field>
        <Field label="Tiempo Total de Trabajo (min)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={duracionRealMin}
            onChange={(e) => setDuracionRealMin(Number(e.target.value))}
          />
        </Field>
      </div>
      <Badge tone="blue" className="self-start">
        Carga Interna Proyectada (UA): {cargaProyectada}
      </Badge>
      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando}
        className="self-start rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {guardando ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detalle de tarea (el "puente" al nivel específico — Fase 10).
// ---------------------------------------------------------------------------

function DetalleTareaModal({ tarea, onClose }: { tarea: DailyTask; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Detalle: {tarea.tipo} — {tarea.objetivo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {tarea.tipo === 'Gimnasio' && <StrengthView />}
        {tarea.tipo === 'Técnico-Táctico' && <TacBoard tarea={tarea} />}
        {tarea.tipo === 'Físico de Campo' && <GpsObjetivoForm tarea={tarea} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tareas del Día (nivel general — Fase 10).
// ---------------------------------------------------------------------------

interface TareaCardProps {
  tarea: DailyTask
  onEliminar: () => void
  onEditar: () => void
  onAbrirDetalle: () => void
}

function TareaCard({ tarea, onEliminar, onEditar, onAbrirDetalle }: TareaCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
            {tarea.enfoque}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{tarea.objetivo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEditar}
            aria-label="Editar tarea"
            className="text-slate-300 hover:text-union-red-500 dark:text-slate-600 dark:hover:text-union-red-400"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={onEliminar}
            aria-label="Eliminar tarea"
            className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {tarea.duracionMin} min
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          RPE esp. {tarea.rpeEsperado}
        </span>
        {tarea.densidad && (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
            Densidad {tarea.densidad}
          </span>
        )}
        {tarea.cargaCognitiva && (
          <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
            Carga cognitiva: {tarea.cargaCognitiva}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onAbrirDetalle}
        className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Planificar Detalle de Tarea →
      </button>
    </div>
  )
}

interface NuevaTareaFormProps {
  sessionPlanId: string
  tareaExistente?: DailyTask
  onClose: () => void
}

function NuevaTareaForm({ sessionPlanId, tareaExistente, onClose }: NuevaTareaFormProps) {
  const createDailyTask = useAppStore((s) => s.createDailyTask)
  const updateDailyTask = useAppStore((s) => s.updateDailyTask)
  const showToast = useToastStore((s) => s.showToast)

  const [tipo, setTipo] = useState<TipoTarea>(tareaExistente?.tipo ?? 'Físico de Campo')
  const [enfoque, setEnfoque] = useState(tareaExistente?.enfoque ?? '')
  const [objetivo, setObjetivo] = useState(tareaExistente?.objetivo ?? '')
  const [duracionMin, setDuracionMin] = useState(tareaExistente?.duracionMin ?? 30)
  const [rpeEsperado, setRpeEsperado] = useState(tareaExistente?.rpeEsperado ?? 5)
  const [densidad, setDensidad] = useState(tareaExistente?.densidad ?? '')
  const [cargaCognitiva, setCargaCognitiva] = useState<NivelCargaCognitiva | ''>(
    tareaExistente?.cargaCognitiva ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!enfoque.trim()) {
      setError('El enfoque específico es obligatorio.')
      return
    }
    if (!objetivo.trim()) {
      setError('El objetivo es obligatorio.')
      return
    }
    if (!Number.isFinite(duracionMin) || duracionMin <= 0) {
      setError('Ingresá una duración válida.')
      return
    }
    setError(null)
    setGuardando(true)
    try {
      if (tareaExistente) {
        await updateDailyTask(tareaExistente.id, {
          tipo,
          enfoque: enfoque.trim(),
          objetivo: objetivo.trim(),
          duracionMin,
          rpeEsperado,
          densidad: densidad.trim() || undefined,
          cargaCognitiva: cargaCognitiva || undefined,
        })
        showToast('success', '¡Tarea actualizada!')
      } else {
        await createDailyTask({
          sessionPlanId,
          tipo,
          enfoque: enfoque.trim(),
          objetivo: objetivo.trim(),
          duracionMin,
          rpeEsperado,
          densidad: densidad.trim() || undefined,
          cargaCognitiva: cargaCognitiva || undefined,
        })
        showToast('success', '¡Tarea agregada!')
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la tarea.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-slate-300 p-3 dark:border-slate-600"
    >
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <Field label="Tipo de tarea" required>
        <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarea)}>
          {TIPOS_TAREA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Enfoque Específico de la Sesión" required>
        <input
          className={inputClass}
          value={enfoque}
          onChange={(e) => setEnfoque(e.target.value)}
          placeholder="Ej. Ataque, Aceleraciones y COD, Fuerza Máxima - Empujes"
        />
      </Field>
      <Field label="Objetivo / tipo de ejercitaciones" required>
        <input
          className={inputClass}
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          placeholder="Ej. Rondos 4v2, posesión en espacio reducido"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Duración total (min)" required>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={duracionMin}
            onChange={(e) => setDuracionMin(Number(e.target.value))}
          />
        </Field>
        <Field label="RPE Esperado (1-10)" required>
          <input
            type="number"
            min={1}
            max={10}
            className={inputClass}
            value={rpeEsperado}
            onChange={(e) => setRpeEsperado(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label={
            <span className="flex items-center gap-1">
              Densidad
              <InfoTooltip
                titulo="Densidad de trabajo"
                descripcion="Relación trabajo:pausa de la tarea (ej. 1:2, 1:3, Continuo). Junto con la duración y el RPE esperado, ayuda a explicar la carga interna real más allá de un único número — la misma duración con distinta densidad genera demandas fisiológicas muy distintas."
              />
            </span>
          }
        >
          <input
            className={inputClass}
            value={densidad}
            onChange={(e) => setDensidad(e.target.value)}
            placeholder="Ej. 1:2"
          />
        </Field>
        <Field
          label={
            <span className="flex items-center gap-1">
              Carga cognitiva
              <InfoTooltip
                titulo="Carga cognitiva / complejidad decisional"
                descripcion="Nivel de exigencia decisional-táctica de la tarea (más allá del esfuerzo físico). Dos tareas con el mismo RPE esperado pueden imponer una demanda cognitiva muy distinta — relevante en deportes de conjunto donde la toma de decisiones bajo presión es parte central de la carga de entrenamiento."
              />
            </span>
          }
        >
          <select
            className={inputClass}
            value={cargaCognitiva}
            onChange={(e) => setCargaCognitiva(e.target.value as NivelCargaCognitiva | '')}
          >
            <option value="">Sin especificar</option>
            {NIVELES_CARGA_COGNITIVA.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-lg bg-union-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : tareaExistente ? 'Guardar cambios' : 'Agregar tarea'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function TareasDelDia({ plan }: { plan: SessionPlan }) {
  const dailyTasks = useAppStore((s) => s.dailyTasks)
  const deleteDailyTask = useAppStore((s) => s.deleteDailyTask)
  const showToast = useToastStore((s) => s.showToast)
  const [agregando, setAgregando] = useState(false)
  const [tareaEnEdicion, setTareaEnEdicion] = useState<DailyTask | null>(null)
  const [tareaDetalle, setTareaDetalle] = useState<DailyTask | null>(null)

  const tareasDelDia = dailyTasks.filter((t) => t.session_plan_id === plan.id)

  async function handleEliminar(id: string) {
    try {
      await deleteDailyTask(id)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar la tarea.'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tareas del Día</h3>

      {tareasDelDia.length === 0 && (
        <p className="text-xs text-slate-400">Todavía no hay tareas cargadas para este día.</p>
      )}

      {TIPOS_TAREA.map((tipo) => {
        const tareas = tareasDelDia.filter((t) => t.tipo === tipo)
        if (tareas.length === 0) return null
        return (
          <div key={tipo} className="flex flex-col gap-2">
            <Badge tone={TAREA_TONE[tipo]} className="self-start">
              {tipo}
            </Badge>
            {tareas.map((t) =>
              tareaEnEdicion?.id === t.id ? (
                <NuevaTareaForm
                  key={t.id}
                  sessionPlanId={plan.id}
                  tareaExistente={t}
                  onClose={() => setTareaEnEdicion(null)}
                />
              ) : (
                <TareaCard
                  key={t.id}
                  tarea={t}
                  onEliminar={() => handleEliminar(t.id)}
                  onEditar={() => setTareaEnEdicion(t)}
                  onAbrirDetalle={() => setTareaDetalle(t)}
                />
              ),
            )}
          </div>
        )
      })}

      {agregando ? (
        <NuevaTareaForm sessionPlanId={plan.id} onClose={() => setAgregando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className="rounded-xl border-2 border-dashed border-slate-200 py-2 text-xs font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
        >
          + Agregar tarea
        </button>
      )}

      {tareaDetalle && <DetalleTareaModal tarea={tareaDetalle} onClose={() => setTareaDetalle(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Planes de Fuerza asignados al día (Fase 12 — plantillas arrastradas desde
// la Biblioteca de Plantillas).
// ---------------------------------------------------------------------------

const TIPO_PLANTILLA_TONE: Record<TipoPlantillaFuerza, BadgeTone> = {
  General: 'blue',
  Vitamina: 'green',
}

function PlanesDeFuerzaAsignados({ plan }: { plan: SessionPlan }) {
  const strengthAssignments = useAppStore((s) => s.strengthAssignments)
  const strengthTemplates = useAppStore((s) => s.strengthTemplates)
  const strengthAssignmentAthletes = useAppStore((s) => s.strengthAssignmentAthletes)
  const deleteStrengthAssignment = useAppStore((s) => s.deleteStrengthAssignment)
  const athletes = useAthletesActivos()
  const showToast = useToastStore((s) => s.showToast)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const asignacionesDelDia = strengthAssignments.filter((a) => a.sessionPlanId === plan.id)

  async function handleEliminar(id: string) {
    setEliminandoId(id)
    try {
      await deleteStrengthAssignment(id)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo quitar la asignación.'))
    } finally {
      setEliminandoId(null)
    }
  }

  if (asignacionesDelDia.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        🏋️ Fuerza Asignada
      </h3>
      {asignacionesDelDia.map((asignacion) => {
        const template = strengthTemplates.find((t) => t.id === asignacion.templateId)
        const idsAtletas = new Set(
          strengthAssignmentAthletes
            .filter((aa) => aa.assignmentId === asignacion.id)
            .map((aa) => aa.athleteId),
        )
        const nombresAtletas = athletes.filter((a) => idsAtletas.has(a.id)).map((a) => a.nombre)
        const esTodoElPlantel = asignacion.tipo === 'General' && nombresAtletas.length === athletes.length

        return (
          <div
            key={asignacion.id}
            className="flex flex-col gap-1.5 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={TIPO_PLANTILLA_TONE[asignacion.tipo]}>{asignacion.tipo}</Badge>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {template?.nombre ?? 'Plantilla eliminada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleEliminar(asignacion.id)}
                disabled={eliminandoId === asignacion.id}
                aria-label="Quitar asignación"
                className="shrink-0 text-slate-300 hover:text-rose-500 disabled:opacity-50 dark:text-slate-600 dark:hover:text-rose-400"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {esTodoElPlantel ? 'Todo el plantel' : nombresAtletas.join(', ') || '—'}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Crear sesión (día vacío) — igual que antes, ahora vive dentro del modal.
// ---------------------------------------------------------------------------

interface NuevoPlanFormProps {
  fecha: string
  seasonId: string
  categoryId: string
  onCreated: () => void
}

function NuevoPlanForm({ fecha, seasonId, categoryId, onCreated }: NuevoPlanFormProps) {
  const createSessionPlan = useAppStore((s) => s.createSessionPlan)
  const showToast = useToastStore((s) => s.showToast)

  const [titulo, setTitulo] = useState('')
  const [matchDay, setMatchDay] = useState<MatchDayTag>('MD-2')
  const [tipo, setTipo] = useState<TipoSesion>('Campo')
  const [duracionEstimadaMin, setDuracionEstimadaMin] = useState(60)
  const [rpeEsperado, setRpeEsperado] = useState(5)
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  // Fase 14 — "Objetivo (UA)" ya no se tipea a mano: se proyecta en vivo como
  // RPE Objetivo × Tiempo Estimado (misma fórmula sRPE de toda la app).
  const cargaProyectada = calcularCargaInterna(rpeEsperado, duracionEstimadaMin)

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {}
    if (!titulo.trim()) nuevosErrores.titulo = 'El título es obligatorio.'
    if (!Number.isFinite(duracionEstimadaMin) || duracionEstimadaMin <= 0) {
      nuevosErrores.duracionEstimadaMin = 'Ingresá una duración válida.'
    }
    if (!Number.isFinite(rpeEsperado) || rpeEsperado < 1 || rpeEsperado > 10) {
      nuevosErrores.rpeEsperado = 'El RPE Objetivo va de 1 a 10.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setGuardando(true)
    try {
      await createSessionPlan({
        seasonId,
        categoryId,
        titulo: titulo.trim(),
        fecha,
        matchDay,
        tipo,
        duracionEstimadaMin,
        rpeEsperado,
        descripcion: descripcion.trim() || undefined,
      })
      showToast('success', '¡Sesión creada exitosamente!')
      onCreated()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo crear la sesión.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <Field label="Título" error={errores.titulo} required>
        <input
          className={inputClass}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Aeróbico + técnica"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Microciclo" required>
          <select
            className={inputClass}
            value={matchDay}
            onChange={(e) => setMatchDay(e.target.value as MatchDayTag)}
          >
            {MD_OPCIONES.map((md) => (
              <option key={md} value={md}>
                {md}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo" required>
          <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as TipoSesion)}>
            {TIPO_OPCIONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Tiempo Estimado (min)" error={errores.duracionEstimadaMin} required>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={duracionEstimadaMin}
            onChange={(e) => setDuracionEstimadaMin(Number(e.target.value))}
          />
        </Field>
        <Field label="RPE Objetivo (1-10)" error={errores.rpeEsperado} required>
          <input
            type="number"
            min={1}
            max={10}
            className={inputClass}
            value={rpeEsperado}
            onChange={(e) => setRpeEsperado(Number(e.target.value))}
          />
        </Field>
      </div>

      <Badge tone="blue" className="self-start">
        Carga Interna Proyectada (UA): {cargaProyectada}
      </Badge>

      <Field label="Descripción (opcional)">
        <textarea
          className={inputClass}
          rows={2}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </Field>

      <button
        type="submit"
        disabled={guardando}
        className="mt-1 rounded-lg bg-union-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {guardando ? 'Guardando…' : 'Crear sesión'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// "+ Nueva Sesión" (Fase 13 — Doble Turno) — agrega una 2da+ sesión a un día
// que ya tiene al menos una. Más simple que `NuevoPlanForm`: el `matchDay` se
// hereda del día (todas las sesiones de una misma fecha comparten la misma
// posición de microciclo), y el tipo queda restringido a Campo/Gimnasio —
// el "doble turno" es específicamente esa combinación.
// ---------------------------------------------------------------------------

interface NuevaSesionFormProps {
  fecha: string
  seasonId: string
  categoryId: string
  matchDay: MatchDayTag
  onClose: () => void
}

function NuevaSesionForm({ fecha, seasonId, categoryId, matchDay, onClose }: NuevaSesionFormProps) {
  const createSessionPlan = useAppStore((s) => s.createSessionPlan)
  const showToast = useToastStore((s) => s.showToast)

  const [tipo, setTipo] = useState<'Campo' | 'Gimnasio'>('Campo')
  const [titulo, setTitulo] = useState('')
  const [duracionEstimadaMin, setDuracionEstimadaMin] = useState(60)
  const [rpeEsperado, setRpeEsperado] = useState(5)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  // Fase 14 — mismo criterio que `NuevoPlanForm`: "Objetivo (UA)" se proyecta,
  // no se tipea.
  const cargaProyectada = calcularCargaInterna(rpeEsperado, duracionEstimadaMin)

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {}
    if (!titulo.trim()) nuevosErrores.titulo = 'El título es obligatorio.'
    if (!Number.isFinite(duracionEstimadaMin) || duracionEstimadaMin <= 0) {
      nuevosErrores.duracionEstimadaMin = 'Ingresá una duración válida.'
    }
    if (!Number.isFinite(rpeEsperado) || rpeEsperado < 1 || rpeEsperado > 10) {
      nuevosErrores.rpeEsperado = 'El RPE Objetivo va de 1 a 10.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setGuardando(true)
    try {
      await createSessionPlan({
        seasonId,
        categoryId,
        titulo: titulo.trim(),
        fecha,
        matchDay,
        tipo,
        duracionEstimadaMin,
        rpeEsperado,
      })
      showToast('success', '¡Sesión agregada!')
      onClose()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo crear la sesión.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 rounded-xl border-2 border-dashed border-slate-300 p-3 dark:border-slate-600"
    >
      <Field label="Tipo" required>
        <div className="flex gap-2">
          {(['Campo', 'Gimnasio'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tipo === t ? SESION_TIPO_ESTILO[t] : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              {t === 'Campo' ? '🌱 Sesión de Campo' : '🏋️ Sesión de Gimnasio'}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Título" error={errores.titulo} required>
        <input
          className={inputClass}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={tipo === 'Campo' ? 'Ej. Técnico-táctico tarde' : 'Ej. Fuerza tren superior'}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Tiempo Estimado (min)" error={errores.duracionEstimadaMin} required>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={duracionEstimadaMin}
            onChange={(e) => setDuracionEstimadaMin(Number(e.target.value))}
          />
        </Field>
        <Field label="RPE Objetivo (1-10)" error={errores.rpeEsperado} required>
          <input
            type="number"
            min={1}
            max={10}
            className={inputClass}
            value={rpeEsperado}
            onChange={(e) => setRpeEsperado(Number(e.target.value))}
          />
        </Field>
      </div>

      <Badge tone="blue" className="self-start">
        Carga Interna Proyectada (UA): {cargaProyectada}
      </Badge>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-lg bg-union-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Agregar sesión'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Bloque colapsable de una sesión dentro del día (Fase 13 — Doble Turno).
// ---------------------------------------------------------------------------

function SesionDelDiaBlock({ plan, onEliminada }: { plan: SessionPlan; onEliminada: () => void }) {
  const deleteSessionPlan = useAppStore((s) => s.deleteSessionPlan)
  const showToast = useToastStore((s) => s.showToast)
  const [expandido, setExpandido] = useState(true)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  async function handleEliminar() {
    setEliminando(true)
    try {
      await deleteSessionPlan(plan.id)
      showToast('success', 'Sesión eliminada.')
      onEliminada()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar la sesión.'))
    } finally {
      setEliminando(false)
      setConfirmandoEliminar(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="text-xs text-slate-400">{expandido ? '▾' : '▸'}</span>
          <Badge tone={TIPO_TONE[plan.tipo]}>{plan.tipo}</Badge>
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {plan.titulo}
          </span>
          <span className="shrink-0 text-xs text-slate-400">{plan.cargaObjetivo} AU</span>
        </button>
        <button
          type="button"
          onClick={() => setConfirmandoEliminar(true)}
          aria-label="Eliminar sesión"
          className="shrink-0 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
        >
          ✕
        </button>
      </div>

      {expandido && (
        <div className="flex flex-col gap-4">
          {plan.descripcion && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{plan.descripcion}</p>
          )}
          <ConfiguracionSesionDiaria plan={plan} />
          <PlanesDeFuerzaAsignados plan={plan} />
          <TareasDelDia plan={plan} />
        </div>
      )}

      {confirmandoEliminar && (
        <ConfirmDialog
          titulo="Eliminar sesión"
          mensaje={`¿Seguro que querés eliminar "${plan.titulo}"? Esto borra sus tareas, objetivos GPS/táctica y plantillas de fuerza asignadas.`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmandoEliminar(false)}
          confirmando={eliminando}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista expandida del día (Fase 10 — Paso 2/3/4; Fase 13 — Doble Turno: ahora
// muestra una lista de sesiones en vez de una sola).
// ---------------------------------------------------------------------------

interface DiaDetalleModalProps {
  fecha: string
  sesiones: SessionPlan[]
  seasonId: string
  categoryId: string
  onClose: () => void
}

function DiaDetalleModal({ fecha, sesiones, seasonId, categoryId, onClose }: DiaDetalleModalProps) {
  const [agregandoSesion, setAgregandoSesion] = useState(false)
  const tituloModal =
    sesiones.length === 0 ? 'Nueva sesión' : sesiones.map((s) => s.titulo).join(' + ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs capitalize text-slate-400">{formatFechaCorta(fecha)}</p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tituloModal}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {sesiones.length === 0 ? (
          <NuevoPlanForm fecha={fecha} seasonId={seasonId} categoryId={categoryId} onCreated={() => {}} />
        ) : (
          <div className="flex flex-col gap-3">
            {sesiones.map((plan) => (
              <SesionDelDiaBlock key={plan.id} plan={plan} onEliminada={() => {}} />
            ))}

            {agregandoSesion ? (
              <NuevaSesionForm
                fecha={fecha}
                seasonId={seasonId}
                categoryId={categoryId}
                matchDay={sesiones[0].matchDay}
                onClose={() => setAgregandoSesion(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAgregandoSesion(true)}
                className="rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
              >
                + Nueva Sesión
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PLANIFICADOR — vista principal (la semana).
// ---------------------------------------------------------------------------

export function PlanificadorView() {
  const sessionPlans = useSessionPlansActivos()
  const sessionExecutions = useSessionExecutionsActivas()
  const dailyTasks = useAppStore((s) => s.dailyTasks)
  const strengthTemplates = useAppStore((s) => s.strengthTemplates)
  const assignTemplateToDay = useAppStore((s) => s.assignTemplateToDay)
  const createSessionPlan = useAppStore((s) => s.createSessionPlan)
  const athletes = useAthletesActivos()
  useStrengthAssignmentsActivas() // suscribe a la vista para que se re-renderice al asignar/quitar plantillas
  const showToast = useToastStore((s) => s.showToast)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  const [semanaOffset, setSemanaOffset] = useState(0)
  const referenciaSemana = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + semanaOffset * 7)
    return d
  }, [semanaOffset])
  const dias = useMemo(() => diasDeLaSemanaActual(referenciaSemana), [referenciaSemana])
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [bibliotecaAbierta, setBibliotecaAbierta] = useState(false)
  const [vitaminaPendiente, setVitaminaPendiente] = useState<{
    templateId: string
    templateNombre: string
    sessionPlanId: string
  } | null>(null)
  const hoy = fechaHoyLocal()

  const sesionesDelDiaSeleccionado = diaSeleccionado
    ? sessionPlans.filter((p) => p.fecha === diaSeleccionado)
    : []

  /**
   * Fase 13 — el drop de una plantilla de Fuerza apunta a un DÍA (`fecha`),
   * no directo a una sesión: si el día ya tiene una Sesión de Gimnasio, se
   * asigna ahí; si no tiene ninguna (ni siquiera otras sesiones ese día), se
   * autogenera una antes de asignar. `matchDay` se hereda de otra sesión de
   * ese día si existe, o 'MD-2' como default razonable para un día vacío.
   */
  async function handleDropTemplate(templateId: string, tipo: TipoPlantillaFuerza, fecha: string) {
    if (!activeSeasonId || !activeCategoryId) return

    const sesionesDelDia = sessionPlans.filter((p) => p.fecha === fecha)
    let sesionGimnasio = sesionesDelDia.find((p) => p.tipo === 'Gimnasio')

    try {
      if (!sesionGimnasio) {
        sesionGimnasio = await createSessionPlan({
          seasonId: activeSeasonId,
          categoryId: activeCategoryId,
          titulo: 'Gimnasio',
          fecha,
          matchDay: sesionesDelDia[0]?.matchDay ?? 'MD-2',
          tipo: 'Gimnasio',
          duracionEstimadaMin: 60,
          rpeEsperado: 5,
        })
        showToast('success', 'Se creó una Sesión de Gimnasio para este día.')
      }

      if (tipo === 'General') {
        if (athletes.length === 0) {
          showToast('error', 'No hay jugadores en el plantel activo para asignar.')
          return
        }
        await assignTemplateToDay({
          templateId,
          sessionPlanId: sesionGimnasio.id,
          tipo: 'General',
          athleteIds: athletes.map((a) => a.id),
        })
        showToast('success', '¡Plantilla asignada a todo el plantel!')
        return
      }

      const template = strengthTemplates.find((t) => t.id === templateId)
      setVitaminaPendiente({
        templateId,
        templateNombre: template?.nombre ?? 'Vitamina',
        sessionPlanId: sesionGimnasio.id,
      })
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo asignar la plantilla.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">PLANIFICADOR</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Microciclo semanal: tocá un día para ver y planificar sus tareas en detalle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBibliotecaAbierta((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            bibliotecaAbierta
              ? 'border-union-red-500 bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
              : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          📚 Biblioteca de Plantillas {bibliotecaAbierta ? '▴' : '▾'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSemanaOffset((s) => s - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ‹ Semana anterior
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="capitalize">
            {formatFechaCorta(dias[0])} — {formatFechaCorta(dias[6])}
          </span>
          {semanaOffset !== 0 && (
            <button
              type="button"
              onClick={() => setSemanaOffset(0)}
              className="rounded-md bg-union-red-50 px-2 py-0.5 text-xs font-medium text-union-red-700 hover:bg-union-red-100 dark:bg-union-red-500/10 dark:text-union-red-400"
            >
              Volver a hoy
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSemanaOffset((s) => s + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Semana siguiente ›
        </button>
      </div>

      {(!activeSeasonId || !activeCategoryId) && (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Elegí una temporada y una categoría arriba para planificar sesiones.
        </Card>
      )}

      {activeSeasonId && activeCategoryId && (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {bibliotecaAbierta && <TemplateLibraryPanel />}

          <div className="-mx-4 flex-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="grid w-max grid-flow-col auto-cols-[220px] gap-3 lg:w-full lg:auto-cols-fr">
              {dias.map((fecha) => {
                const sesiones = sessionPlans.filter((p) => p.fecha === fecha)

                if (sesiones.length > 0) {
                  const ejecucionesDelDia = sessionExecutions.filter((e) => e.fecha === fecha)
                  const idsSesiones = new Set(sesiones.map((s) => s.id))
                  const tareasDelDia = dailyTasks.filter((t) => idsSesiones.has(t.session_plan_id))
                  return (
                    <ResumenDiaCard
                      key={fecha}
                      sesiones={sesiones}
                      ejecucionesDelDia={ejecucionesDelDia}
                      sessionPlans={sessionPlans}
                      tareasDelDia={tareasDelDia}
                      onClick={() => setDiaSeleccionado(fecha)}
                      onDropTemplate={(templateId, tipo) => handleDropTemplate(templateId, tipo, fecha)}
                    />
                  )
                }

                return (
                  <div key={fecha} className={fecha === hoy ? 'rounded-xl ring-2 ring-union-red-400/60' : ''}>
                    <DiaVacio
                      fecha={fecha}
                      onClick={() => setDiaSeleccionado(fecha)}
                      onDropTemplate={(templateId, tipo) => handleDropTemplate(templateId, tipo, fecha)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {diaSeleccionado && activeSeasonId && activeCategoryId && (
        <DiaDetalleModal
          fecha={diaSeleccionado}
          sesiones={sesionesDelDiaSeleccionado}
          seasonId={activeSeasonId}
          categoryId={activeCategoryId}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}

      {vitaminaPendiente && (
        <VitaminaAssignmentModal
          templateId={vitaminaPendiente.templateId}
          templateNombre={vitaminaPendiente.templateNombre}
          sessionPlanId={vitaminaPendiente.sessionPlanId}
          onClose={() => setVitaminaPendiente(null)}
        />
      )}
    </div>
  )
}
