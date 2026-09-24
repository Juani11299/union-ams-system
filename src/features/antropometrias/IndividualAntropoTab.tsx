import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { AntropoInsightsPanel } from './AntropoInsightsPanel'
import { agruparPorJugador, cambioUltimaVsAnterior } from './calculations'
import { fmtDelta, fmtFechaCorta, fmtFechaLarga, fmtNum } from './format'
import type { MedicionAntropo } from './types'

const COLOR_PESO = '#334155'
const COLOR_GRASA = '#f59e0b'
const COLOR_MUSCULO = '#10b981'

/**
 * Eje con ±2 de margen y límites enteros. Con el auto-escalado de Recharts,
 * un jugador estable (80,0 → 80,3 kg) se dibuja como una curva empinada y
 * con ticks decimales ("80.24 kg"): una variación de 300 g parece un salto.
 * El margen mantiene la pendiente proporcional a lo que realmente cambió.
 */
const DOMINIO_CON_MARGEN: [(min: number) => number, (max: number) => number] = [
  (min) => Math.floor(min - 2),
  (max) => Math.ceil(max + 2),
]

function MiniKpi({ titulo, valor, unidad, delta, deltaUnidad }: { titulo: string; valor: number | null; unidad: string; delta: number | null; deltaUnidad: string }) {
  return (
    <Card className="flex flex-col gap-0.5 p-3!">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{titulo}</span>
      <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
        {fmtNum(valor)}
        <span className="ml-1 text-xs font-semibold text-slate-400">{unidad}</span>
      </span>
      <span className="text-[11px] text-slate-400">
        {delta === null ? 'sin medición anterior' : `${fmtDelta(delta)} ${deltaUnidad} vs. anterior`}
      </span>
    </Card>
  )
}

/**
 * Análisis Individual (longitudinal) — `enGrupo` puebla el selector de
 * jugadores (ya filtrado por "AGRUPAR POR"); `todas` trae TODAS las
 * mediciones para armar la serie completa del jugador elegido, aunque
 * alguna sea de otra categoría (un jugador que subió de división a mitad de
 * año no pierde su historia).
 */
export function IndividualAntropoTab({ enGrupo, todas }: { enGrupo: MedicionAntropo[]; todas: MedicionAntropo[] }) {
  const opciones = useMemo(() => {
    const porJugador = agruparPorJugador(enGrupo)
    return Array.from(porJugador.entries())
      .map(([key, serie]) => ({ key, nombre: serie[serie.length - 1].jugador }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [enGrupo])

  const [elegido, setElegido] = useState('')
  const jugadorKey = opciones.some((o) => o.key === elegido) ? elegido : (opciones[0]?.key ?? '')

  const serie = useMemo(
    () => (jugadorKey ? (agruparPorJugador(todas).get(jugadorKey) ?? []) : []),
    [todas, jugadorKey],
  )
  const cambio = useMemo(() => cambioUltimaVsAnterior(serie), [serie])

  if (opciones.length === 0) {
    return (
      <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay jugadores para este grupo. Importá el archivo del nutricionista para empezar.
      </Card>
    )
  }

  const ultima = serie[serie.length - 1]
  const datos = serie.map((m) => ({ fecha: m.fecha, peso: m.pesoKg, grasa: m.grasaPct, musculo: m.musculoPct }))
  const variasCategorias = new Set(serie.map((m) => m.categoria)).size > 1

  return (
    <div className="flex flex-col gap-4">
      <label className="flex max-w-sm flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">Jugador</span>
        <select className={inputClass} value={jugadorKey} onChange={(e) => setElegido(e.target.value)}>
          {opciones.map((o) => (
            <option key={o.key} value={o.key}>
              {o.nombre}
            </option>
          ))}
        </select>
      </label>

      {ultima && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniKpi titulo="Peso" valor={ultima.pesoKg} unidad="kg" delta={cambio?.dPeso ?? null} deltaUnidad="kg" />
          <MiniKpi titulo="Masa grasa" valor={ultima.grasaPct} unidad="%" delta={cambio?.dGrasa ?? null} deltaUnidad="pp" />
          <MiniKpi titulo="Masa muscular" valor={ultima.musculoPct} unidad="%" delta={cambio?.dMusculo ?? null} deltaUnidad="pp" />
          <MiniKpi titulo="Σ pliegues" valor={ultima.pliegues} unidad="mm" delta={null} deltaUnidad="mm" />
        </div>
      )}

      <Card className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Evolución en el año — {serie.length} medición(es)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(f: string) => fmtFechaCorta(f)} />
              <YAxis
                yAxisId="peso"
                tick={{ fontSize: 11 }}
                domain={DOMINIO_CON_MARGEN}
                allowDecimals={false}
                width={52}
                unit=" kg"
                stroke={COLOR_PESO}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                tick={{ fontSize: 11 }}
                domain={DOMINIO_CON_MARGEN}
                allowDecimals={false}
                width={44}
                unit="%"
                stroke={COLOR_GRASA}
              />
              <Tooltip
                labelFormatter={(f) => fmtFechaLarga(String(f))}
                formatter={(v, nombre) => {
                  const n = Number(v)
                  return [Number.isFinite(n) ? fmtNum(n) : '—', nombre]
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="peso" type="monotone" dataKey="peso" name="Peso (kg)" stroke={COLOR_PESO} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line yAxisId="pct" type="monotone" dataKey="grasa" name="% Grasa" stroke={COLOR_GRASA} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line yAxisId="pct" type="monotone" dataKey="musculo" name="% Muscular" stroke={COLOR_MUSCULO} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-400">
          Eje izquierdo: peso (kg). Eje derecho: % de grasa y % muscular — así se ve si la subida de peso acompañó al
          músculo o a la grasa.
        </p>
      </Card>

      <AntropoInsightsPanel serie={serie} />

      <Card className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Historial de mediciones</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="py-1.5 pr-3">Fecha</th>
                {variasCategorias && <th className="py-1.5 pr-3">Categoría</th>}
                <th className="py-1.5 pr-3 text-right">Peso (kg)</th>
                <th className="py-1.5 pr-3 text-right">% Grasa</th>
                <th className="py-1.5 pr-3 text-right">% Muscular</th>
                <th className="py-1.5 text-right">Σ pliegues (mm)</th>
              </tr>
            </thead>
            <tbody>
              {[...serie].reverse().map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{fmtFechaLarga(m.fecha)}</td>
                  {variasCategorias && <td className="py-1.5 pr-3 text-slate-500">{m.categoria}</td>}
                  <td className="py-1.5 pr-3 text-right tabular-nums">{fmtNum(m.pesoKg)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{fmtNum(m.grasaPct)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{fmtNum(m.musculoPct)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtNum(m.pliegues)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
