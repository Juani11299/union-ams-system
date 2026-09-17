import { Card } from '@/components/Card'
import type { FilaComparativa } from './calculations'

/**
 * Tabla Jugador / Anterior / Actual / % Variación (Fase 38) — verde si
 * mejoró, rojo si empeoró, con el toggle "Invertir lógica de mejora" para
 * las métricas donde el detector automático de asimetría no adivine bien
 * (ej. una métrica de sprint que no tenga "sprint" en el nombre).
 */
export function TablaComparativa({
  filas,
  fechaAnterior,
  fechaActual,
  invertirLogica,
  onToggleInvertir,
}: {
  filas: FilaComparativa[]
  fechaAnterior: string | null
  fechaActual: string | null
  invertirLogica: boolean
  onToggleInvertir: () => void
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">📋 Tabla Comparativa</h3>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={invertirLogica}
            onChange={onToggleInvertir}
            className="h-3.5 w-3.5 rounded border-slate-300 text-union-red-600 focus:ring-union-red-500"
          />
          Invertir lógica de mejora (para esta métrica, menos es mejor)
        </label>
      </div>

      {!fechaAnterior && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Sólo hay una evaluación de este tipo todavía — cuando se importe la próxima, acá va a aparecer el % de
          variación contra ésta.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
              <th className="py-2 pr-2">Jugador</th>
              <th className="px-2 py-2 text-right">Anterior{fechaAnterior ? ` (${fechaAnterior})` : ''}</th>
              <th className="px-2 py-2 text-right">Actual{fechaActual ? ` (${fechaActual})` : ''}</th>
              <th className="py-2 pl-2 text-right">% Variación</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.playerKey} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="py-2 pr-2 font-medium text-slate-800 dark:text-slate-100">{f.nombre}</td>
                <td className="px-2 py-2 text-right text-slate-500 dark:text-slate-400">
                  {f.valorAnterior ?? '—'}
                </td>
                <td className="px-2 py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                  {f.valorActual ?? '—'}
                </td>
                <td
                  className={`py-2 pl-2 text-right font-bold ${
                    f.variacionPct === null
                      ? 'text-slate-300 dark:text-slate-600'
                      : f.mejora
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-union-red-600 dark:text-union-red-400'
                  }`}
                >
                  {f.variacionPct === null ? '—' : `${f.variacionPct > 0 ? '+' : ''}${f.variacionPct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
