import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/Card'
import { calcularTendenciaLineal, type PuntoSerieTemporal } from './calculations'

const UNION_ROJO = '#ed1c24'

/** Promedio grupal de la métrica elegida a lo largo del tiempo, con línea de tendencia punteada (regresión lineal simple sobre el orden de las evaluaciones). */
export function GraficoTendenciaGrupal({ serie, metrica }: { serie: PuntoSerieTemporal[]; metrica: string }) {
  const { pendiente, intercepto } = calcularTendenciaLineal(serie.map((p) => p.promedio))
  const datos = serie.map((p, i) => ({
    fecha: p.fecha,
    promedio: Math.round(p.promedio * 100) / 100,
    tendencia: Math.round((pendiente * i + intercepto) * 100) / 100,
  }))

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        📉 Evolución del promedio grupal — {metrica}
      </h3>
      {datos.length < 2 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          Hace falta más de una fecha de evaluación para dibujar una evolución.
        </p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="promedio" name="Promedio grupal" stroke={UNION_ROJO} strokeWidth={2} dot={{ r: 3 }} />
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
