import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/Card'
import { calcularTendenciaLineal } from './calculations'
import type { PerformanceEvaluation } from '@/types'

const UNION_ROJO = '#ed1c24'

/** Evolución temporal del jugador en la métrica elegida (Fase 38), con línea de tendencia punteada — mismo criterio visual que `GraficoTendenciaGrupal`. */
export function LineaTiempoIndividual({
  evaluaciones,
  metrica,
}: {
  evaluaciones: PerformanceEvaluation[]
  metrica: string
}) {
  const puntos = [...evaluaciones]
    .filter((e) => typeof e.metrics[metrica] === 'number')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((e) => ({ fecha: e.fecha, valor: e.metrics[metrica] }))

  const { pendiente, intercepto } = calcularTendenciaLineal(puntos.map((p) => p.valor))
  const datos = puntos.map((p, i) => ({
    ...p,
    tendencia: Math.round((pendiente * i + intercepto) * 100) / 100,
  }))

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">📈 Evolución — {metrica}</h3>
      {datos.length < 2 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          Este jugador todavía no tiene más de una evaluación con esta métrica.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" name={metrica} stroke={UNION_ROJO} strokeWidth={2} dot={{ r: 3 }} />
              <Line
                type="linear"
                dataKey="tendencia"
                name="Tendencia"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
