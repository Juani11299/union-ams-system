import { useEffect } from 'react'
import { formatFechaCorta, parsearFechaLocal } from '@/utils/fecha'
import type { SessionPlan, DailyTask, StrengthAssignment, StrengthTemplate, TipoSesion } from '@/types'

interface WeeklyPdfExportProps {
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

const TIPO_ABREV: Record<TipoSesion, string> = {
  Campo: 'Campo',
  Gimnasio: 'Gimnasio',
  Partido: 'Partido',
  Recuperación: 'Recup.',
}

function nombreDia(fecha: string): string {
  const texto = parsearFechaLocal(fecha).toLocaleDateString('es-AR', { weekday: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Exportación del microciclo semanal completo a PDF (Fase 17) — a diferencia
 * de la Planilla de Gimnasio (Fase 16, una hoja A4 vertical por sesión), esto
 * vuelca las 7 columnas de la semana en UNA sola hoja A4 apaisada. Por eso no
 * reutiliza el `@page` retrato global (`src/index.css`): inyecta su propia
 * hoja de estilo con `@page { size: A4 landscape; ... }` sólo mientras está
 * montado y la saca al desmontar, para no pisarle la orientación a la
 * Planilla de Gimnasio o al Manual Metodológico si el profe los imprime en
 * otro momento.
 *
 * Vive oculto en pantalla (`hidden print:block`) y sólo "domina" la vista
 * durante el propio `window.print()` que dispara al montarse — se desmonta
 * solo al evento `afterprint`, así el botón "Exportar Semana a PDF" abre el
 * diálogo de impresión al toque, sin un modal de preview intermedio.
 */
export function WeeklyPdfExport({
  dias,
  categoriaNombre,
  clubNombre,
  sessionPlans,
  dailyTasks,
  strengthAssignments,
  strengthTemplates,
  onClose,
}: WeeklyPdfExportProps) {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = '@page { size: A4 landscape; margin: 10mm; }'
    document.head.appendChild(styleEl)

    function handleAfterPrint() {
      onClose()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    // `useEffect` ya corre después de que el navegador pintó el DOM nuevo,
    // así que alcanza con llamar `print()` acá directo — envolverlo en
    // `requestAnimationFrame` no suma nada y, peor, si la pestaña llegara a
    // no estar visible en ese instante, el navegador pausa los rAF
    // indefinidamente y el diálogo de impresión nunca se abre.
    window.print()

    return () => {
      styleEl.remove()
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onClose])

  return (
    <div className="hidden print-area print:block">
      <div className="flex items-center justify-between gap-3 border-b-2 border-union-red-600 pb-2">
        <div className="flex items-center gap-2">
          <img src="/logo-union.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div>
            <h1 className="text-[13pt] font-bold leading-tight text-union-charcoal">
              Planificación Semanal — {categoriaNombre}
            </h1>
            <p className="text-[8pt] uppercase tracking-wide text-slate-400">{clubNombre}</p>
          </div>
        </div>
        <p className="whitespace-nowrap text-[9pt] font-medium capitalize text-slate-500">
          {formatFechaCorta(dias[0])} — {formatFechaCorta(dias[6])}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {dias.map((fecha) => {
          const sesiones = sessionPlans.filter((p) => p.fecha === fecha)
          const hayPartido = sesiones.some((s) => s.tipo === 'Partido')
          const descanso = sesiones.length === 0

          return (
            <div
              key={fecha}
              className={`flex flex-col gap-1.5 rounded-md border border-gray-300 p-1.5 ${
                hayPartido ? 'bg-union-red-50' : descanso ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              <div className="border-b border-gray-300 pb-1">
                <p className="text-[9pt] font-bold text-union-charcoal">{nombreDia(fecha)}</p>
                <p className="text-[7.5pt] capitalize text-slate-400">{formatFechaCorta(fecha)}</p>
              </div>

              {descanso ? (
                <p className="text-[8pt] italic text-slate-400">Descanso</p>
              ) : (
                sesiones.map((sesion) => (
                  <SesionCardPdf
                    key={sesion.id}
                    sesion={sesion}
                    tareas={dailyTasks.filter((t) => t.session_plan_id === sesion.id)}
                    fuerza={strengthAssignments
                      .filter((a) => a.sessionPlanId === sesion.id)
                      .map((a) => strengthTemplates.find((t) => t.id === a.templateId)?.nombre)
                      .filter((nombre): nombre is string => Boolean(nombre))}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SesionCardPdf({ sesion, tareas, fuerza }: { sesion: SessionPlan; tareas: DailyTask[]; fuerza: string[] }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-gray-300 bg-white p-1.5 break-inside-avoid">
      <div className="flex items-center justify-between gap-1">
        <span className="rounded bg-union-charcoal px-1 py-[1px] text-[7pt] font-bold text-white">
          {sesion.matchDay}
        </span>
        <span className="text-[7pt] font-semibold uppercase tracking-wide text-union-red-600">
          {TIPO_ABREV[sesion.tipo]}
        </span>
      </div>
      <p className="text-[9pt] font-semibold leading-snug text-union-charcoal">{sesion.titulo}</p>
      <p className="text-[7.5pt] text-slate-500">
        {sesion.duracionEstimadaMin}min · {sesion.cargaObjetivo} AU
      </p>

      {(tareas.length > 0 || fuerza.length > 0) && (
        <ul className="flex flex-col gap-0.5 border-t border-gray-200 pt-1 text-[7pt] leading-tight text-slate-500">
          {tareas.map((t) => (
            <li key={t.id}>
              {t.tacboardData ? '🎯' : '•'} {t.enfoque}
            </li>
          ))}
          {fuerza.map((nombre) => (
            <li key={nombre}>🏋️ {nombre}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
