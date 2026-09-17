import { Card } from '@/components/Card'
import type { AlertaSmartAnalysis } from './calculations'

const CLASE_POR_NIVEL: Record<AlertaSmartAnalysis['nivel'], string> = {
  ok: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  precaucion: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
  riesgo: 'border-union-red-200 bg-union-red-50 dark:border-union-red-500/30 dark:bg-union-red-500/10',
  info: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60',
}

/**
 * "Smart Analysis" (Fase 38) — tarjetas de alerta automática generadas por
 * `generarSmartAnalysis` (motor de reglas puro, ver `calculations.ts`):
 * asimetrías por semáforo NSCA, potencia relativa vs. peso corporal, y
 * fatiga neuromuscular vs. media histórica. Sólo muestra lo que las reglas
 * detectaron — ningún texto se inventa acá, todo viene calculado.
 */
export function SmartAnalysisPanel({ alertas }: { alertas: AlertaSmartAnalysis[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">🧠 Smart Analysis</h3>
      <div className="flex flex-col gap-2">
        {alertas.map((a, i) => (
          <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${CLASE_POR_NIVEL[a.nivel]}`}>
            <span className="text-lg leading-none" aria-hidden>
              {a.icono}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.titulo}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{a.mensaje}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
