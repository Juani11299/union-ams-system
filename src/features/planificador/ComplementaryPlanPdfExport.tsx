import { useEffect } from 'react'
import type { ComplementaryPlan } from '@/types'

interface ComplementaryPlanPdfExportProps {
  plan: ComplementaryPlan
  clubNombre: string
  categoriaNombre: string
  onClose: () => void
}

/** Series de la progresión ("3x8 @ RPE 7" → 3), tope en 10 para no romper el layout impreso si alguien escribe un número raro. */
function extraerCantidadSeries(texto: string): number {
  const match = texto.trim().match(/^(\d+)/)
  if (!match) return 0
  const n = Number(match[1])
  return Number.isFinite(n) ? Math.min(n, 10) : 0
}

/** Casilleros vacíos para que el jugador anote a lapicera los kilos que levantó, uno por serie. */
function Casilleros({ texto }: { texto: string }) {
  const cantidad = extraerCantidadSeries(texto)
  if (cantidad === 0) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {Array.from({ length: cantidad }).map((_, i) => (
        <span key={i} className="inline-block h-3 w-3 shrink-0 border border-slate-400" aria-hidden />
      ))}
    </div>
  )
}

/**
 * Tarjeta de Gimnasio del Plan Complementario (fuerza extra-club) — mismo
 * mecanismo que `DetailedWeeklyPdfExport`: vive oculto en pantalla
 * (`hidden print:block`) y sólo existe en el DOM durante el `window.print()`
 * que dispara al montarse, desmontándose al `afterprint`. Apaisado (A4
 * landscape) porque una tabla de N semanas necesita el ancho, a diferencia
 * del cuadernillo semanal que es A4 vertical.
 */
export function ComplementaryPlanPdfExport({
  plan,
  clubNombre,
  categoriaNombre,
  onClose,
}: ComplementaryPlanPdfExportProps) {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = '@page { size: A4 landscape; margin: 10mm; }'
    document.head.appendChild(styleEl)

    function handleAfterPrint() {
      onClose()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    window.print()

    return () => {
      styleEl.remove()
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onClose])

  const semanas = Array.from({ length: plan.durationWeeks }, (_, i) => i + 1)

  return (
    <div className="hidden print-area print:block">
      <div className="flex items-start justify-between gap-4 border-b-4 border-union-red-600 pb-3">
        <div className="flex items-center gap-3">
          <img src="/logo-union.png" alt="" className="h-14 w-14 shrink-0 object-contain" />
          <div>
            <p className="text-xl font-bold text-union-charcoal">{plan.title}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {clubNombre} — {categoriaNombre} · Plan Complementario ({plan.durationWeeks} semanas)
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded bg-union-charcoal px-3 py-1.5 text-xs font-bold text-white">
          🎒 Fuerza Extra-Club
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2 text-sm">
        <span className="shrink-0 font-semibold text-union-charcoal">Nombre del Jugador:</span>
        <span className="flex-1 border-b border-slate-400">&nbsp;</span>
      </div>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-union-charcoal text-left text-[10px] uppercase tracking-wide text-white">
            <th className="border border-slate-300 px-2 py-1.5">Ejercicio</th>
            <th className="border border-slate-300 px-2 py-1.5">Notas / Video</th>
            {semanas.map((n) => (
              <th key={n} className="border border-slate-300 px-2 py-1.5 text-center">
                Semana {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plan.planData.exercises.map((ej) => (
            <tr key={ej.id} className="break-inside-avoid">
              <td className="border border-slate-300 px-2 py-2 align-top font-medium text-slate-700">
                {ej.exercise || '—'}
              </td>
              <td className="border border-slate-300 px-2 py-2 align-top text-slate-500">{ej.notes}</td>
              {semanas.map((n) => {
                const texto = ej.progressions[`week${n}`] ?? ''
                return (
                  <td key={n} className="border border-slate-300 px-2 py-2 align-top text-slate-700">
                    <p>{texto || '—'}</p>
                    <Casilleros texto={texto} />
                  </td>
                )
              })}
            </tr>
          ))}
          {plan.planData.exercises.length === 0 && (
            <tr>
              <td
                colSpan={2 + semanas.length}
                className="border border-slate-300 px-2 py-6 text-center text-slate-400"
              >
                Sin ejercicios cargados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-4 text-[10px] text-slate-400">
        Escribí con lapicera los kilos levantados en cada casillero. Devolvé esta tarjeta al Área de Fuerza al
        finalizar el mesociclo.
      </p>
    </div>
  )
}
