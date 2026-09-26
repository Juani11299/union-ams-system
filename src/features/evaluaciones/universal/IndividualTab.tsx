import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fdate, fdShort, initials, norm } from '@/features/nordbord/calculations'
import { zColor } from '@/features/nordbord/format'
import { Pill, TipBox } from '@/features/nordbord/ui'
import { ASIM_COLOR, ASIM_ROJO, ASIM_TXT, ASIM_VERDE, asymLvlGenerico } from './semaforo'
import { estadoU, fmt, fmtV, LVL_COLOR_U, ok, pctOf, poolU, prevU, stats, zOf } from './calculos'
import type { CatRefU, DatasetU, MetricaU, Ventana } from './tipos'

interface Props {
  ds: DatasetU
  win: Ventana
  cat: string
  catRef: CatRefU
  sel: string | null
  onSel: (k: string) => void
  printing: boolean
}

type Modo = 'cat' | 'all' | 'prev'

function EjeRadar(props: { x?: number; y?: number; textAnchor?: 'start' | 'middle' | 'end' | 'inherit'; payload?: { value?: string } }) {
  const { x = 0, y = 0, textAnchor = 'middle', payload } = props
  const t = String(payload?.value ?? '')
  const corto = t.length > 24 ? `${t.slice(0, 23)}…` : t
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={11} fontWeight={600} fill="#1e293b">
      {corto}
    </text>
  )
}

/** Ficha Individual — selector de jugador, radar (valor actual vs anterior) sobre las métricas clave, tabla de Z-scores y evolución longitudinal. */
export function IndividualTab({ ds, win, cat, catRef, sel, onSel, printing }: Props) {
  const [q, setQ] = useState('')
  const [modoSel, setModoSel] = useState<Modo>('cat')
  const [evoKey, setEvoKey] = useState('')

  const pool = useMemo(() => poolU(ds, win, cat), [ds, win, cat])
  const all = useMemo(() => poolU(ds, win, 'all'), [ds, win])
  const qn = norm(q)
  const lista = useMemo(() => pool.filter((t) => !qn || norm(`${t.ath.nombre} ${t.ath.rosterName ?? ''} ${t.ath.cat}`).includes(qn)).sort((a, b) => a.ath.nombre.localeCompare(b.ath.nombre, 'es')), [pool, qn])
  const t = pool.find((x) => x.key === sel) ?? [...pool].sort((a, b) => a.ath.nombre.localeCompare(b.ath.nombre, 'es'))[0]

  const buscador = <input type="search" id="search" placeholder="Buscar atleta…" style={{ width: '100%' }} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
  const listado = (
    <div className="plist">
      {lista.map((x) => (
        <button key={x.key} className={x.key === t?.key ? 'sel' : ''} onClick={() => onSel(x.key)}>
          <span className="sd" style={{ background: LVL_COLOR_U[estadoU(x, ds, catRef).lvl] }} />
          <span className="nm">{x.ath.nombre}</span>
          <small>{x.ath.cat}</small>
        </button>
      ))}
      {!lista.length && <div className="note">Sin resultados.</div>}
    </div>
  )

  if (!t) {
    return (
      <section className="view active" id="v-ind">
        <div className="ind">
          <div className="card">{buscador}{listado}</div>
          <div className="card empty">Sin evaluaciones para este filtro.</div>
        </div>
      </section>
    )
  }

  const a = t.ath
  const pt = prevU(t)
  const modo: Modo = modoSel === 'prev' && !pt ? 'cat' : modoSel
  const comp = modo === 'all' ? all : all.filter((x) => x.ath.cat === a.cat)
  const compLbl = modo === 'all' ? `todo el plantel evaluado (n=${comp.length})` : `su categoría (${a.cat}, n=${comp.length})`
  const E = estadoU(t, ds, catRef)

  // Ejes del radar: las métricas clave (y, si son pocas, las asimetrías) hasta un máximo de 8.
  const ejes: MetricaU[] = [...ds.clave, ...ds.asimetrias.filter((m) => !m.clave)].slice(0, 8)
  const statsPorEje = Object.fromEntries(ejes.map((m) => [m.key, stats(comp.map((x) => x.valores[m.key]))]))
  const rango = (m: MetricaU) => {
    const v = [...statsPorEje[m.key].vals, t.valores[m.key], modo === 'prev' && pt ? pt.valores[m.key] : null].filter(ok)
    return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null
  }
  /** Min-Max 0–100 sobre el grupo de comparación; en las métricas de "menos es mejor" se invierte (afuera = mejor). */
  const nv = (m: MetricaU, v: number | null | undefined): number => {
    const r = rango(m)
    if (!ok(v) || !r) return 0
    const n = r.max > r.min ? ((v - r.min) / (r.max - r.min)) * 100 : 50
    return m.menosEsMejor ? 100 - n : n
  }
  const refLbl = modo === 'prev' && pt ? `Anterior (${fdShort(pt.fecha)})` : modo === 'all' ? 'Media del plantel total' : `Media ${a.cat}`
  const curLbl = `Actual (${fdShort(t.fecha)})`
  const radarData = ejes.map((m) => ({
    k: m.key,
    label: `${m.label}${m.menosEsMejor ? ' ↓' : ''}`,
    ref: nv(m, modo === 'prev' && pt ? pt.valores[m.key] : statsPorEje[m.key].mean),
    cur: nv(m, t.valores[m.key]),
  }))

  // Tabla de Z-scores: métricas clave + asimetrías.
  const filas = [...ds.clave, ...ds.asimetrias.filter((m) => !m.clave)].filter((m) => ok(t.valores[m.key]))
  const zRows = filas.map((m) => {
    const s = stats(comp.map((x) => x.valores[m.key]))
    const v = t.valores[m.key]
    const prev = pt && ok(pt.valores[m.key]) ? pt.valores[m.key] : null
    return { m, v, prev, dl: prev !== null ? v - prev : null, z: zOf(v, s, m.menosEsMejor), p: pctOf(v, s, m.menosEsMejor) }
  })

  // Evolución longitudinal.
  const evoMet = ds.visibles.find((m) => m.key === evoKey) ?? ds.primaria ?? ds.visibles[0]
  const serie = evoMet ? a.tests.filter((x) => ok(x.valores[evoMet.key])).map((x) => ({ f: x.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' }), v: x.valores[evoMet.key] })) : []
  const mediaGrupo = evoMet ? stats(comp.map((x) => x.valores[evoMet.key])).mean : NaN

  const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '±')
  const stTxt = { g: 'Apto Competitivo', a: 'Precaución', r: 'Intervención Requerida' }[E.lvl]
  const primaria = ds.primaria
  const minis = ds.clave.filter((m) => !m.esAsim).slice(0, 4)

  return (
    <section className="view active" id="v-ind">
      <div className="ind">
        <div>
          <div className="card">
            {buscador}
            {listado}
            <div style={{ marginTop: 14 }}>
              <div className="profile">
                <div className="avatar">{initials(a.nombre)}</div>
                <div style={{ minWidth: 0 }}>
                  <h2>{a.nombre}</h2>
                  <div className="rn">{a.rosterName ? `Ficha antropométrica: ${a.rosterName}` : a.how === 'amb' ? 'Cruce ambiguo con ficha antropométrica' : a.how === 'meta' ? 'Peso tomado del archivo' : 'Sin ficha antropométrica'}</div>
                </div>
              </div>
              <div className="bio">
                <div><span>Categoría</span><b>{a.cat}</b></div>
                <div><span>Peso corporal</span><b>{a.bw ? `${fmt(a.bw, 1)} kg` : '—'}</b></div>
                <div><span>Fecha de test</span><b>{fdate(t.fecha)}</b></div>
                <div><span>Tests totales</span><b>{a.tests.length}</b></div>
              </div>
              <div className={`status ${E.lvl}`}>
                <div className="st">Estado clínico-funcional</div>
                <div className="sv"><Pill lvl={E.lvl}>{E.lvl === 'g' ? '●' : E.lvl === 'a' ? '▲' : '■'} {stTxt}</Pill></div>
                <ul>{(E.motivos.length ? E.motivos : ['Todas las métricas clave y las asimetrías dentro de rangos aceptables']).map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="minis">
            {minis.map((m) => {
              const s = stats(comp.map((x) => x.valores[m.key]))
              const z = zOf(t.valores[m.key], s, m.menosEsMejor)
              return (
                <div className="mini" key={m.key}>
                  <div className="lab">{m.label}</div>
                  <div className="val" style={{ color: zColor(z) }}>{fmt(t.valores[m.key], m.d)}<small>{m.unidad}</small></div>
                  <div className="foot">Z {fmt(z, 2)} · P{fmt(pctOf(t.valores[m.key], s, m.menosEsMejor), 0)}</div>
                </div>
              )
            })}
            {ds.asimetrias.length > 0 && E.asimMetrica && E.asimMax !== null && (
              <div className="mini">
                <div className="lab">Asimetría máx.</div>
                <div className="val" style={{ color: ASIM_COLOR[asymLvlGenerico(E.asimMax)] }}>{fmt(E.asimMax, 1)}<small>%</small></div>
                <div className="foot"><Pill lvl={asymLvlGenerico(E.asimMax) === 'n' ? 'n' : (asymLvlGenerico(E.asimMax) as 'g' | 'a' | 'r')}>{ASIM_TXT[asymLvlGenerico(E.asimMax)]}</Pill> {E.asimMetrica.label}</div>
              </div>
            )}
          </div>

          {/* Dos columnas: izquierda Radar + Evolución histórica (debajo del radar); derecha Z-scores + Diagnóstico */}
          <div className="grid g-2 mt" style={{ alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <h3>Radar de métricas clave (0–100)</h3>
                  <p className="hint">
                    {modo === 'prev' ? `Test actual vs. test anterior, normalizados sobre el rango de ${compLbl}.` : `Min-Max vs ${compLbl}.`} En las métricas marcadas con ↓ (menos es mejor) la escala está invertida: más afuera siempre es mejor.
                  </p>
                </div>
                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <select value={modo} onChange={(e) => setModoSel(e.target.value as Modo)} style={{ padding: '6px 10px' }}>
                    <option value="cat">vs. Media de su categoría</option>
                    <option value="all">vs. Media del plantel total</option>
                    <option value="prev" disabled={!pt}>vs. Su test anterior{pt ? ` (${fdShort(pt.fecha)})` : ' — sin evaluación previa'}</option>
                  </select>
                  {!pt && <span className="pill n">Sin evaluación previa registrada</span>}
                </div>
              </div>
              {ejes.length < 3 ? (
                <div className="empty">El radar necesita al menos 3 métricas clave ({ejes.length} disponible/s).</div>
              ) : (
                <div style={{ position: 'relative', height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="66%">
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="label" tick={<EjeRadar />} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const m = ejes.find((x) => x.key === payload[0].payload.k)
                        if (!m) return null
                        const src = modo === 'prev' && pt ? pt : null
                        const s = statsPorEje[m.key]
                        return <TipBox title={m.label} lines={[`${curLbl}: ${fmtV(t.valores[m.key], m)} · Z ${fmt(zOf(t.valores[m.key], s, m.menosEsMejor), 2)}`, `${refLbl}: ${fmtV(src ? src.valores[m.key] : s.mean, m)}`]} />
                      }} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11.5, fontWeight: 600, paddingTop: 8 }} />
                      <Radar animationDuration={500} name={refLbl} dataKey="ref" stroke="#475569" strokeWidth={1.75} strokeDasharray="6 4" fill="rgba(71,85,105,.10)" fillOpacity={1} isAnimationActive={!printing} dot={{ r: 4, fill: '#fff', stroke: '#475569', strokeWidth: 1.75 }} />
                      <Radar animationDuration={500} name={curLbl} dataKey="cur" stroke="#dc2626" strokeWidth={2.5} fill="rgba(220,38,38,.2)" fillOpacity={1} isAnimationActive={!printing} dot={{ r: 4.5, fill: '#dc2626', stroke: '#fff', strokeWidth: 1.5 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {modo === 'prev' && pt && primaria && ok(t.valores[primaria.key]) && ok(pt.valores[primaria.key]) && (() => {
                const dv = t.valores[primaria.key] - pt.valores[primaria.key]
                const dp = pt.valores[primaria.key] ? (dv / Math.abs(pt.valores[primaria.key])) * 100 : 0
                const bien = primaria.menosEsMejor ? dv <= 0 : dv >= 0
                return (
                  <div className="deltas">
                    <div className="dk">
                      <div className="lab">Δ {primaria.label}</div>
                      <div className="val" style={{ color: bien ? 'var(--g-tx)' : 'var(--r-tx)' }}>{sg(dv)}{fmt(Math.abs(dv), primaria.d)}<small>{primaria.unidad}</small></div>
                      <div className="foot">{sg(dp)}{fmt(Math.abs(dp), 1)} % · {fmt(pt.valores[primaria.key], primaria.d)} → {fmt(t.valores[primaria.key], primaria.d)}</div>
                    </div>
                    {ds.asimetrias[0] && ok(t.valores[ds.asimetrias[0].key]) && ok(pt.valores[ds.asimetrias[0].key]) && (() => {
                      const am = ds.asimetrias[0]
                      const da = t.valores[am.key] - pt.valores[am.key]
                      return (
                        <div className="dk">
                          <div className="lab">Δ {am.label}</div>
                          <div className="val" style={{ color: da <= 0 ? 'var(--g-tx)' : 'var(--r-tx)' }}>{sg(da)}{fmt(Math.abs(da), 1)}<small>pts</small></div>
                          <div className="foot">{da <= 0 ? 'Redujo' : 'Aumentó'} el desbalance · {fmt(pt.valores[am.key], 1)} % → {fmt(t.valores[am.key], 1)} %</div>
                        </div>
                      )
                    })()}
                    <div className="dk">
                      <div className="lab">Evaluación anterior</div>
                      <div className="val" style={{ fontSize: 18 }}>{fdShort(pt.fecha)}</div>
                      <div className="foot">{Math.round((t.fecha.getTime() - pt.fecha.getTime()) / 86400000)} días antes</div>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <h3>Gráfico evolutivo · historial del jugador</h3>
                  <p className="hint">
                    Curva de rendimiento a lo largo de las {a.tests.length} sesión{a.tests.length > 1 ? 'es' : ''} de {ds.config.nombre} de este jugador (eje X: fecha de cada evaluación). Línea punteada: media del grupo de comparación.
                    {a.tests.length < 2 ? ' Con una sola sesión no hay curva todavía: sumá una sesión nueva desde Datos & Calidad.' : ''}
                  </p>
                </div>
                <select className="no-print" value={evoMet?.key ?? ''} onChange={(e) => setEvoKey(e.target.value)} style={{ padding: '6px 10px' }}>
                  {ds.visibles.map((m) => <option key={m.key} value={m.key}>{m.label}{m.unidad ? ` (${m.unidad})` : ''}</option>)}
                </select>
              </div>
              <div style={{ position: 'relative', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="f" tick={{ fontSize: 11, fill: '#475569' }} padding={{ left: 16, right: 16 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#475569' }} width={52} tickFormatter={(v: number) => fmt(v, evoMet?.d ?? 1)} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length || !evoMet) return null
                      return <TipBox title={String(label)} lines={[`${evoMet.label}: ${fmtV(payload[0].payload.v as number, evoMet)}`]} />
                    }} />
                    {Number.isFinite(mediaGrupo) && <ReferenceLine y={mediaGrupo} stroke="#94a3b8" strokeDasharray="5 4" label={{ value: 'Media del grupo', position: 'insideTopLeft', fill: '#64748b', fontSize: 10 }} />}
                    <Line type="monotone" dataKey="v" name={evoMet?.label} stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4.5, fill: '#dc2626', stroke: '#fff', strokeWidth: 1.5 }} isAnimationActive={!printing} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card">
              <h3>Tabla de Z-Scores</h3>
              <p className="hint">Valor del atleta contra {compLbl}. Z: desvíos estándar respecto de la media (ajustado por el sentido de la métrica).{ds.asimetrias.length > 0 ? ` Las asimetrías llevan el semáforo clínico: < ${ASIM_VERDE} % verde, ${ASIM_VERDE}–${ASIM_ROJO} % amarillo, > ${ASIM_ROJO} % rojo.` : ''}</p>
              <div className="tbl" style={{ maxHeight: 420 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Métrica</th>
                      <th className="num">Actual</th>
                      {pt && <th className="num">Anterior</th>}
                      {pt && <th className="num">Δ</th>}
                      <th className="num">Z</th>
                      <th className="num">Pctl</th>
                      {ds.asimetrias.length > 0 && <th>Semáforo</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {zRows.map(({ m, v, prev, dl, z, p }) => (
                      <tr key={m.key}>
                        <td>{m.label}{m.menosEsMejor ? ' ↓' : ''}</td>
                        <td className="num">{fmtV(v, m)}</td>
                        {pt && <td className="num">{prev !== null ? fmtV(prev, m) : '—'}</td>}
                        {pt && <td className="num" style={{ color: dl === null || dl === 0 ? undefined : (m.menosEsMejor ? dl < 0 : dl > 0) ? 'var(--g-tx)' : 'var(--r-tx)' }}>{dl === null ? '—' : `${sg(dl)}${fmt(Math.abs(dl), m.d)}`}</td>}
                        <td className="num" style={{ color: zColor(z), fontWeight: 700 }}>{fmt(z, 2)}</td>
                        <td className="num">{p === null ? '—' : `P${fmt(p, 0)}`}</td>
                        {ds.asimetrias.length > 0 && <td>{m.esAsim ? <Pill lvl={asymLvlGenerico(v) === 'n' ? 'n' : (asymLvlGenerico(v) as 'g' | 'a' | 'r')}>{ASIM_TXT[asymLvlGenerico(v)]}</Pill> : ''}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <h3>Diagnóstico & Plan de acción individual</h3>
              <p className="hint">Lectura automática a partir de Z-score, asimetrías y tendencia. Validar con el cuerpo técnico.</p>
              <div className="rx">
                <div className="box">
                  <h4>Lectura de rendimiento</h4>
                  <ul>
                    {zRows.filter((r) => !r.m.esAsim && r.z !== null).sort((x, y) => (x.z as number) - (y.z as number)).slice(0, 3).map((r) => (
                      <li key={r.m.key}><b>{r.m.label}</b>: {fmtV(r.v, r.m)} (Z {fmt(r.z, 2)}) — {(r.z as number) <= -1 ? 'por debajo de su grupo: priorizar en el próximo bloque.' : (r.z as number) >= 1 ? 'fortaleza respecto de su grupo.' : 'dentro de lo esperado.'}</li>
                    ))}
                    {E.delta !== null && primaria && E.prev && <li>Evolución vs {fdate(E.prev.fecha)}: <b>{E.delta >= 0 ? '+' : ''}{fmt(E.delta, 1)} %</b> en {primaria.label}{E.delta <= -8 ? ' — revisar carga acumulada / fatiga y el protocolo del test.' : '.'}</li>}
                  </ul>
                </div>
                <div className="box">
                  <h4>Preventivo / Kinesiología</h4>
                  <ul>
                    {ds.asimetrias.length === 0 ? (
                      <li>Este test no trae métricas de asimetría: no aplica el semáforo lateral.</li>
                    ) : E.asimMax !== null && E.asimMax > ASIM_ROJO ? (
                      <li><b>Derivar a Kinesiología</b>: {E.asimMetrica?.label} con {fmt(E.asimMax, 1)} % de diferencia entre lados. Descartar antecedente de lesión y controlar la exposición a esfuerzos máximos hasta bajar de {ASIM_ROJO} %.</li>
                    ) : E.asimMax !== null && E.asimMax >= ASIM_VERDE ? (
                      <li><b>Zona amarilla</b> ({fmt(E.asimMax, 1)} % en {E.asimMetrica?.label}): sumar trabajo unilateral del lado débil y re-testear en 3–4 semanas.</li>
                    ) : (
                      <li><b>Simetría aceptable</b> (máx. {fmt(E.asimMax, 1)} % &lt; {ASIM_VERDE} %): sostener el programa preventivo general.</li>
                    )}
                    {!a.bw && <li>Cargar el peso corporal en la ficha antropométrica para habilitar las métricas relativas al peso.</li>}
                  </ul>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
