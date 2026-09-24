import { useMemo } from 'react'
import { Card } from '@/components/Card'
import { cambioUltimaVsAnterior, evaluarInsights } from './calculations'
import type { SeveridadInsight } from './calculations'
import { fmtDelta, fmtFechaLarga } from './format'
import type { MedicionAntropo } from './types'

const ESTILO: Record<SeveridadInsight, string> = {
  ideal: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  alerta: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  precaucion: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  estable: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
}

/**
 * Smart Insights — traduce la última medición vs. la anterior a mensajes
 * simples para el DT/profe (las reglas clínicas viven en `evaluarInsights`,
 * `calculations.ts`). Recibe la serie completa del jugador, ya ordenada por
 * fecha; puede mostrar más de un mensaje a la vez.
 */
export function AntropoInsightsPanel({ serie }: { serie: MedicionAntropo[] }) {
  const cambio = useMemo(() => cambioUltimaVsAnterior(serie), [serie])
  const insights = useMemo(() => evaluarInsights(cambio), [cambio])

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">🧠 Smart Insights</h3>
        {cambio && (
          <p className="text-[11px] text-slate-400">
            {fmtFechaLarga(cambio.actual.fecha)} vs. {fmtFechaLarga(cambio.previa.fecha)} · Peso {fmtDelta(cambio.dPeso)} kg
            · Grasa {fmtDelta(cambio.dGrasa)} pp · Músculo {fmtDelta(cambio.dMusculo)} pp
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {insights.map((insight) => (
          <div key={insight.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${ESTILO[insight.severidad]}`}>
            <span className="text-lg leading-none" aria-hidden>
              {insight.icono}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{insight.titulo}</p>
              <p className="text-sm">{insight.mensaje}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
