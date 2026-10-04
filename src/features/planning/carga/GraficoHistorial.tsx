import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PuntoHistorial } from '@/features/workload/cargaInterna'

const COLOR = { campo: '#0ea5e9', gimnasio: '#8b5cf6', partido: '#f59e0b', aguda: '#dc2626', cronica: '#475569' }
const num = (v: number, d = 0) => v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

/**
 * Barras = carga del período (apilada Campo / Gimnasio / Partido, eje izquierdo)
 * y líneas = carga aguda (suma 7 días) y crónica (promedio semanal de 28 días),
 * ambas en UA/semana (eje derecho). La zona entre las dos curvas es el ACWR:
 * cuando la aguda cruza por encima de la crónica la carga reciente supera lo
 * que el jugador está acostumbrado a tolerar.
 */
export function GraficoHistorial({ puntos, semanal, alto = 340 }: { puntos: PuntoHistorial[]; semanal: boolean; alto?: number }) {
  if (puntos.length === 0) return <p className="py-10 text-center text-sm text-slate-400">Sin datos en este período.</p>
  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={puntos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={14} />
          <YAxis yAxisId="barras" tick={{ fontSize: 11, fill: '#64748b' }} width={48} label={{ value: semanal ? 'UA / semana' : 'UA / día', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
          <YAxis yAxisId="lineas" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} width={48} label={{ value: 'UA / semana', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as PuntoHistorial
              return (
                <div style={{ background: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5 }}>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{semanal ? `Semana del ${p.etiqueta.replace('Sem ', '')}` : p.fecha}</div>
                  <div>Carga: {num(p.carga)} UA (Campo {num(p.campo)} + Gimnasio {num(p.gimnasio)}{p.partido > 0 ? ` + Partido ${num(p.partido)}` : ''})</div>
                  <div>Aguda 7d: {num(p.aguda)} · Crónica 28d: {num(p.cronica)}</div>
                  <div>ACWR: {p.acwr === null ? '—' : num(p.acwr, 2)}</div>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11.5 }} />
          <Bar yAxisId="barras" dataKey="campo" name="Campo" stackId="c" fill={COLOR.campo} />
          <Bar yAxisId="barras" dataKey="gimnasio" name="Gimnasio" stackId="c" fill={COLOR.gimnasio} />
          <Bar yAxisId="barras" dataKey="partido" name="Partido" stackId="c" fill={COLOR.partido} radius={[3, 3, 0, 0]} />
          <Line yAxisId="lineas" type="monotone" dataKey="aguda" name="Carga aguda (7d)" stroke={COLOR.aguda} strokeWidth={2.5} dot={false} />
          <Line yAxisId="lineas" type="monotone" dataKey="cronica" name="Carga crónica (28d, prom. semanal)" stroke={COLOR.cronica} strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
