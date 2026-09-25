import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ASYM_A, ASYM_R, C, L_COL, LVL_COLOR, M, PILLARS, R_COL, RISK_N } from './constants'
import { asymLvl, asymTxt, fdate, fdShort, fmt, initials, norm, ok, pctOf, poolFor, prevTest, sideName, statusOf, stats, zOf } from './calculations'
import { asymColor, zColor } from './format'
import { fmtM, Pill, TipBox } from './ui'
import type { CatRef, Dataset, NbTest, PillarKey, Ventana } from './types'

interface Props {
  data: Dataset
  win: Ventana
  cat: string
  pos: string
  catRef: CatRef
  sel: string | null
  onSel: (k: string) => void
  printing: boolean
}

const PILAR_M: Record<PillarKey, { d: number; u: string }> = {
  forceMean: M.forceMean, forceRel: M.forceRel, torqueRel: M.torqueRel, weakF: M.weakF, avgForce: M.avgForce, sym: { d: 0, u: '' },
}

/** Tick del radar con el nombre del eje en dos líneas (igual que el HTML). */
function AngleTick(props: { x?: number; y?: number; textAnchor?: 'start' | 'middle' | 'end' | 'inherit'; payload?: { index?: number } }) {
  const { x = 0, y = 0, textAnchor = 'middle', payload } = props
  const lab = PILLARS[payload?.index ?? 0]?.label ?? ['', '']
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={11} fontWeight={600} fill="#1e293b">
      <tspan x={x} dy="-0.2em">{lab[0]}</tspan>
      <tspan x={x} dy="1.15em">{lab[1]}</tspan>
    </text>
  )
}

/** Dashboard Individual — ficha del atleta, radar (vs categoría / plantel / test anterior), balance bilateral, evolución y plan de acción. */
export function IndividualTab({ data, win, cat, pos, catRef, sel, onSel, printing }: Props) {
  const [q, setQ] = useState('')
  const [compSel, setCompSel] = useState<'cat' | 'all' | 'prev'>('cat')

  const pool = useMemo(() => poolFor(data, win, cat, pos), [data, win, cat, pos])
  const all = useMemo(() => poolFor(data, win, 'all', 'all'), [data, win])
  const qn = norm(q)
  const list = useMemo(
    () => pool.filter((t) => !qn || norm(`${t.name} ${t.ath.rosterName || ''} ${t.ath.cat}`).includes(qn)).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [pool, qn],
  )

  const t: NbTest | undefined = pool.find((x) => x.key === sel) ?? [...pool].sort((a, b) => a.name.localeCompare(b.name, 'es'))[0]

  const buscador = (
    <input type="search" id="search" placeholder="Buscar atleta…" style={{ width: '100%' }} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
  )
  const lista = (
    <div className="plist">
      {list.map((x) => (
        <button key={x.key} className={x.key === t?.key ? 'sel' : ''} onClick={() => onSel(x.key)}>
          <span className="sd" style={{ background: LVL_COLOR[statusOf(x, catRef).lvl] }} />
          <span className="nm">{x.name}</span>
          <small>{x.ath.cat}</small>
        </button>
      ))}
      {!list.length && <div className="note">Sin resultados.</div>}
    </div>
  )

  if (!t) {
    return (
      <section className="view active" id="v-ind">
        <div className="ind">
          <div className="card">{buscador}{lista}</div>
          <div className="card empty">Sin evaluaciones para este filtro.</div>
        </div>
      </section>
    )
  }

  const a = t.ath
  const pt = prevTest(t) // evaluación inmediatamente anterior
  const mode: 'cat' | 'all' | 'prev' = compSel === 'prev' && !pt ? 'cat' : compSel
  const comp = mode === 'all' ? all : all.filter((x) => x.ath.cat === a.cat) // referencia de normalización
  const cs = Object.fromEntries(PILLARS.map((p) => [p.k, stats(comp.map((x) => x[p.k]))])) as Record<PillarKey, ReturnType<typeof stats>>
  const rng = Object.fromEntries(
    PILLARS.map((p) => {
      const v = [...cs[p.k].vals, t[p.k], mode === 'prev' && pt ? pt[p.k] : null].filter(ok)
      return [p.k, { min: Math.min(...v), max: Math.max(...v) }]
    }),
  ) as Record<PillarKey, { min: number; max: number }>
  const rs = stats(comp.map((x) => x.forceRel))
  const ms = stats(comp.map((x) => x.forceMean))
  const zRel = ok(t.forceRel) ? zOf(t.forceRel, rs) : zOf(t.forceMean, ms)
  const pRel = ok(t.forceRel) ? pctOf(t.forceRel, rs) : pctOf(t.forceMean, ms)
  const SO = statusOf(t, catRef)
  const delta = SO.delta
  const compLbl = mode === 'all' ? `todo el plantel evaluado (n=${comp.length})` : `su categoría (${a.cat}, n=${comp.length})`

  // ── diagnóstico
  const st = SO.lvl
  const stTxt = { g: 'Apto Competitivo', a: 'Precaución', r: 'Intervención Requerida' }[st]
  const grp = a.cat === 'Sin categoría' ? 'su grupo' : 'su categoría'
  const why: React.ReactNode[] = []
  if (SO.aR) why.push(<>Asimetría {fmt(t.asymAbs, 1)} % (&gt; {ASYM_R} %)</>)
  else if (SO.aA) why.push(<>Asimetría {fmt(t.asymAbs, 1)} % ({ASYM_A}–{ASYM_R} %)</>)
  if (SO.severe || SO.low) why.push(<>Fuerza {fmt(SO.zS, 2)} DE bajo la media de {grp}</>)
  if ((SO.drop || SO.dropM) && delta != null) why.push(<>Caída de {fmt(Math.abs(delta), 1)} % vs test previo</>)
  if (!why.length) why.push('Fuerza excéntrica y simetría dentro de rangos aceptables')
  const weak = sideName(t.weakSide)

  // ── prescripción
  const sc: React.ReactNode[] = []
  const pv: React.ReactNode[] = []
  if (zRel != null && zRel <= -1)
    sc.push(
      <><b>Déficit de fuerza excéntrica</b>: curl nórdico bilateral 2 sesiones/sem, progresión 2×5 → 3×8 en 4–6 semanas (bandas de asistencia si no controla los primeros 30°).</>,
      'Peso muerto rumano 3×6–8 con excéntrico de 3–4 s y puente de isquios a una pierna 3×10.',
    )
  else if (zRel != null && zRel < 1)
    sc.push(<><b>Perfil en la media</b>: mantener 1–2 sesiones/sem de nórdicos (2–3×5) y trabajo de extensión de cadera (RDL / hip thrust) para ganar reserva.</>)
  else
    sc.push(<><b>Perfil excéntrico destacado</b>: dosis mínima efectiva (1×/sem, 2×4 nórdicos) y priorizar transferencia a velocidad máxima (sprints &gt; 90 % Vmáx).</>)
  if (t.weakF < RISK_N && ['Primera', 'Reserva', '4ta', '5ta'].includes(a.cat))
    sc.push(`Pierna débil en ${fmt(t.weakF, 0)} N, por debajo del umbral de ${RISK_N} N: objetivo de ganancia de +10–15 % antes del próximo re-test.`)
  if (delta != null && SO.prev)
    sc.push(<>Evolución vs {fdate(SO.prev.date)}: <b>{delta >= 0 ? '+' : ''}{fmt(delta, 1)} %</b> en fuerza pico{delta <= -8 ? ' — revisar carga acumulada / fatiga y la técnica del test.' : '.'}</>)
  if (t.asymAbs > ASYM_R)
    pv.push(<><b>Derivar a Kinesiología</b>: pierna {weak.toLowerCase()} con {fmt(t.asymAbs, 1)} % de déficit. Descartar antecedente de lesión o dolor y controlar exposición a sprint máximo hasta bajar de {ASYM_R} %.</>)
  if (t.asymAbs >= ASYM_A)
    pv.push(
      <>Bloque compensatorio: <b>3 series × 4 rep de curl nórdico isométrico (5 s a 30–45° de flexión)</b> en pierna {weak.toLowerCase()}, + 2×6 de RDL unilateral extra del mismo lado.</>,
      'Re-test NordBord en 3–4 semanas para confirmar la reducción de la asimetría.',
    )
  else
    pv.push(<><b>Simetría aceptable</b> ({fmt(t.asymAbs, 1)} % &lt; {ASYM_A} %): no requiere trabajo compensatorio específico; sostener el programa preventivo general.</>)
  if (!a.bw) pv.push('Cargar el peso corporal en la ficha antropométrica para habilitar las métricas relativas (N/kg, Nm/kg).')

  // ── balance bilateral
  const pares: Array<[string, keyof NbTest, keyof NbTest, string]> = [
    ['Fuerza excéntrica pico', 'L', 'R', 'N'],
    ['Torque pico', 'LT', 'RT', 'Nm'],
    ['Fuerza media sostenida', 'LA', 'RA', 'N'],
    ['Impulso excéntrico', 'LI', 'RI', 'N·s'],
  ]

  // ── radar
  const nv = (k: PillarKey, v: number | null | undefined): number | null => {
    const r = rng[k]
    if (!ok(v) || !Number.isFinite(r.min)) return null
    if (k === 'sym') return v
    return r.max > r.min ? ((v - r.min) / (r.max - r.min)) * 100 : 50
  }
  const refLbl = mode === 'prev' && pt ? `Anterior (${fdShort(pt.date)})` : mode === 'all' ? 'Media del plantel total' : `Media ${a.cat}`
  const curLbl = `Actual (${fdShort(t.date)})`
  const radarData = PILLARS.map((p) => ({
    k: p.k,
    label: p.label.join(' '),
    ref: nv(p.k, mode === 'prev' && pt ? pt[p.k] : cs[p.k].mean) ?? 0,
    cur: nv(p.k, t[p.k]) ?? 0,
  }))

  const detalle = (p: PillarKey, quien: 'cur' | 'ref'): string[] => {
    const src = quien === 'cur' ? t : mode === 'prev' ? pt : null
    const who = quien === 'cur' ? curLbl : refLbl
    const row = radarData.find((r) => r.k === p)
    const norm100 = quien === 'cur' ? row?.cur : row?.ref
    if (p === 'sym') {
      const as = src ? src.asymAbs : stats(comp.map((x) => x.asymAbs)).mean
      return [`${who}: ${fmt(as, 1)} % asimetría`, `Puntaje simetría: ${fmt(norm100, 0)} / 100 (escala fija)`, `Semáforo: ${asymTxt(as)}`]
    }
    const v = src ? src[p] : cs[p].mean
    const raw = fmtM(v, PILAR_M[p])
    return src
      ? [`${who}: ${raw}`, `Normalizado: ${fmt(norm100, 0)} / 100`, `Percentil: P${fmt(pctOf(v, cs[p]), 0)}`, `Z-score: ${fmt(zOf(v, cs[p]), 2)}`]
      : [`${who}: ${raw}`, `Normalizado: ${fmt(norm100, 0)} / 100`]
  }

  // ── longitudinal
  const tests = a.tests
  const evo = tests.map((x) => ({ f: x.date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' }), L: x.L, R: x.R, x }))
  const yMin = Math.floor(Math.min(RISK_N - 40, ...tests.map((x) => x.weakF)) - 20)
  const yMax = Math.ceil(Math.max(RISK_N + 30, ...tests.map((x) => x.strongF)) + 20)

  const mini = (lab: string, v: React.ReactNode, foot: React.ReactNode, col?: string) => (
    <div className="mini">
      <div className="lab">{lab}</div>
      <div className="val" style={col ? { color: col } : undefined}>{v}</div>
      <div className="foot">{foot}</div>
    </div>
  )
  const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '±')
  const col = (g: boolean) => (g ? 'var(--g-tx)' : 'var(--r-tx)')

  return (
    <section className="view active" id="v-ind">
      <div className="ind">
        <div>
          <div className="card">
            {buscador}
            {lista}
            <div style={{ marginTop: 14 }}>
              <div className="profile">
                <div className="avatar">{initials(t.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <h2>{t.name}</h2>
                  <div className="rn">
                    {a.rosterName ? `Ficha antropométrica: ${a.rosterName}` : a.how === 'amb' ? 'Cruce ambiguo con ficha antropométrica' : 'Sin ficha antropométrica'}
                  </div>
                </div>
              </div>
              <div className="bio">
                <div><span>Categoría</span><b>{a.cat}</b></div>
                <div><span>Posición</span><b>{a.pos || '—'}</b></div>
                <div><span>Peso corporal</span><b>{a.bw ? `${fmt(a.bw, 1)} kg` : '—'}</b></div>
                <div><span>Fecha de test</span><b>{fdate(t.date)}</b></div>
                <div><span>Tests totales</span><b>{a.tests.length}</b></div>
                <div><span>Dispositivo</span><b style={{ fontSize: 12 }}>{t.device || '—'}</b></div>
              </div>
              <div className={`status ${st}`}>
                <div className="st">Estado clínico-funcional</div>
                <div className="sv">
                  <Pill lvl={st}>{st === 'g' ? '●' : st === 'a' ? '▲' : '■'} {stTxt}</Pill>
                </div>
                <ul>{why.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="minis">
            {mini('Pierna izquierda', <>{fmt(t.L, 0)}<small>N</small></>, `Torque ${fmt(t.LT, 0)} Nm`)}
            {mini('Pierna derecha', <>{fmt(t.R, 0)}<small>N</small></>, `Torque ${fmt(t.RT, 0)} Nm`)}
            {mini('Asimetría', <>{fmt(t.asymAbs, 1)}<small>%</small></>, <><Pill lvl={asymLvl(t.asymAbs)}>{asymTxt(t.asymAbs)}</Pill> {t.asymAbs >= 0.05 ? `${weak} ↓` : ''}</>)}
            {mini('Fuerza relativa', <>{fmt(t.forceRel, 2)}<small>N/kg</small></>, a.bw ? `Torque ${fmt(t.torqueRel, 2)} Nm/kg` : 'Sin peso corporal')}
            {mini('Percentil', `P${fmt(pRel, 0)}`, `Z ${fmt(zRel, 2)} · vs ${mode === 'all' ? 'plantel' : a.cat}`, zColor(zRel))}
          </div>

          <div className="grid g-2 mt">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <h3>Radar neuromuscular (0–100)</h3>
                  <p className="hint">
                    {mode === 'prev' ? `Test actual vs. test anterior, normalizados sobre el rango de ${compLbl}.` : `Min-Max vs ${compLbl}.`} Simetría en escala fija: 75 = {ASYM_A} %, 50 = {ASYM_R} % de asimetría.
                  </p>
                </div>
                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <select value={mode} onChange={(e) => setCompSel(e.target.value as 'cat' | 'all' | 'prev')} style={{ padding: '6px 10px' }}>
                    <option value="cat">vs. Media de su categoría</option>
                    <option value="all">vs. Media del plantel total</option>
                    <option value="prev" disabled={!pt}>vs. Su test anterior{pt ? ` (${fdShort(pt.date)})` : ' — sin evaluación previa'}</option>
                  </select>
                  {!pt && <span className="pill n">Sin evaluación previa registrada</span>}
                </div>
              </div>
              <div style={{ position: 'relative', height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="68%">
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="label" tick={<AngleTick />} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const k = payload[0].payload.k as PillarKey
                        const titulo = PILLARS.find((p) => p.k === k)?.label.join(' ') ?? ''
                        return <TipBox title={titulo} lines={[...detalle(k, 'cur'), '', ...detalle(k, 'ref')]} />
                      }}
                    />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11.5, fontWeight: 600, paddingTop: 8 }} />
                    <Radar name={refLbl} dataKey="ref" stroke="#475569" strokeWidth={1.75} strokeDasharray="6 4" fill="rgba(71,85,105,.10)" fillOpacity={1} isAnimationActive={!printing} dot={{ r: 4, fill: '#fff', stroke: '#475569', strokeWidth: 1.75 }} />
                    <Radar
                      name={curLbl}
                      dataKey="cur"
                      stroke="#dc2626"
                      strokeWidth={2.5}
                      fill="rgba(220,38,38,.2)"
                      fillOpacity={1}
                      isAnimationActive={!printing}
                      dot={(p: { cx?: number; cy?: number; index?: number }) => {
                        const esSym = p.index === PILLARS.length - 1
                        return <circle key={p.index} cx={p.cx} cy={p.cy} r={esSym ? 6 : 4.5} fill={esSym ? asymColor(t.asymAbs) : '#dc2626'} stroke="#fff" strokeWidth={1.5} />
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {mode === 'prev' && pt && (() => {
                const dF = t.forceMean - pt.forceMean
                const dFp = (dF / pt.forceMean) * 100
                const dR = ok(t.forceRel) && ok(pt.forceRel) ? t.forceRel - pt.forceRel : null
                const dA = t.asymAbs - pt.asymAbs
                return (
                  <>
                    <div className="deltas">
                      <div className="dk">
                        <div className="lab">Δ Fuerza pico</div>
                        <div className="val" style={{ color: col(dF >= 0) }}>{sg(dF)}{fmt(Math.abs(dF), 0)}<small>N</small></div>
                        <div className="foot">{sg(dFp)}{fmt(Math.abs(dFp), 1)} % · {fmt(pt.forceMean, 0)} → {fmt(t.forceMean, 0)} N</div>
                      </div>
                      <div className="dk">
                        <div className="lab">Δ Fuerza relativa</div>
                        <div className="val" style={{ color: dR == null ? 'var(--muted)' : col(dR >= 0) }}>{dR == null ? '—' : <>{sg(dR)}{fmt(Math.abs(dR), 2)}<small>N/kg</small></>}</div>
                        <div className="foot">{dR == null ? 'Sin peso corporal' : `${fmt(pt.forceRel, 2)} → ${fmt(t.forceRel, 2)} N/kg · peso de ficha actual`}</div>
                      </div>
                      <div className="dk">
                        <div className="lab">Δ Asimetría</div>
                        <div className="val" style={{ color: col(dA <= 0) }}>{sg(dA)}{fmt(Math.abs(dA), 1)}<small>pts</small></div>
                        <div className="foot">{dA <= 0 ? 'Redujo' : 'Aumentó'} el desbalance · {fmt(pt.asymAbs, 1)} % → {fmt(t.asymAbs, 1)} %</div>
                      </div>
                    </div>
                    {t.device && pt.device && t.device !== pt.device && (
                      <div className="note">⚠ Test anterior con {pt.device} y actual con {t.device}: parte de la diferencia puede deberse al dispositivo.</div>
                    )}
                  </>
                )
              })()}
            </div>

            <div className="card">
              <h3>Balance bilateral</h3>
              <p className="hint">Barra divergente desde el centro. La pierna débil se colorea según el semáforo.</p>
              <div className="lr-leg">
                <span style={{ color: L_COL }}>◄ Izquierda</span>
                <span style={{ color: R_COL }}>Derecha ►</span>
              </div>
              {pares.filter(([, lk, rk]) => ok(t[lk]) && ok(t[rk])).map(([lab, lk, rk, u]) => {
                const L = t[lk] as number
                const R = t[rk] as number
                const mx = Math.max(L, R)
                const def = mx ? ((mx - Math.min(L, R)) / mx) * 100 : 0
                const ws = L < R ? 'Izquierda' : 'Derecha'
                const c = asymColor(def)
                return (
                  <div className="bal-row" key={lab}>
                    <div className="bal-head">
                      <b>{lab}</b>
                      <span>{fmt(L, 0)} {u} · {fmt(R, 0)} {u}</span>
                    </div>
                    <div className="bal">
                      <div className="side l"><span style={{ width: `${(L / mx) * 100}%`, background: L < R ? c : L_COL }}>{fmt(L, 0)}</span></div>
                      <div className="mid" />
                      <div className="side r"><span style={{ width: `${(R / mx) * 100}%`, background: R < L ? c : R_COL }}>{fmt(R, 0)}</span></div>
                    </div>
                    <div className="bal-msg">
                      <Pill lvl={asymLvl(def)}>{asymTxt(def)}</Pill>
                      <span>{def < 0.05 ? 'Balance perfecto' : <>Pierna {ws} <b>−{fmt(def, 1)} %</b> déficit en {lab.toLowerCase()}</>}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid g-2 mt">
            <div className="card">
              <h3>Evolución longitudinal · Fuerza pico por pierna</h3>
              <p className="hint">{a.tests.length} test{a.tests.length > 1 ? 's' : ''} registrados. Línea punteada: umbral {RISK_N} N.</p>
              <div className="legend">
                <span><i style={{ background: L_COL }} />Izquierda</span>
                <span><i style={{ background: R_COL }} />Derecha</span>
              </div>
              <div style={{ position: 'relative', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evo} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="f" tick={{ fontSize: 11, fill: '#475569' }} padding={{ left: 16, right: 16 }} />
                    <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#475569' }} width={52} label={{ value: 'Fuerza pico (N)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const x = payload[0].payload.x as NbTest
                        return <TipBox title={String(label)} lines={[`Izquierda: ${fmt(x.L, 0)} N`, `Derecha: ${fmt(x.R, 0)} N`, `Asimetría ${fmt(x.asymAbs, 1)} % (${sideName(x.weakSide)} ↓)`]} />
                      }}
                    />
                    <ReferenceLine y={RISK_N} stroke={C.red} strokeOpacity={0.7} strokeDasharray="5 4" label={{ value: `${RISK_N} N`, position: 'insideBottomLeft', fill: C.red, fontSize: 10, fontWeight: 600 }} />
                    <Line type="monotone" dataKey="L" name="Izquierda" stroke={L_COL} strokeWidth={2} dot={{ r: 4.5, fill: L_COL, stroke: '#fff', strokeWidth: 1.5 }} isAnimationActive={!printing} />
                    <Line type="monotone" dataKey="R" name="Derecha" stroke={R_COL} strokeWidth={2} dot={{ r: 4.5, fill: R_COL, stroke: '#fff', strokeWidth: 1.5 }} isAnimationActive={!printing} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h3>Diagnóstico & Plan de acción individual</h3>
              <p className="hint">Prescripción automatizada a partir de Z-score, asimetría y tendencia. Validar con el cuerpo médico.</p>
              <div className="rx">
                <div className="box">
                  <h4>Recomendación S&amp;C</h4>
                  <ul>{sc.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
                <div className="box">
                  <h4>Preventivo / Kinesiología</h4>
                  <ul>{pv.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
