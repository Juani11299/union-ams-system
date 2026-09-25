import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { fdShort, MONTHS } from '@/features/nordbord/calculations'
import { zColor } from '@/features/nordbord/format'
import { ICON, TipBox } from '@/features/nordbord/ui'
import { ASIM_COLOR, ASIM_ROJO, ASIM_TXT, ASIM_VERDE, asymLvlGenerico } from './semaforo'
import { enrichU, estadoU, fmt, fmtV, LVL_COLOR_U, monthKey, ok, ordenarMejorPrimero, poolU, prevU, stats } from './calculos'
import type { CatRefU, DatasetU, MetricaU, RegistroU, RowU, Ventana } from './tipos'

interface Props {
  ds: DatasetU
  win: Ventana
  cat: string
  met: MetricaU
  catRef: CatRefU
  winLabel: string
  printing: boolean
  openAthlete: (key: string) => void
}

const EJE = { fontSize: 11, fill: '#475569' }
const GRID = '#e2e8f0'

/** Informe Grupal — KPIs, distribución con Z-score, dispersión entre métricas clave, semáforo de asimetrías, evolución colectiva y rankings. */
export function GrupalTab({ ds, win, cat, met, catRef, winLabel, printing, openAthlete }: Props) {
  const pool = useMemo(() => poolU(ds, win, cat), [ds, win, cat])
  const { rows, s } = useMemo(() => enrichU(pool, met), [pool, met])
  const estados = useMemo(() => pool.map((t) => ({ t, e: estadoU(t, ds, catRef) })), [pool, ds, catRef])

  if (!pool.length) {
    return (
      <section className="view active" id="v-group">
        <div className="card empty">Sin evaluaciones para este filtro.</div>
      </section>
    )
  }

  const ordenadas = ordenarMejorPrimero(rows, met)
  const mejor = ordenadas[0]
  const cvTxt = s.cv < 10 ? 'Grupo homogéneo' : s.cv < 20 ? 'Variabilidad moderada' : 'Alta heterogeneidad'
  const rojos = estados.filter((x) => x.e.lvl === 'r').length
  const ambar = estados.filter((x) => x.e.lvl === 'a').length
  const verdes = estados.length - rojos - ambar
  const sinDato = pool.length - rows.length

  return (
    <section className="view active" id="v-group">
      <div className="grid g-kpi">
        <div className="card kpi">
          <div className="accent">{ICON.users}</div>
          <div className="lab">Total evaluados</div>
          <div className="val">{pool.length}</div>
          <div className="foot">
            {rows.length} con dato de {met.label.toLowerCase()}
            {sinDato > 0 && <> · <b>{sinDato}</b> sin dato</>}
          </div>
        </div>
        <div className="card kpi">
          <div className="accent">{ICON.avg}</div>
          <div className="lab">Media del plantel</div>
          <div className="val">{fmt(s.mean, met.d)}<small>{met.unidad}</small></div>
          <div className="foot">± {fmt(s.sd, met.d)} DE · rango {fmt(s.min, met.d)}–{fmt(s.max, met.d)}</div>
        </div>
        <div className="card kpi">
          <div className="accent">{ICON.top}</div>
          <div className="lab">Mejor registro</div>
          <div className="val">{mejor ? fmt(mejor.v, met.d) : '—'}<small>{met.unidad}</small></div>
          <div className="foot">{mejor && <><b>{mejor.t.ath.nombre}</b> · {mejor.t.ath.cat} · Z {fmt(mejor.z, 2)}</>}</div>
        </div>
        <div className="card kpi">
          <div className="accent">{ICON.cv}</div>
          <div className="lab">Coef. de variación</div>
          <div className="val">{fmt(s.cv, 1)}<small>%</small></div>
          <div className="foot">{cvTxt}</div>
        </div>
        <div className={`card kpi ${rojos ? 'flag' : ''}`}>
          <div className="accent">{ICON.flag}</div>
          <div className="lab">Atletas en zona roja</div>
          <div className="val">{rojos}<small>/ {pool.length}</small></div>
          <div className="foot">Asimetría &gt; {ASIM_ROJO} %, déficit severo o caída ≥ 15 %</div>
          <div className="tl">
            <span style={{ color: 'var(--g-tx)' }}><i style={{ background: LVL_COLOR_U.g }} />{verdes}</span>
            <span style={{ color: 'var(--a-tx)' }}><i style={{ background: LVL_COLOR_U.a }} />{ambar}</span>
            <span style={{ color: 'var(--r-tx)' }}><i style={{ background: LVL_COLOR_U.r }} />{rojos}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>estado</span>
          </div>
        </div>
      </div>

      <Insights ds={ds} met={met} rows={rows} s={s} estados={estados} />

      <div className="grid g-32 mt">
        <DistCard ordenadas={ordenadas} s={s} met={met} printing={printing} openAthlete={openAthlete} />
        <DispersionCard ds={ds} pool={pool} estados={estados} printing={printing} openAthlete={openAthlete} />
      </div>

      {ds.asimetrias.length > 0 && <AsimCard ds={ds} pool={pool} printing={printing} openAthlete={openAthlete} />}

      <EvoCard ds={ds} pool={pool} winLabel={winLabel} printing={printing} openAthlete={openAthlete} metInicial={met} />

      <div className="card mt">
        <h3>Cuadrante de Rankings · {met.label}</h3>
        <p className="hint">Click en un atleta para abrir su ficha individual.</p>
        <div className="rank-grid" style={{ gridTemplateColumns: ds.asimetrias.length ? undefined : 'repeat(2,minmax(0,1fr))' }}>
          <RankLista titulo="Top 5" color="#10b981" rows={ordenadas.slice(0, 5)} met={met} openAthlete={openAthlete} />
          <RankLista titulo="Bottom 5 · zona de intervención" color="#f97316" rows={ordenadas.slice(-5).reverse()} met={met} openAthlete={openAthlete} />
          {ds.asimetrias.length > 0 && <RankAsim ds={ds} pool={pool} openAthlete={openAthlete} />}
        </div>
      </div>
    </section>
  )
}

function RankLista({ titulo, color, rows, met, openAthlete }: { titulo: string; color: string; rows: RowU[]; met: MetricaU; openAthlete: (k: string) => void }) {
  const mx = Math.max(...rows.map((r) => Math.abs(r.v)), 1)
  return (
    <div className="rank">
      <h4><span className="dot" style={{ background: color }} />{titulo}</h4>
      {rows.map((r, i) => (
        <div className="ritem" key={r.t.key} onClick={() => openAthlete(r.t.key)}>
          <span className="n">{i + 1}</span>
          <span className="nm">{r.t.ath.nombre}<small>{r.t.ath.cat}</small></span>
          <span className="v">{fmt(r.v, met.d)}</span>
          <div className="bar"><span style={{ width: `${Math.max(3, (Math.abs(r.v) / mx) * 100)}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  )
}

function RankAsim({ ds, pool, openAthlete }: { ds: DatasetU; pool: RegistroU[]; openAthlete: (k: string) => void }) {
  const m = ds.asimetrias[0]
  const top = pool.filter((t) => ok(t.valores[m.key])).sort((a, b) => b.valores[m.key] - a.valores[m.key]).slice(0, 5)
  const mx = top[0]?.valores[m.key] || 1
  return (
    <div className="rank">
      <h4><span className="dot" style={{ background: '#ef4444' }} />Top 5 asimetría · {m.label}</h4>
      {top.map((t, i) => (
        <div className="ritem" key={t.key} onClick={() => openAthlete(t.key)}>
          <span className="n">{i + 1}</span>
          <span className="nm">{t.ath.nombre}<small>{t.ath.cat}</small></span>
          <span className="v">{fmt(t.valores[m.key], 1)} %</span>
          <div className="bar"><span style={{ width: `${Math.max(3, (t.valores[m.key] / mx) * 100)}%`, background: ASIM_COLOR[asymLvlGenerico(t.valores[m.key])] }} /></div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Resumen ejecutivo automático (genérico: itera sobre las métricas clave)
// ─────────────────────────────────────────────────────────────────────────────
function Insights({ ds, met, rows, s, estados }: { ds: DatasetU; met: MetricaU; rows: RowU[]; s: ReturnType<typeof stats>; estados: Array<{ t: RegistroU; e: ReturnType<typeof estadoU> }> }) {
  const cvTxt = s.cv < 10 ? 'baja (grupo homogéneo — admite prescripción grupal)' : s.cv < 20 ? 'moderada (conviene agrupar por niveles)' : 'alta (requiere individualizar la carga)'
  const rojos = estados.filter((x) => x.e.lvl === 'r')
  const ambar = estados.filter((x) => x.e.lvl === 'a')
  const bajos = rows.filter((r) => r.z !== null && r.z <= -1).sort((a, b) => (a.z as number) - (b.z as number))
  const asimRojos = estados.filter((x) => x.e.asimMax !== null && asymLvlGenerico(x.e.asimMax) === 'r')
  const asimAmbar = estados.filter((x) => x.e.asimMax !== null && asymLvlGenerico(x.e.asimMax) === 'a')
  const deltas = stats(estados.map((x) => x.e.delta))
  const nom = (a: Array<{ t: RegistroU }>) => a.slice(0, 4).map((x) => x.t.ath.nombre).join(', ') + (a.length > 4 ? ` y ${a.length - 4} más` : '')

  const acciones: React.ReactNode[] = []
  if (asimRojos.length) acciones.push(<><b>Trabajo unilateral correctivo</b> para {asimRojos.length} atleta{asimRojos.length > 1 ? 's' : ''} con asimetría &gt; {ASIM_ROJO} % ({nom(asimRojos)}). Re-test en 3–4 semanas.</>)
  if (bajos.length) acciones.push(<><b>Bloque específico de {met.label.toLowerCase()}</b> para {bajos.length} atleta{bajos.length > 1 ? 's' : ''} ≥ 1 DE por debajo de la media ({bajos.slice(0, 4).map((r) => r.t.ath.nombre).join(', ')}{bajos.length > 4 ? '…' : ''}).</>)
  if (asimAmbar.length) acciones.push(<><b>Monitoreo de {asimAmbar.length} atleta{asimAmbar.length > 1 ? 's' : ''} en zona amarilla</b> ({ASIM_VERDE}–{ASIM_ROJO} %): incluir una serie extra unilateral del lado débil.</>)
  acciones.push(s.cv >= 20 ? <><b>Individualizar la dosis</b>: la variabilidad del grupo (CV {fmt(s.cv, 1)} %) desaconseja una única prescripción; armar niveles según terciles.</> : <><b>Prescripción grupal</b>: el grupo es homogéneo (CV {fmt(s.cv, 1)} %), se puede trabajar en bloque con ajustes puntuales.</>)
  if (acciones.length < 3) acciones.push(<><b>Re-evaluación</b> en 4–6 semanas con el mismo protocolo, dispositivo y horario para cuantificar la respuesta.</>)

  return (
    <div className="card insight mt">
      <span className="tag">{ICON.spark} Resumen ejecutivo automático</span>
      <p>
        {ds.config.nombre} · {estados.length} atletas evaluados y {ds.clave.length} métrica{ds.clave.length === 1 ? '' : 's'} clave ({ds.clave.map((m) => m.label).join(', ')}). En <b>{met.label}</b> la media es <b>{fmtV(s.mean, met)}</b> con un CV de <b>{fmt(s.cv, 1)} %</b>, {cvTxt}.
        {deltas.n >= 3 && ds.primaria && <> Frente a la evaluación previa ({deltas.n} atletas con re-test), {ds.primaria.label} varió <b>{deltas.mean >= 0 ? '+' : ''}{fmt(deltas.mean, 1)} %</b> en promedio.</>}
      </p>
      <p>
        Estado del plantel: <b style={{ color: '#10b981' }}>{estados.length - rojos.length - ambar.length}</b> disponibles, <b style={{ color: '#f59e0b' }}>{ambar.length}</b> en observación y <b style={{ color: '#ef4444' }}>{rojos.length}</b> en zona de intervención.
        {ds.asimetrias.length > 0 && <> Asimetrías (semáforo &lt; {ASIM_VERDE} % · {ASIM_VERDE}–{ASIM_ROJO} % · &gt; {ASIM_ROJO} %): <b style={{ color: '#f59e0b' }}>{asimAmbar.length}</b> en amarillo y <b style={{ color: '#ef4444' }}>{asimRojos.length}</b> en rojo.</>}
      </p>
      <div className="actions">
        {acciones.slice(0, 3).map((a, i) => (
          <div className="action" key={i}>
            <span className="num">Acción prioritaria {i + 1}</span>
            {a}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Distribución & Z-Score
// ─────────────────────────────────────────────────────────────────────────────
function DistCard({ ordenadas, s, met, printing, openAthlete }: { ordenadas: RowU[]; s: ReturnType<typeof stats>; met: MetricaU; printing: boolean; openAthlete: (k: string) => void }) {
  const h = Math.max(260, ordenadas.length * 19 + 50)
  const datos = ordenadas.map((r) => ({ name: r.t.ath.nombre, v: r.v, r }))
  return (
    <div className="card">
      <h3>Distribución & Z-Score · {met.label}</h3>
      <p className="hint">
        Ordenado del mejor al peor desempeño{met.menosEsMejor ? ' (menos es mejor, Z invertido)' : ''}. Media <b>{fmtV(s.mean, met)}</b>, DE {fmt(s.sd, met.d)}.
      </p>
      <div className="legend">
        <span><i style={{ background: 'var(--green)' }} />Z ≥ +1 DE</span>
        <span><i style={{ background: 'var(--blue)' }} />En la media (−1 a +1)</span>
        <span><i style={{ background: 'var(--orange)' }} />−1 a −2 DE</span>
        <span><i style={{ background: 'var(--red)' }} />≤ −2 DE</span>
        <span><i style={{ background: '#0f172a', height: 2, width: 14, borderRadius: 0 }} />Media (Z = 0)</span>
      </div>
      <div className="scroll">
        <div style={{ position: 'relative', height: h }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} layout="vertical" margin={{ top: 18, right: 24, left: 4, bottom: 0 }} barCategoryGap="12%">
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" orientation="top" tick={EJE} domain={[0, 'auto']} label={{ value: `${met.label}${met.unidad ? ` (${met.unidad})` : ''}`, position: 'insideTop', offset: -16, fill: '#475569', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 10.5, fill: '#1e293b' }} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,.15)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const r = payload[0].payload.r as RowU
                  return <TipBox title={`${r.t.ath.nombre} · ${r.t.ath.cat}`} lines={[`Valor: ${fmtV(r.v, met)}`, `Z-score: ${fmt(r.z, 2)}`, `Percentil: P${fmt(r.p, 0)}`, `Normalizado (0–100): ${fmt(r.n, 0)}`, `Test: ${fdShort(r.t.fecha)}`]} />
                }}
              />
              <ReferenceLine x={s.mean} stroke="#0f172a" strokeWidth={2} />
              <ReferenceLine x={s.mean + s.sd} stroke="#475569" strokeDasharray="4 4" />
              <ReferenceLine x={s.mean - s.sd} stroke="#475569" strokeDasharray="4 4" />
              <Bar dataKey="v" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(ordenadas[i].t.key)}>
                {datos.map((d) => <Cell key={d.r.t.key} fill={zColor(d.r.z)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispersión entre dos métricas clave
// ─────────────────────────────────────────────────────────────────────────────
function DispersionCard({ ds, pool, estados, printing, openAthlete }: { ds: DatasetU; pool: RegistroU[]; estados: Array<{ t: RegistroU; e: ReturnType<typeof estadoU> }>; printing: boolean; openAthlete: (k: string) => void }) {
  const opciones = ds.visibles
  const [xk, setXk] = useState(ds.clave[0]?.key ?? opciones[0]?.key ?? '')
  const [yk, setYk] = useState(ds.clave[1]?.key ?? ds.asimetrias[0]?.key ?? opciones[1]?.key ?? '')
  const mx = opciones.find((m) => m.key === xk)
  const my = opciones.find((m) => m.key === yk)
  const lvlDe = new Map(estados.map((x) => [x.t.key, x.e.lvl]))
  const pts = mx && my ? pool.filter((t) => ok(t.valores[mx.key]) && ok(t.valores[my.key])).map((t) => ({ x: t.valores[mx.key], y: t.valores[my.key], t })) : []
  const sx = stats(pts.map((p) => p.x))
  const sy = stats(pts.map((p) => p.y))
  const pad = (mn: number, mxv: number) => (mxv - mn || Math.abs(mxv) || 1) * 0.06
  const xd: [number, number] = [sx.min - pad(sx.min, sx.max), sx.max + pad(sx.min, sx.max)]
  const yd: [number, number] = [sy.min - pad(sy.min, sy.max), sy.max + pad(sy.min, sy.max)]

  const sel = (valor: string, set: (v: string) => void, t: string) => (
    <label className="f" style={{ minWidth: 0, flex: 1 }}>
      <label>{t}</label>
      <select value={valor} onChange={(e) => set(e.target.value)}>
        {opciones.map((m) => <option key={m.key} value={m.key}>{m.label}{m.unidad ? ` [${m.unidad}]` : ''}</option>)}
      </select>
    </label>
  )

  return (
    <div className="card">
      <h3>Dispersión de métricas clave</h3>
      <p className="hint">Cada punto es un atleta (color = estado funcional). Las líneas marcan la media del grupo: sirven para ubicar quién está bien en las dos métricas, en una sola o en ninguna.</p>
      <div className="filters" style={{ padding: '0 0 10px' }}>{sel(xk, setXk, 'Eje X')}{sel(yk, setYk, 'Eje Y')}</div>
      {mx && my && pts.length >= 2 ? (
        <div style={{ position: 'relative', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 22 }}>
              <CartesianGrid stroke={GRID} />
              <ReferenceArea x1={mx.menosEsMejor ? xd[0] : sx.mean} x2={mx.menosEsMejor ? sx.mean : xd[1]} y1={my.menosEsMejor ? yd[0] : sy.mean} y2={my.menosEsMejor ? sy.mean : yd[1]} fill="rgba(16,185,129,.08)" stroke="none" />
              <ReferenceArea x1={mx.menosEsMejor ? sx.mean : xd[0]} x2={mx.menosEsMejor ? xd[1] : sx.mean} y1={my.menosEsMejor ? sy.mean : yd[0]} y2={my.menosEsMejor ? yd[1] : sy.mean} fill="rgba(239,68,68,.08)" stroke="none" />
              <ReferenceLine x={sx.mean} stroke="#475569" strokeDasharray="5 4" />
              <ReferenceLine y={sy.mean} stroke="#475569" strokeDasharray="5 4" />
              <XAxis type="number" dataKey="x" domain={xd} allowDataOverflow tickCount={6} tickFormatter={(v: number) => fmt(v, mx.d)} tick={EJE} label={{ value: `${mx.label}${mx.unidad ? ` (${mx.unidad})` : ''}${mx.menosEsMejor ? ' — menos es mejor' : ''}`, position: 'insideBottom', offset: -14, fill: '#475569', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" domain={yd} allowDataOverflow tickCount={6} tickFormatter={(v: number) => fmt(v, my.d)} tick={EJE} width={56} label={{ value: `${my.label}${my.unidad ? ` (${my.unidad})` : ''}${my.menosEsMejor ? ' — menos es mejor' : ''}`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as { x: number; y: number; t: RegistroU }
                  return <TipBox title={`${p.t.ath.nombre} · ${p.t.ath.cat}`} lines={[`${mx.label}: ${fmtV(p.x, mx)}`, `${my.label}: ${fmtV(p.y, my)}`]} />
                }}
              />
              <Scatter data={pts} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(pts[i].t.key)}>
                {pts.map((p) => <Cell key={p.t.key} fill={LVL_COLOR_U[lvlDe.get(p.t.key) ?? 'g']} stroke="#fff" strokeWidth={1.5} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty">Elegí dos métricas con datos en común para ver la dispersión.</div>
      )}
      <div className="note">Verde: cuadrante favorable en las dos métricas · rojo: desfavorable en las dos. El color de cada punto es el estado del atleta (verde / amarillo / rojo).</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Semáforo de asimetrías — sólo si el test trae métricas de asimetría
// ─────────────────────────────────────────────────────────────────────────────
function AsimCard({ ds, pool, printing, openAthlete }: { ds: DatasetU; pool: RegistroU[]; printing: boolean; openAthlete: (k: string) => void }) {
  const [ak, setAk] = useState(ds.asimetrias[0].key)
  const m = ds.asimetrias.find((x) => x.key === ak) ?? ds.asimetrias[0]
  const datos = pool.filter((t) => ok(t.valores[m.key])).map((t) => ({ name: t.ath.nombre, v: t.valores[m.key], t })).sort((a, b) => b.v - a.v)
  const cnt = { g: 0, a: 0, r: 0 }
  datos.forEach((d) => { const l = asymLvlGenerico(d.v); if (l !== 'n') cnt[l]++ })
  return (
    <div className="card mt">
      <div className="evo-head">
        <div>
          <h3>Semáforo de asimetrías · {m.label}</h3>
          <p className="hint">Valor absoluto del % de diferencia entre lados. Verde &lt; {ASIM_VERDE} % · Amarillo {ASIM_VERDE}–{ASIM_ROJO} % · Rojo &gt; {ASIM_ROJO} %.</p>
        </div>
        {ds.asimetrias.length > 1 && (
          <div className="evo-ctl no-print">
            <select value={m.key} onChange={(e) => setAk(e.target.value)} style={{ padding: '7px 10px' }}>
              {ds.asimetrias.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--green)' }} />{cnt.g} aceptables</span>
        <span><i style={{ background: 'var(--amber)' }} />{cnt.a} en precaución</span>
        <span><i style={{ background: 'var(--red)' }} />{cnt.r} en alerta médica</span>
      </div>
      <div className="hscroll">
        <div style={{ position: 'relative', height: 320, width: printing ? '100%' : `max(100%, ${datos.length * 20}px)` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 22, right: 12, left: 0, bottom: 4 }} barCategoryGap="20%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" interval={0} angle={-58} textAnchor="end" height={96} tick={{ fontSize: 10, fill: '#1e293b' }} />
              <YAxis tick={EJE} width={44} unit="%" />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,.15)' }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as { v: number; t: RegistroU }
                return <TipBox title={`${d.t.ath.nombre} · ${d.t.ath.cat}`} lines={[`${m.label}: ${fmt(d.v, 1)} %`, `Semáforo: ${ASIM_TXT[asymLvlGenerico(d.v)]}`]} />
              }} />
              <ReferenceLine y={ASIM_VERDE} stroke="#f59e0b" strokeDasharray="5 4" label={{ value: `${ASIM_VERDE} %`, position: 'insideTopLeft', fill: '#b45309', fontSize: 10, fontWeight: 700 }} />
              <ReferenceLine y={ASIM_ROJO} stroke="#ef4444" strokeDasharray="5 4" label={{ value: `${ASIM_ROJO} %`, position: 'insideTopLeft', fill: '#b91c1c', fontSize: 10, fontWeight: 700 }} />
              <Bar dataKey="v" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(datos[i].t.key)}>
                {datos.map((d) => <Cell key={d.t.key} fill={ASIM_COLOR[asymLvlGenerico(d.v)]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Evolución colectiva: evaluación actual vs. anterior
// ─────────────────────────────────────────────────────────────────────────────
function EvoCard({ ds, pool, winLabel, printing, openAthlete, metInicial }: { ds: DatasetU; pool: RegistroU[]; winLabel: string; printing: boolean; openAthlete: (k: string) => void; metInicial: MetricaU }) {
  const opciones = ds.visibles.filter((m) => m.clave || m.esAsim)
  const [ek, setEk] = useState(metInicial.key)
  const [mode, setMode] = useState<'grouped' | 'delta'>('grouped')
  const m = opciones.find((x) => x.key === ek) ?? opciones[0] ?? metInicial
  const inv = m.menosEsMejor

  const conPrev = pool.map((t) => ({ t, p: prevU(t) })).filter((x): x is { t: RegistroU; p: RegistroU } => x.p !== null)
  const pares = conPrev.filter((x) => ok(x.t.valores[m.key]) && ok(x.p.valores[m.key])).map((x) => ({ ...x, cur: x.t.valores[m.key], prv: x.p.valores[m.key], dl: x.t.valores[m.key] - x.p.valores[m.key] }))
  const mejoro = (x: { dl: number }) => (inv ? x.dl < 0 : x.dl > 0)
  const unit = (v: number) => fmtV(v, m)
  const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '±')

  const pm: Record<string, number> = {}
  conPrev.forEach((x) => { const k = monthKey(x.p.fecha); pm[k] = (pm[k] || 0) + 1 })
  const pms = Object.entries(pm).sort((a, b) => b[1] - a[1]).map(([k, c]) => { const [y, mo] = k.split('-'); return { l: `${MONTHS[+mo - 1]} ${y}`, c } })

  const controles = (
    <div className="evo-ctl no-print">
      <select value={m.key} onChange={(e) => setEk(e.target.value)} style={{ padding: '7px 10px' }}>
        {opciones.map((x) => <option key={x.key} value={x.key}>{x.label}{x.unidad ? ` (${x.unidad})` : ''}</option>)}
      </select>
      <div className="seg sm">
        <button className={mode === 'grouped' ? 'on' : ''} onClick={() => setMode('grouped')}>Barras agrupadas</button>
        <button className={mode === 'delta' ? 'on' : ''} onClick={() => setMode('delta')}>Δ Diferencia</button>
      </div>
    </div>
  )

  if (!pares.length) {
    return (
      <div className="card mt">
        <div className="evo-head">
          <div>
            <h3>Evolución Colectiva: Evaluación Actual vs. Evaluación Anterior</h3>
            <p className="hint">Ningún jugador del filtro tiene una evaluación anterior registrada para esta métrica.</p>
          </div>
          {controles}
        </div>
      </div>
    )
  }

  const n = pares.length
  const imp = pares.filter(mejoro).length
  const mPrv = pares.reduce((a, x) => a + x.prv, 0) / n
  const mCur = pares.reduce((a, x) => a + x.cur, 0) / n
  const mDl = mCur - mPrv
  const mPct = mPrv ? (mDl / mPrv) * 100 : 0
  const good = inv ? mDl <= 0 : mDl >= 0
  const sorted = [...pares].sort((x, y) => (inv ? x.dl - y.dl : y.dl - x.dl))
  const grouped = mode === 'grouped'
  const colCur = sorted.map((x) => (mejoro(x) ? '#10b981' : x.dl === 0 ? '#94a3b8' : '#ef4444'))
  const datos = sorted.map((x, i) => ({ name: x.t.ath.nombre, prv: x.prv, cur: x.cur, dl: x.dl, x, col: colCur[i] }))
  const pDates = [...new Set(sorted.map((x) => fdShort(x.p.fecha)))]

  return (
    <div className="card mt">
      <div className="evo-head">
        <div>
          <h3>Evolución Colectiva: Evaluación Actual vs. Evaluación Anterior</h3>
          <p className="hint">
            <b>{winLabel} vs. {pms[0].l}</b>{pms.length > 1 && <> (y {pms.slice(1).map((p) => `${p.c} de ${p.l}`).join(', ')})</>} · {m.label}{m.unidad ? ` (${m.unidad})` : ''} · {pares.length} de {pool.length} jugadores con ambos tests. Click en una barra para abrir la ficha.
          </p>
        </div>
        {controles}
      </div>
      <div className="evo-kpis">
        <div className="dk">
          <div className="lab">% del plantel que mejoró</div>
          <div className="val" style={{ color: imp / n >= 0.5 ? 'var(--g-tx)' : 'var(--r-tx)' }}>{fmt((imp / n) * 100, 0)}<small>%</small></div>
          <div className="foot"><b>{imp} de {n}</b> jugadores mejoraron su {m.label.toLowerCase()}</div>
        </div>
        <div className="dk">
          <div className="lab">Variación media del grupo</div>
          <div className="val" style={{ color: good ? 'var(--g-tx)' : 'var(--r-tx)' }}>{sg(mDl)}{fmt(Math.abs(mDl), m.d)}<small>{m.unidad === '%' ? 'pts' : m.unidad}</small></div>
          <div className="foot">{sg(mPct)}{fmt(Math.abs(mPct), 1)} % · media {unit(mPrv)} → {unit(mCur)}</div>
        </div>
        <div className="dk">
          <div className="lab">Jugadores comparados</div>
          <div className="val">{n}<small>/ {pool.length}</small></div>
          <div className="foot">con evaluación previa separada ≥ 14 días</div>
        </div>
      </div>
      <div className="legend">
        {grouped ? (
          <>
            <span><i style={{ background: '#94a3b8' }} />Test anterior{pDates.length === 1 ? ` (${pDates[0]})` : ''}</span>
            <span><i style={{ background: '#10b981' }} />Test actual · mejoró</span>
            <span><i style={{ background: '#ef4444' }} />Test actual · empeoró</span>
          </>
        ) : (
          <>
            <span><i style={{ background: '#10b981' }} />Mejoró</span>
            <span><i style={{ background: '#ef4444' }} />Empeoró</span>
            <span><i style={{ background: '#0f172a', height: 2, width: 14, borderRadius: 0 }} />Δ medio del grupo</span>
          </>
        )}
      </div>
      <div className="hscroll">
        <div style={{ position: 'relative', height: 340, width: printing ? '100%' : `max(100%, ${n * (grouped ? 30 : 20)}px)` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 22, right: 12, left: 0, bottom: 4 }} barCategoryGap="20%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" interval={0} angle={-58} textAnchor="end" height={96} tick={{ fontSize: 10, fill: '#1e293b' }} />
              <YAxis tick={EJE} width={52} domain={grouped ? [0, 'auto'] : ['auto', 'auto']} />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,.15)' }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const x = payload[0].payload.x as (typeof pares)[number]
                const pc = x.prv ? (x.dl / x.prv) * 100 : 0
                return <TipBox title={`${x.t.ath.nombre} · ${x.t.ath.cat}`} lines={[`Anterior (${fdShort(x.p.fecha)}): ${unit(x.prv)}`, `Actual (${fdShort(x.t.fecha)}): ${unit(x.cur)}`, `Δ ${sg(x.dl)}${fmt(Math.abs(x.dl), m.d)} (${sg(pc)}${fmt(Math.abs(pc), 1)} %) · ${mejoro(x) ? 'mejoró' : x.dl === 0 ? 'sin cambios' : 'empeoró'}`]} />
              }} />
              {grouped ? (
                <>
                  <ReferenceLine y={mPrv} stroke="#64748b" strokeDasharray="5 4" label={{ value: `Media anterior ${unit(mPrv)}`, position: 'insideTopLeft', fill: '#64748b', fontSize: 10.5, fontWeight: 700 }} />
                  <ReferenceLine y={mCur} stroke="#0f172a" strokeWidth={2} label={{ value: `Media actual ${unit(mCur)}`, position: 'insideBottomLeft', fill: '#0f172a', fontSize: 10.5, fontWeight: 700 }} />
                  <Bar dataKey="prv" fill="#94a3b8" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(sorted[i].t.key)} />
                  <Bar dataKey="cur" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(sorted[i].t.key)}>
                    {datos.map((d) => <Cell key={d.x.t.key} fill={d.col} />)}
                  </Bar>
                </>
              ) : (
                <>
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <ReferenceLine y={mDl} stroke="#0f172a" strokeWidth={2} strokeDasharray="6 4" label={{ value: `Δ medio ${sg(mDl)}${fmt(Math.abs(mDl), m.d)}`, position: 'insideTopLeft', fill: '#0f172a', fontSize: 10.5, fontWeight: 700 }} />
                  <Bar dataKey="dl" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(sorted[i].t.key)}>
                    {datos.map((d) => <Cell key={d.x.t.key} fill={d.col} />)}
                  </Bar>
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
