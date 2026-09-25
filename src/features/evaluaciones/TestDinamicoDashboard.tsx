import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { Tabs, type TabItem } from '@/components/Tabs'
import { pctOf, stats, zOf } from '@/features/nordbord/calculations'
import { zColor } from '@/features/nordbord/format'
import type { FilaTestDinamico, MetricaTestDinamico, TestDinamico } from './dinamicas'
import { normalizarNombre } from '@/utils/smartEntityMatcher'
import { PantallaCompleta } from './PantallaCompleta'

const TABS: TabItem[] = [
  { id: 'grupal', label: 'Análisis Grupal', icon: '👥' },
  { id: 'individual', label: 'Análisis Individual', icon: '🕵️' },
]

const fmt = (v: number | null | undefined, d = 2): string =>
  v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

/** Último resultado de cada jugador (por fecha) — el "estado actual" del grupo. */
function ultimoPorJugador(filas: FilaTestDinamico[]): Array<FilaTestDinamico & { key: string }> {
  const m = new Map<string, FilaTestDinamico & { key: string }>()
  for (const f of filas) {
    const key = normalizarNombre(f.jugador)
    const p = m.get(key)
    if (!p || f.fecha >= p.fecha) m.set(key, { ...f, key })
  }
  return [...m.values()]
}

/** Dashboard genérico de un test dinámico (creado desde el Hub con un CSV/Excel nuevo). */
export function TestDinamicoDashboard({ test, onBack }: { test: TestDinamico; onBack: () => void }) {
  const [tab, setTab] = useState('grupal')
  const [categoria, setCategoria] = useState('')
  const [metricaKey, setMetricaKey] = useState(test.metricas.find((m) => m.clave)?.key ?? test.metricas[0]?.key ?? '')
  const [sel, setSel] = useState('')

  const metrica: MetricaTestDinamico | undefined = test.metricas.find((m) => m.key === metricaKey) ?? test.metricas[0]
  const categorias = useMemo(() => [...new Set(test.filas.map((f) => f.categoria))].sort((a, b) => a.localeCompare(b, 'es')), [test])
  const cat = categorias.includes(categoria) ? categoria : ''
  const filas = useMemo(() => (cat ? test.filas.filter((f) => f.categoria === cat) : test.filas), [test, cat])
  const actuales = useMemo(() => ultimoPorJugador(filas), [filas])

  const st = useMemo(() => stats(actuales.map((f) => (metrica ? f.valores[metrica.key] : null))), [actuales, metrica])
  const ranking = useMemo(() => {
    if (!metrica) return []
    return actuales
      .filter((f) => f.valores[metrica.key] !== undefined)
      .map((f) => ({ f, v: f.valores[metrica.key], z: zOf(f.valores[metrica.key], st, metrica.menosEsMejor) }))
      .sort((a, b) => (b.z ?? -Infinity) - (a.z ?? -Infinity))
  }, [actuales, metrica, st])

  const jugadores = useMemo(() => [...actuales].sort((a, b) => a.jugador.localeCompare(b.jugador, 'es')), [actuales])
  const jugadorKey = jugadores.some((j) => j.key === sel) ? sel : (jugadores[0]?.key ?? '')
  const serie = useMemo(
    () => filas.filter((f) => normalizarNombre(f.jugador) === jugadorKey).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [filas, jugadorKey],
  )

  const unidad = metrica?.unidad ? ` ${metrica.unidad}` : ''
  const mejor = ranking[0]

  return (
    <PantallaCompleta titulo={`${test.icono} ${test.nombre}`} subtitulo={`${test.filas.length} evaluaciones · ${test.metricas.length} métricas · ${test.archivo}`} onBack={onBack}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Categoría</span>
            <select className={`${inputClass} min-w-[160px]`} value={cat} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[260px] flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Métrica</span>
            <select className={inputClass} value={metrica?.key ?? ''} onChange={(e) => setMetricaKey(e.target.value)}>
              {test.metricas.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                  {m.menosEsMejor ? ' ↓ mejor' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Tabs tabs={TABS} activeId={tab} onChange={setTab} />

        {!metrica ? (
          <Card className="py-12 text-center text-sm text-slate-500">Este test no tiene métricas.</Card>
        ) : tab === 'grupal' ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi t="Evaluados" v={String(ranking.length)} foot={`${actuales.length - ranking.length} sin dato`} />
              <Kpi t="Media del grupo" v={`${fmt(st.mean)}${unidad}`} foot={`± ${fmt(st.sd)} DE`} />
              <Kpi t="Mejor registro" v={mejor ? `${fmt(mejor.v)}${unidad}` : '—'} foot={mejor?.f.jugador ?? ''} />
              <Kpi t="Coef. de variación" v={`${fmt(st.cv, 1)} %`} foot={st.cv < 10 ? 'Grupo homogéneo' : st.cv < 20 ? 'Variabilidad moderada' : 'Alta heterogeneidad'} />
            </div>
            <Card className="flex flex-col gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Distribución & Z-Score · {metrica.label}</h3>
                <p className="text-[11px] text-slate-400">
                  Último resultado de cada jugador, del mejor al peor{metrica.menosEsMejor ? ' (menos es mejor, Z invertido)' : ''}. Verde ≥ +1 DE · Azul en la media · Naranja −1 a −2 DE · Rojo ≤ −2 DE.
                </p>
              </div>
              <div style={{ height: Math.max(260, ranking.length * 19 + 50) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ranking.map((r) => ({ name: r.f.jugador, v: r.v, z: r.z, cat: r.f.categoria, fecha: r.f.fecha, key: r.f.key }))} layout="vertical" margin={{ top: 8, right: 24, left: 4, bottom: 0 }} barCategoryGap="12%">
                    <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" orientation="top" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 10.5, fill: '#475569' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148,163,184,.15)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0].payload as { name: string; v: number; z: number | null; cat: string; fecha: string }
                        return (
                          <div style={{ background: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5 }}>
                            <div style={{ color: '#fff', fontWeight: 700 }}>
                              {p.name} · {p.cat}
                            </div>
                            <div>
                              Valor: {fmt(p.v)}
                              {unidad}
                            </div>
                            <div>Z-score: {fmt(p.z)}</div>
                            <div>Test: {p.fecha}</div>
                          </div>
                        )
                      }}
                    />
                    <ReferenceLine x={st.mean} stroke="#0f172a" strokeWidth={2} />
                    <ReferenceLine x={st.mean + st.sd} stroke="#475569" strokeDasharray="4 4" />
                    <ReferenceLine x={st.mean - st.sd} stroke="#475569" strokeDasharray="4 4" />
                    <Bar dataKey="v" radius={4} cursor="pointer" onClick={(_d, i) => { setSel(ranking[i].f.key); setTab('individual') }}>
                      {ranking.map((r) => (
                        <Cell key={r.f.key} fill={zColor(r.z)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="flex max-h-[600px] flex-col gap-0.5 overflow-y-auto">
              {jugadores.map((j) => (
                <button
                  key={j.key}
                  type="button"
                  onClick={() => setSel(j.key)}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${j.key === jugadorKey ? 'bg-union-red-50 font-semibold text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  <span className="min-w-0 flex-1 truncate">{j.jugador}</span>
                  <span className="text-[10px] text-slate-400">{j.categoria}</span>
                </button>
              ))}
            </Card>
            <div className="flex min-w-0 flex-col gap-4">
              <Card className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {jugadores.find((j) => j.key === jugadorKey)?.jugador} — evolución de {metrica.label}
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serie.map((f) => ({ fecha: f.fecha, v: f.valores[metrica.key] ?? null }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} width={52} domain={['auto', 'auto']} />
                      <Tooltip formatter={(v) => [`${fmt(Number(v))}${unidad}`, metrica.label]} />
                      <ReferenceLine y={st.mean} stroke="#94a3b8" strokeDasharray="5 4" label={{ value: 'Media del grupo', position: 'insideTopLeft', fill: '#64748b', fontSize: 10 }} />
                      <Line type="monotone" dataKey="v" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4, fill: '#dc2626', stroke: '#fff', strokeWidth: 1.5 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Última evaluación · todas las métricas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-400 dark:border-slate-700">
                        <th className="py-1.5 pr-3">Métrica</th>
                        <th className="py-1.5 pr-3 text-right">Valor</th>
                        <th className="py-1.5 text-right">Percentil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const ult = serie[serie.length - 1]
                        if (!ult) return null
                        return test.metricas
                          .filter((m) => ult.valores[m.key] !== undefined)
                          .map((m) => {
                            const s = stats(actuales.map((f) => f.valores[m.key]))
                            const p = pctOf(ult.valores[m.key], s, m.menosEsMejor)
                            return (
                              <tr key={m.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                                <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{m.label}</td>
                                <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{fmt(ult.valores[m.key])}</td>
                                <td className="py-1.5 text-right tabular-nums text-slate-500">{p === null ? '—' : `P${p.toFixed(0)}`}</td>
                              </tr>
                            )
                          })
                      })()}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PantallaCompleta>
  )
}


function Kpi({ t, v, foot }: { t: string; v: string; foot: string }) {
  return (
    <Card className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t}</span>
      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{v}</span>
      <span className="truncate text-[11px] text-slate-400">{foot}</span>
    </Card>
  )
}
