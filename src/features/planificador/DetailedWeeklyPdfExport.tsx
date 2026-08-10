import { useEffect } from 'react'
import { formatFechaCorta } from '@/utils/fecha'
import type { SessionPlan, DailyTask, StrengthAssignment, StrengthTemplate, GymSheetData } from '@/types'

interface DetailedWeeklyPdfExportProps {
  /** Los 7 días (lunes a domingo) de la semana visible en el Planificador. */
  dias: string[]
  categoriaNombre: string
  clubNombre: string
  sessionPlans: SessionPlan[]
  dailyTasks: DailyTask[]
  strengthAssignments: StrengthAssignment[]
  strengthTemplates: StrengthTemplate[]
  onClose: () => void
}

/**
 * Cuadernillo semanal detallado (ajuste sobre la Fase 17) — reemplaza al
 * calendario de previsualización (`WeeklyPdfExport`, un solo A4 apaisado)
 * por un documento A4 vertical con UNA hoja por sesión y el contenido real:
 * la planilla de fuerza (Fase 16) si la sesión es de Gimnasio, o el detalle
 * de tareas/plantillas asignadas para el resto. Los días sin sesiones se
 * omiten directamente — no generan página.
 *
 * Usa el mismo mecanismo que `WeeklyPdfExport`: vive oculto en pantalla
 * (`hidden print:block`) y sólo existe en el DOM durante el `window.print()`
 * que dispara al montarse, desmontándose solo al `afterprint`. Inyecta su
 * propio `@page` (vertical, margen 10mm) porque difiere tanto del retrato
 * global (`src/index.css`, margen 12mm) como del apaisado que usaba la
 * versión anterior de este export.
 */
export function DetailedWeeklyPdfExport({
  dias,
  categoriaNombre,
  clubNombre,
  sessionPlans,
  dailyTasks,
  strengthAssignments,
  strengthTemplates,
  onClose,
}: DetailedWeeklyPdfExportProps) {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = '@page { size: A4 portrait; margin: 10mm; }'
    document.head.appendChild(styleEl)

    function handleAfterPrint() {
      onClose()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    // `useEffect` ya corre después de que el navegador pintó el DOM nuevo —
    // alcanza con llamar `print()` directo (ver nota en `WeeklyPdfExport`
    // sobre por qué NO conviene envolverlo en `requestAnimationFrame`).
    window.print()

    return () => {
      styleEl.remove()
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onClose])

  // Filtrado cronológico: sólo los días con sesiones aportan páginas — los
  // días vacíos ("Descanso") ya no aparecen en este cuadernillo detallado.
  const sesiones = dias.flatMap((fecha) => sessionPlans.filter((p) => p.fecha === fecha))

  return (
    <div className="hidden print-area print:block">
      {sesiones.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-400">No hay sesiones planificadas esta semana.</p>
      )}
      {sesiones.map((sesion, indice) => (
        <SesionPagina
          key={sesion.id}
          sesion={sesion}
          tareas={dailyTasks.filter((t) => t.session_plan_id === sesion.id)}
          fuerza={strengthAssignments
            .filter((a) => a.sessionPlanId === sesion.id)
            .map((a) => strengthTemplates.find((t) => t.id === a.templateId)?.nombre)
            .filter((nombre): nombre is string => Boolean(nombre))}
          clubNombre={clubNombre}
          categoriaNombre={categoriaNombre}
          esUltima={indice === sesiones.length - 1}
        />
      ))}
    </div>
  )
}

function SesionPagina({
  sesion,
  tareas,
  fuerza,
  clubNombre,
  categoriaNombre,
  esUltima,
}: {
  sesion: SessionPlan
  tareas: DailyTask[]
  fuerza: string[]
  clubNombre: string
  categoriaNombre: string
  esUltima: boolean
}) {
  return (
    <div className={esUltima ? '' : 'break-after-page'}>
      <div className="flex items-start justify-between gap-4 border-b-4 border-union-red-600 pb-4">
        <div className="flex items-center gap-3">
          <img src="/logo-union.png" alt="" className="h-14 w-14 shrink-0 object-contain" />
          <div>
            <p className="text-xl font-bold text-union-charcoal">{sesion.titulo}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {clubNombre} — {categoriaNombre}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          <span className="rounded bg-union-charcoal px-2 py-0.5 text-xs font-bold text-white">
            {sesion.matchDay}
          </span>
          <p className="mt-1 capitalize">{formatFechaCorta(sesion.fecha)}</p>
          <p>
            {sesion.tipo} · {sesion.duracionEstimadaMin} min · {sesion.cargaObjetivo} AU
          </p>
        </div>
      </div>

      {sesion.tipo === 'Gimnasio' && sesion.gymSheetData ? (
        <GymSheetReadOnly data={sesion.gymSheetData} />
      ) : (
        <TareasReadOnly tareas={tareas} fuerza={fuerza} />
      )}
    </div>
  )
}

/** Vista de sólo lectura de la Planilla de Fuerza (Fase 16) — mismo layout que `GymSheetEditor`, sin inputs. */
function GymSheetReadOnly({ data }: { data: GymSheetData }) {
  return (
    <div className="mt-4">
      {data.objetivos && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Objetivos de la sesión</p>
          <p className="text-sm text-slate-700">{data.objetivos}</p>
        </div>
      )}

      {data.bloques.map((bloque) => (
        <div key={bloque.id} className="mt-6 break-inside-avoid">
          <div className="bg-union-charcoal px-2 py-1.5">
            <p className="text-sm font-bold uppercase tracking-wide text-white">{bloque.titulo}</p>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-2">Ejercicio</th>
                <th className="w-14 px-2 py-1.5">Series</th>
                <th className="w-16 px-2 py-1.5">Reps</th>
                <th className="w-20 px-2 py-1.5">Carga (Kg)</th>
                <th className="w-20 px-2 py-1.5">Descanso</th>
                <th className="w-32 py-1.5 pl-2">Notas / RIR-RPE</th>
              </tr>
            </thead>
            <tbody>
              {bloque.ejercicios.map((ej) => (
                <tr key={ej.id} className="border-b border-slate-100">
                  <td className="py-1.5 pr-2 text-slate-700">{ej.nombre}</td>
                  <td className="px-2 py-1.5 text-slate-700">{ej.series}</td>
                  <td className="px-2 py-1.5 text-slate-700">{ej.repeticiones}</td>
                  <td className="px-2 py-1.5 text-slate-700">{ej.cargaKg}</td>
                  <td className="px-2 py-1.5 text-slate-700">{ej.descanso}</td>
                  <td className="py-1.5 pl-2 text-slate-700">{ej.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

/** Vista de sólo lectura del detalle de tareas/fuerza de una sesión no-Gimnasio (o Gimnasio sin planilla cargada). */
function TareasReadOnly({ tareas, fuerza }: { tareas: DailyTask[]; fuerza: string[] }) {
  if (tareas.length === 0 && fuerza.length === 0) {
    return <p className="mt-6 text-sm italic text-slate-400">Sin detalle cargado para esta sesión.</p>
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {tareas.map((tarea) => (
        <div key={tarea.id} className="break-inside-avoid rounded-lg border border-gray-300 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-union-charcoal">{tarea.enfoque}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-union-red-600">
              {tarea.tipo}
            </span>
          </div>
          {tarea.objetivo && <p className="mt-1 text-xs text-slate-600">{tarea.objetivo}</p>}
          <p className="mt-1.5 text-[11px] text-slate-500">
            {tarea.duracionMin} min · RPE {tarea.rpeEsperado}
            {tarea.densidad ? ` · Densidad ${tarea.densidad}` : ''}
            {tarea.cargaCognitiva ? ` · Carga cognitiva ${tarea.cargaCognitiva}` : ''}
          </p>
          {tarea.tacboardData && (
            <p className="mt-1 text-[10px] text-slate-400">🎯 Incluye esquema táctico (TacBoard)</p>
          )}
          {tarea.gpsObjetivo && (
            <p className="mt-1 text-[10px] text-slate-400">📡 GPS objetivo: {formatearGpsObjetivo(tarea)}</p>
          )}
        </div>
      ))}

      {fuerza.length > 0 && (
        <div className="rounded-lg border border-gray-300 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Fuerza asignada</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-slate-600">
            {fuerza.map((nombre) => (
              <li key={nombre}>🏋️ {nombre}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatearGpsObjetivo(tarea: DailyTask): string {
  const g = tarea.gpsObjetivo
  if (!g) return ''
  return [
    g.distanciaObjetivo != null ? `${g.distanciaObjetivo}m` : null,
    g.hsrObjetivo != null ? `HSR ${g.hsrObjetivo}m` : null,
    g.aceleracionesObjetivo != null ? `${g.aceleracionesObjetivo} acel.` : null,
    g.desaceleracionesObjetivo != null ? `${g.desaceleracionesObjetivo} desac.` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}
