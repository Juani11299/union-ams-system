import { useMemo, useState } from 'react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { Tabs, type TabItem } from '@/components/Tabs'
import { PantallaCompleta } from '../PantallaCompleta'
import { defsRadar, generarInsightsGlobales, puntaje, type AtletaModelo, type InsightGlobal, type MetricaDef, type ModeloPerfil } from './datos'
import { CuadranteGrupal } from './CuadranteGrupal'
import { usePerfilModelo } from './usePerfilModelo'

const TABS: TabItem[] = [
  { id: 'individual', label: 'Vista Individual', icon: '👤' },
  { id: 'grupal', label: 'Vista Grupal · Cuadrantes', icon: '👥' },
]

const NIVEL: Record<InsightGlobal['nivel'], string> = {
  riesgo: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  precaucion: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
}

export const fmtValor = (v: number | undefined, d: MetricaDef): string =>
  v === undefined ? '—' : `${v.toLocaleString('es-AR', { minimumFractionDigits: d.d, maximumFractionDigits: d.d })}${d.unidad ? ` ${d.unidad}` : ''}`

/** Etiqueta del eje en dos líneas ("Fuente · métrica"), recortada para que no se salga del gráfico. */
function EjeRadar(props: { x?: number; y?: number; textAnchor?: 'start' | 'middle' | 'end' | 'inherit'; payload?: { value?: string } }) {
  const { x = 0, y = 0, textAnchor = 'middle', payload } = props
  const [fuente, ...resto] = String(payload?.value ?? '').split(' · ')
  const corto = (t: string) => (t.length > 20 ? `${t.slice(0, 19)}…` : t)
  const l1 = resto.length ? fuente : ''
  const l2 = resto.length ? resto.join(' · ') : fuente
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={10.5} fontWeight={600} fill="#475569">
      {l1 && (
        <tspan x={x} dy="-0.3em" fill="#94a3b8">
          {corto(l1)}
        </tspan>
      )}
      <tspan x={x} dy={l1 ? '1.2em' : '0.35em'}>
        {corto(l2)}
      </tspan>
    </text>
  )
}

const colorPuntaje = (p: number | null): string => (p === null ? '#94a3b8' : p >= 75 ? '#10b981' : p >= 40 ? '#0ea5e9' : p >= 20 ? '#f97316' : '#ef4444')

/**
 * PERFIL DE ATLETA 360° — vista maestra inmersiva que integra NordBord,
 * ForceDecks (CMJ), Antropometrías y los tests dinámicos. Individual: radar
 * unificado (cada eje = percentil 0–100 dentro de su categoría) + Global Smart
 * Insights que cruzan pruebas. Grupal: cuadrantes X/Y con métricas de tests
 * distintos.
 */
export function PerfilAtleta360({ onBack }: { onBack: () => void }) {
  const modelo = usePerfilModelo()
  const [tab, setTab] = useState('individual')
  const [categoria, setCategoria] = useState('')
  const [sel, setSel] = useState<string | null>(null)

  const categorias = useMemo(() => [...new Set(modelo.atletas.map((a) => a.categoria))].sort((a, b) => a.localeCompare(b, 'es')), [modelo])
  const cat = categorias.includes(categoria) ? categoria : ''
  const atletas = useMemo(() => (cat ? modelo.atletas.filter((a) => a.categoria === cat) : modelo.atletas), [modelo, cat])

  function abrirAtleta(key: string) {
    setSel(key)
    setTab('individual')
  }

  return (
    <PantallaCompleta
      titulo="PERFIL DE ATLETA 360°"
      subtitulo={`${modelo.atletas.length} atletas · ${modelo.fuentes.length} fuente(s) de datos`}
      onBack={onBack}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Categoría</span>
            <select className={`${inputClass} min-w-[180px]`} value={cat} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas ({modelo.atletas.length})</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c} ({modelo.atletas.filter((a) => a.categoria === c).length})
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {modelo.fuentes.map((f) => (
              <span key={f.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {f.label} · {f.atletas}
              </span>
            ))}
          </div>
        </div>

        {modelo.atletas.length === 0 ? (
          <Card className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            Todavía no hay datos para cruzar. Cargá un export de NordBord, evaluaciones de ForceDecks (CMJ), antropometrías o un test nuevo desde el Hub.
          </Card>
        ) : (
          <>
            <Tabs tabs={TABS} activeId={tab} onChange={setTab} />
            {tab === 'individual' && <VistaIndividual modelo={modelo} atletas={atletas} sel={sel} onSel={setSel} />}
            {tab === 'grupal' && <CuadranteGrupal modelo={modelo} atletas={atletas} onAbrir={abrirAtleta} />}
          </>
        )}
      </div>
    </PantallaCompleta>
  )
}

function VistaIndividual({ modelo, atletas, sel, onSel }: { modelo: ModeloPerfil; atletas: AtletaModelo[]; sel: string | null; onSel: (k: string) => void }) {
  const [q, setQ] = useState('')
  const qn = q.trim().toLowerCase()
  const lista = atletas.filter((a) => !qn || a.nombre.toLowerCase().includes(qn))
  const a = atletas.find((x) => x.key === sel) ?? atletas[0]

  const radar = useMemo(() => {
    if (!a) return []
    return defsRadar(modelo)
      .map((d) => ({ d, p: puntaje(modelo, a, d) }))
      .filter((x): x is { d: MetricaDef; p: number } => x.p !== null)
  }, [modelo, a])
  const insights = useMemo(() => (a ? generarInsightsGlobales(modelo, a) : []), [modelo, a])

  if (!a) return <Card className="py-12 text-center text-sm text-slate-500">Sin atletas en esta categoría.</Card>

  const porFuente = new Map<string, MetricaDef[]>()
  for (const d of modelo.catalogo) {
    if (a.valores[d.id] === undefined) continue
    porFuente.set(d.fuenteLabel, [...(porFuente.get(d.fuenteLabel) ?? []), d])
  }
  const datosRadar = radar.map((x) => ({ label: x.d.radarLabel, cur: Math.round(x.p), ref: 50 }))

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="flex flex-col gap-2">
        <input type="search" className={inputClass} placeholder="Buscar atleta…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex max-h-[560px] flex-col gap-0.5 overflow-y-auto">
          {lista.map((x) => {
            const n = new Set(modelo.catalogo.filter((d) => x.valores[d.id] !== undefined).map((d) => d.fuente)).size
            return (
              <button
                key={x.key}
                type="button"
                onClick={() => onSel(x.key)}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${x.key === a.key ? 'bg-union-red-50 font-semibold text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                <span className="min-w-0 flex-1 truncate">{x.nombre}</span>
                <span className="text-[10px] text-slate-400">{x.categoria}</span>
                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800" title="Cantidad de fuentes con datos">
                  {n}
                </span>
              </button>
            )
          })}
          {lista.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-400">Sin resultados.</p>}
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="flex flex-wrap items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-union-red-600 to-rose-900 text-lg font-extrabold text-white">
            {a.nombre.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{a.nombre}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {a.categoria} · {[...porFuente.keys()].join(' · ')}
            </p>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Radar Neuromuscular Unificado (0–100)</h3>
              <p className="text-[11px] text-slate-400">
                Cada eje es el percentil del atleta dentro de su categoría (100 = mejor del grupo; las métricas de "menos es mejor" ya vienen invertidas). La línea punteada es la mediana del grupo.
              </p>
            </div>
            {datosRadar.length < 3 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-10 text-center text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                El radar necesita al menos 3 ejes con datos ({datosRadar.length} disponible/s). Sumá más pruebas de este jugador.
              </p>
            ) : (
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={datosRadar} outerRadius="66%">
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="label" tick={<EjeRadar />} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                    <Tooltip formatter={(v, n) => [`P${Number(v).toFixed(0)}`, n]} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11.5, fontWeight: 600 }} />
                    <Radar animationDuration={500} name="Mediana del grupo" dataKey="ref" stroke="#64748b" strokeDasharray="6 4" fill="rgba(100,116,139,.08)" fillOpacity={1} dot={false} />
                    <Radar animationDuration={500} name={a.nombre} dataKey="cur" stroke="#dc2626" strokeWidth={2.5} fill="rgba(220,38,38,.22)" fillOpacity={1} dot={{ r: 4, fill: '#dc2626', stroke: '#fff', strokeWidth: 1.5 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">🧠 Global Smart Insights</h3>
              <p className="text-[11px] text-slate-400">Reglas que cruzan pruebas distintas (isquios × salto × composición corporal). Orientativo: validar con el cuerpo médico.</p>
            </div>
            <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
              {insights.map((i) => (
                <div key={i.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${NIVEL[i.nivel]}`}>
                  <span className="text-lg leading-none" aria-hidden>
                    {i.icono}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{i.titulo}</p>
                    <p className="text-sm">{i.mensaje}</p>
                    {i.fuentes.length > 0 && <p className="mt-1 text-[11px] opacity-70">Cruce: {i.fuentes.join(' × ')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Todas las métricas del atleta</h3>
          {[...porFuente.entries()].map(([fuente, defs]) => (
            <div key={fuente}>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{fuente}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <tbody>
                    {defs.map((d) => {
                      const p = puntaje(modelo, a, d)
                      return (
                        <tr key={d.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                          <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{d.label}</td>
                          <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{fmtValor(a.valores[d.id], d)}</td>
                          <td className="py-1.5 pr-3 text-[11px] text-slate-400">{a.fechas[d.id]}</td>
                          <td className="w-40 py-1.5">
                            {p !== null ? (
                              <div className="flex items-center gap-2" title={`Percentil ${p.toFixed(0)} dentro de su grupo`}>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: colorPuntaje(p) }} />
                                </div>
                                <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-slate-500">P{p.toFixed(0)}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">sin grupo</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
