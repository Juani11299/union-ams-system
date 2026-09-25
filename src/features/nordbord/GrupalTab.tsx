import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ASYM_A, ASYM_R, C, EVO_METS, L_COL, M, R_COL, RISK_N } from './constants'
import { asymLvl, asymTxt, enrich, fdShort, fdate, fmt, isRed, monthKey, MONTHS, ok, poolFor, prevTest, sideName, stats } from './calculations'
import { asymColor, zColor } from './format'
import { fmtM, ICON, TipBox } from './ui'
import type { Dataset, MetricKey, NbRow, NbTest, Ventana } from './types'

interface Props {
  data: Dataset
  win: Ventana
  cat: string
  pos: string
  met: MetricKey
  winLabel: string
  printing: boolean
  openAthlete: (key: string) => void
}

const EJE = { fontSize: 11, fill: '#475569' }
const GRID = '#e2e8f0'

/** Informe Grupal — KPIs, distribución con Z-score, matriz de asimetrías, evolución colectiva y rankings. */
export function GrupalTab({ data, win, cat, pos, met, winLabel, printing, openAthlete }: Props) {
  const m = M[met]
  const { rows: pool, s } = useMemo(() => enrich(poolFor(data, win, cat, pos), met), [data, win, cat, pos, met])

  if (!pool.length) {
    return (
      <section className="view active" id="v-group">
        <div className="card empty">Sin evaluaciones para este filtro.</div>
      </section>
    )
  }

  const valid = pool.filter((t) => ok(t[met]))
  const sorted = [...valid].sort((a, b) => (b._z ?? -Infinity) - (a._z ?? -Infinity))
  const best = sorted[0]
  const reds = pool.filter(isRed)
  const cvTxt = s.cv < 10 ? 'Grupo homogéneo' : s.cv < 20 ? 'Variabilidad moderada' : 'Alta heterogeneidad'
  const noBw = pool.length - valid.length
  const cntAsym = (l: 'g' | 'a' | 'r') => pool.filter((t) => asymLvl(t.asymAbs) === l).length

  // ── rankings
  const rk: MetricKey = pool.filter((t) => ok(t.forceRel)).length >= 5 ? 'forceRel' : 'forceMean'
  const rm = M[rk]
  const relS = stats(pool.map((t) => t[rk]))
  const byRel = pool.filter((t) => ok(t[rk])).sort((a, b) => (b[rk] as number) - (a[rk] as number))
  const byAsym = [...pool].sort((a, b) => b.asymAbs - a.asymAbs)
  const relPct = (t: NbRow) => (relS.max > relS.min ? (((t[rk] as number) - relS.min) / (relS.max - relS.min)) * 100 : 50)

  const item = (t: NbRow, i: number, v: React.ReactNode, col: string, w: number) => (
    <div className="ritem" key={t.key} onClick={() => openAthlete(t.key)}>
      <span className="n">{i + 1}</span>
      <span className="nm">
        {t.name}
        <small>{t.ath.cat}</small>
      </span>
      <span className="v">{v}</span>
      <div className="bar">
        <span style={{ width: `${Math.max(3, w)}%`, background: col }} />
      </div>
    </div>
  )

  return (
    <section className="view active" id="v-group">
      <div className="grid g-kpi">
        <div className="card kpi">
          <div className="accent">{ICON.users}</div>
          <div className="lab">Total evaluados</div>
          <div className="val">{pool.length}</div>
          <div className="foot">
            {valid.length} con dato de {m.short.toLowerCase()}
            {noBw > 0 && (
              <>
                {' '}
                · <b>{noBw}</b> sin peso corporal
              </>
            )}
          </div>
        </div>
        <div className="card kpi">
          <div className="accent">{ICON.avg}</div>
          <div className="lab">Media del plantel</div>
          <div className="val">
            {fmt(s.mean, m.d)}
            <small>{m.u}</small>
          </div>
          <div className="foot">
            ± {fmt(s.sd, m.d)} DE · rango {fmt(s.min, m.d)}–{fmt(s.max, m.d)}
          </div>
        </div>
        <div className="card kpi">
          <div className="accent">{ICON.top}</div>
          <div className="lab">Mejor registro</div>
          <div className="val">
            {best ? fmt(best[met], m.d) : '—'}
            <small>{m.u}</small>
          </div>
          <div className="foot">
            {best && (
              <>
                <b>{best.name}</b> · {best.ath.cat} · Z {fmt(best._z, 2)}
              </>
            )}
          </div>
        </div>
        <div className="card kpi">
          <div className="accent">{ICON.cv}</div>
          <div className="lab">Coef. de variación</div>
          <div className="val">
            {fmt(s.cv, 1)}
            <small>%</small>
          </div>
          <div className="foot">{cvTxt}</div>
        </div>
        <div className={`card kpi ${reds.length ? 'flag' : ''}`}>
          <div className="accent">{ICON.flag}</div>
          <div className="lab">Atletas en bandera roja</div>
          <div className="val">
            {reds.length}
            <small>/ {pool.length}</small>
          </div>
          <div className="foot">
            Asimetría &gt; {ASYM_R} %: <b>{pool.filter((t) => t.asymAbs > ASYM_R).length}</b> · Z ≤ −1,5:{' '}
            <b>{pool.filter((t) => t._z != null && t._z <= -1.5).length}</b>
          </div>
          <div className="tl">
            <span style={{ color: 'var(--g-tx)' }}><i style={{ background: C.green }} />{cntAsym('g')}</span>
            <span style={{ color: 'var(--a-tx)' }}><i style={{ background: C.amber }} />{cntAsym('a')}</span>
            <span style={{ color: 'var(--r-tx)' }}><i style={{ background: C.red }} />{cntAsym('r')}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>asimetría</span>
          </div>
        </div>
      </div>

      <Insights pool={pool} s={s} met={met} />

      <div className="grid g-32 mt">
        <DistCard sorted={sorted} s={s} met={met} noBw={noBw} printing={printing} openAthlete={openAthlete} />
        <AsymCard pool={pool} met={met} printing={printing} openAthlete={openAthlete} />
      </div>

      <EvoCard pool={pool} winLabel={winLabel} printing={printing} openAthlete={openAthlete} />

      <div className="card mt">
        <h3>Cuadrante de Rankings</h3>
        <p className="hint">Click en un atleta para abrir su ficha individual.</p>
        <div className="rank-grid">
          <div className="rank">
            <h4><span className="dot" style={{ background: C.green }} />Top 5 · {rm.short} ({rm.u})</h4>
            {byRel.slice(0, 5).map((t, i) => item(t, i, fmt(t[rk], rm.d), C.green, relPct(t)))}
          </div>
          <div className="rank">
            <h4><span className="dot" style={{ background: C.orange }} />Bottom 5 · Zona de intervención de fuerza</h4>
            {byRel.slice(-5).reverse().map((t, i) => item(t, i, fmt(t[rk], rm.d), C.orange, relPct(t)))}
          </div>
          <div className="rank">
            <h4><span className="dot" style={{ background: C.red }} />Top 5 asimetría · Derivación a kinesiología</h4>
            {byAsym.slice(0, 5).map((t, i) =>
              item(
                t, i,
                <>
                  {fmt(t.asymAbs, 1)} % <small style={{ color: 'var(--muted)', fontWeight: 600 }}>{t.weakSide}↓</small>
                </>,
                asymColor(t.asymAbs), (t.asymAbs / byAsym[0].asymAbs) * 100,
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Resumen ejecutivo automático
// ─────────────────────────────────────────────────────────────────────────────
function Insights({ pool, s, met }: { pool: NbRow[]; s: ReturnType<typeof stats>; met: MetricKey }) {
  const m = M[met]
  const fr = stats(pool.map((t) => t.forceRel))
  const fm = stats(pool.map((t) => t.forceMean))
  const below = pool.filter((t) => t.weakF < RISK_N).length
  const belowP = (below / pool.length) * 100
  const aR = pool.filter((t) => asymLvl(t.asymAbs) === 'r')
  const aA = pool.filter((t) => asymLvl(t.asymAbs) === 'a')
  const wl = pool.filter((t) => t.asymAbs >= ASYM_A && t.weakSide === 'I').length
  const wr = pool.filter((t) => t.asymAbs >= ASYM_A && t.weakSide === 'D').length
  const dS = stats(pool.map((t) => { const p = prevTest(t); return p ? ((t.forceMean - p.forceMean) / p.forceMean) * 100 : null }))
  const symOk = aR.length / pool.length < 0.15
  const perfil =
    belowP < 25 && symOk
      ? <><b>robusto</b>: buena reserva de fuerza excéntrica y perfil mayormente simétrico</>
      : belowP < 50
        ? <><b>intermedio</b>: base de fuerza excéntrica aceptable pero con subgrupos deficitarios</>
        : <><b>deficitario</b>: la mayoría del grupo no alcanza la reserva de fuerza excéntrica de referencia</>
  const cvTxt = s.cv < 10 ? 'baja (grupo homogéneo — admite prescripción grupal)' : s.cv < 20 ? 'moderada (conviene agrupar por niveles)' : 'alta (requiere individualizar la carga)'
  const names = (a: NbRow[]) => (
    <>
      {a.slice(0, 4).map((t, i) => (
        <span key={t.key}>
          {i > 0 && ', '}
          <b>{t.name}</b> ({fmt(t.asymAbs, 1)} % {t.weakSide === 'I' ? 'I' : 'D'}↓)
        </span>
      ))}
      {a.length > 4 ? ` y ${a.length - 4} más` : ''}
    </>
  )
  const lows = pool.filter((t) => t._z != null && t._z <= -1).sort((a, b) => (a._z as number) - (b._z as number))
  const actions: React.ReactNode[] = []
  if (aR.length)
    actions.push(<><b>Derivación a Kinesiología / Readaptación</b> de {aR.length} atleta{aR.length > 1 ? 's' : ''} con asimetría &gt; {ASYM_R} %: {names(aR)}. Agregar volumen unilateral excéntrico en la pierna débil y re-test en 3–4 semanas.</>)
  if (lows.length)
    actions.push(<><b>Bloque de fuerza excéntrica estructural</b> para {lows.length} atleta{lows.length > 1 ? 's' : ''} ≥ 1 DE bajo la media en {m.short.toLowerCase()} ({lows.slice(0, 4).map((t) => t.name).join(', ')}{lows.length > 4 ? '…' : ''}): curl nórdico 2×/sem (2×5 → 3×8 en 4–6 sem) + RDL con excéntrico de 3 s.</>)
  if (aA.length)
    actions.push(<><b>Monitoreo de {aA.length} atleta{aA.length > 1 ? 's' : ''} en zona ámbar</b> ({ASYM_A}–{ASYM_R} %): 1 serie extra unilateral en la pierna débil dentro de la entrada en calor (p. ej. nórdico isométrico 30–45°, 3×4 de 5 s).</>)
  actions.push(
    s.cv >= 20
      ? <><b>Individualizar la dosis</b>: la variabilidad del grupo (CV {fmt(s.cv, 1)} %) desaconseja una única prescripción; armar 3 niveles de progresión nórdica según terciles.</>
      : <><b>Mantenimiento en microciclo competitivo</b>: 1 sesión semanal de nórdicos (2×4–6) a MD-4/MD-3 para sostener adaptaciones sin comprometer frescura.</>,
  )
  if (actions.length < 3)
    actions.push(<><b>Re-evaluación NordBord</b> en 4–6 semanas con el mismo dispositivo y horario para cuantificar la respuesta al bloque.</>)

  return (
    <div className="card insight mt">
      <span className="tag">{ICON.spark} Resumen ejecutivo automático</span>
      <p>
        Perfil dominante del grupo ({pool.length} atletas): {perfil}. Fuerza pico media <b>{fmt(fm.mean, 0)} N</b>
        {fr.n > 0 && <> (<b>{fmt(fr.mean, 2)} N/kg</b> en {fr.n} con peso)</>}; <b>{fmt(belowP, 0)} %</b> tiene la pierna débil por debajo de {RISK_N} N, umbral asociado a mayor riesgo de lesión de isquiotibiales en fútbol profesional (Timmins et al., 2016) — orientativo en juveniles, donde conviene leer la métrica relativa.
      </p>
      <p>
        Variabilidad en {m.short.toLowerCase()}: CV <b>{fmt(s.cv, 1)} %</b>, {cvTxt}. Simetría: <b style={{ color: C.green }}>{pool.length - aR.length - aA.length}</b> aceptables (&lt; {ASYM_A} %), <b style={{ color: C.amber }}>{aA.length}</b> en precaución ({ASYM_A}–{ASYM_R} %) y <b style={{ color: C.red }}>{aR.length}</b> en alerta médica (&gt; {ASYM_R} %)
        {wl + wr > 0 && <>; entre los asimétricos la pierna débil es {wl >= wr * 1.5 ? <b>mayoritariamente la izquierda</b> : wr >= wl * 1.5 ? <b>mayoritariamente la derecha</b> : 'repartida entre ambos lados'} (I {wl} / D {wr})</>}.
        {dS.n >= 3 && <> Frente a la evaluación previa ({dS.n} atletas con re-test), la fuerza pico varió <b>{dS.mean >= 0 ? '+' : ''}{fmt(dS.mean, 1)} %</b> en promedio.</>}
      </p>
      <div className="actions">
        {actions.slice(0, 3).map((a, i) => (
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
function DistCard({ sorted, s, met, noBw, printing, openAthlete }: { sorted: NbRow[]; s: ReturnType<typeof stats>; met: MetricKey; noBw: number; printing: boolean; openAthlete: (k: string) => void }) {
  const m = M[met]
  const h = Math.max(260, sorted.length * 19 + 50)
  const datos = sorted.map((t) => ({ name: t.name, v: t[met] as number, t }))
  return (
    <div className="card">
      <h3>Distribución & Z-Score · {m.label}</h3>
      <p className="hint">
        Ordenado del mejor al peor desempeño{m.inv ? ' (menor asimetría = mejor, Z invertido)' : ''}. Media <b>{fmtM(s.mean, m)}</b>, DE {fmt(s.sd, m.d)}.
        {noBw > 0 && (met === 'forceRel' || met === 'torqueRel') ? ` ${noBw} atletas excluidos por no tener peso en la ficha antropométrica.` : ''}
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
              <XAxis type="number" orientation="top" tick={EJE} domain={[0, 'auto']} label={{ value: `${m.short} (${m.u})`, position: 'insideTop', offset: -16, fill: '#475569', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 10.5, fill: '#1e293b' }} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,.15)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const t = payload[0].payload.t as NbRow
                  return (
                    <TipBox
                      title={`${t.name} · ${t.ath.cat}`}
                      lines={[
                        `Valor: ${fmtM(t[met], m)}`,
                        `Z-score: ${fmt(t._z, 2)}`,
                        `Percentil: P${fmt(t._p, 0)}`,
                        `Normalizado (0–100): ${fmt(t._n, 0)}`,
                        `I ${fmt(t.L, 0)} N · D ${fmt(t.R, 0)} N · Asim. ${fmt(t.asymAbs, 1)} %`,
                        `Test: ${fdate(t.date)}`,
                      ]}
                    />
                  )
                }}
              />
              <ReferenceLine x={s.mean} stroke="#0f172a" strokeWidth={2} label={{ value: 'Media', position: 'insideBottomRight', fill: '#0f172a', fontSize: 10.5, fontWeight: 700 }} />
              <ReferenceLine x={s.mean + s.sd} stroke="#475569" strokeDasharray="4 4" label={{ value: '+1 DE', position: 'insideBottomRight', fill: '#475569', fontSize: 10.5, fontWeight: 700 }} />
              <ReferenceLine x={s.mean - s.sd} stroke="#475569" strokeDasharray="4 4" label={{ value: '−1 DE', position: 'insideBottomRight', fill: '#475569', fontSize: 10.5, fontWeight: 700 }} />
              <Bar dataKey="v" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(sorted[i].key)}>
                {datos.map((d) => (
                  <Cell key={d.t.key} fill={zColor(d.t._z)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Matriz de asimetrías (dispersión)
// ─────────────────────────────────────────────────────────────────────────────
function AsymCard({ pool, met, printing, openAthlete }: { pool: NbRow[]; met: MetricKey; printing: boolean; openAthlete: (k: string) => void }) {
  const m = M[met]
  const yk: MetricKey = m.inv ? 'forceMean' : met
  const ym = M[yk]
  const pts = pool.filter((t) => ok(t[yk])).map((t) => ({ x: t.asym, y: t[yk] as number, t }))
  const lim = Math.max(25, Math.ceil(Math.max(...pool.map((t) => t.asymAbs)) / 5) * 5)
  const wl = pool.filter((t) => t.asymAbs >= ASYM_A && t.weakSide === 'I').length
  const wr = pool.filter((t) => t.asymAbs >= ASYM_A && t.weakSide === 'D').length
  const A = 0.1
  return (
    <div className="card">
      <h3>Matriz de Asimetrías del Equipo</h3>
      <p className="hint">
        Eje X: asimetría de fuerza pico (%). A la izquierda del 0 domina la pierna <b>izquierda</b>, a la derecha domina la <b>derecha</b>.
      </p>
      <div className="legend">
        <span><i style={{ background: 'var(--green)' }} />&lt; 10 % Aceptable</span>
        <span><i style={{ background: 'var(--amber)' }} />10–20 % Precaución</span>
        <span><i style={{ background: 'var(--red)' }} />&gt; 20 % Alerta médica</span>
      </div>
      <div style={{ position: 'relative', height: 430 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 22 }}>
            <CartesianGrid stroke={GRID} />
            <ReferenceArea x1={-ASYM_A} x2={ASYM_A} fill={`rgba(16,185,129,${A})`} stroke="none" />
            <ReferenceArea x1={ASYM_A} x2={ASYM_R} fill={`rgba(245,158,11,${A})`} stroke="none" />
            <ReferenceArea x1={-ASYM_R} x2={-ASYM_A} fill={`rgba(245,158,11,${A})`} stroke="none" />
            <ReferenceArea x1={ASYM_R} x2={lim} fill={`rgba(239,68,68,${A})`} stroke="none" />
            <ReferenceArea x1={-lim} x2={-ASYM_R} fill={`rgba(239,68,68,${A})`} stroke="none" />
            <ReferenceLine x={0} stroke="#475569" />
            <XAxis type="number" dataKey="x" domain={[-lim, lim]} allowDataOverflow tick={EJE} label={{ value: '◄ domina IZQUIERDA      Asimetría fuerza pico (%)      domina DERECHA ►', position: 'insideBottom', offset: -14, fill: '#475569', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" domain={['auto', 'auto']} tick={EJE} width={56} label={{ value: `${ym.short} (${ym.u})`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const t = payload[0].payload.t as NbRow
                return (
                  <TipBox
                    title={`${t.name} · ${t.ath.cat}`}
                    lines={[
                      `Asimetría: ${fmt(t.asymAbs, 1)} % (${asymTxt(t.asymAbs)})`,
                      `Pierna débil: ${sideName(t.weakSide)}`,
                      `I ${fmt(t.L, 0)} N · D ${fmt(t.R, 0)} N`,
                      `${ym.short}: ${fmtM(t[yk], ym)}`,
                    ]}
                  />
                )
              }}
            />
            <Scatter data={pts} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(pts[i].t.key)}>
              {pts.map((p) => (
                <Cell key={p.t.key} fill={asymColor(p.t.asymAbs)} stroke="#fff" strokeWidth={1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="note">
        Con asimetría ≥ {ASYM_A} %: pierna débil <b style={{ color: L_COL }}>Izquierda {wl}</b> · <b style={{ color: R_COL }}>Derecha {wr}</b>. Eje Y: {ym.label}.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Evolución colectiva: evaluación actual vs. anterior
// ─────────────────────────────────────────────────────────────────────────────
function EvoCard({ pool, winLabel, printing, openAthlete }: { pool: NbRow[]; winLabel: string; printing: boolean; openAthlete: (k: string) => void }) {
  const [evoMet, setEvoMet] = useState('forceMean')
  const [mode, setMode] = useState<'grouped' | 'delta'>('grouped')
  const em = EVO_METS[evoMet]
  const k = evoMet as MetricKey
  const inv = !!em.inv

  const withPrev = pool.map((t) => ({ t, p: prevTest(t) })).filter((x): x is { t: NbRow; p: NbTest } => x.p !== null)
  const pairs = withPrev
    .filter((x) => ok(x.t[k]) && ok(x.p[k]))
    .map((x) => ({ ...x, cur: x.t[k] as number, prv: x.p[k] as number, dl: (x.t[k] as number) - (x.p[k] as number) }))
  const better = (x: { dl: number }) => (inv ? x.dl < 0 : x.dl > 0)

  const pm: Record<string, number> = {}
  withPrev.forEach((x) => { const key = monthKey(x.p.date); pm[key] = (pm[key] || 0) + 1 })
  const pms = Object.entries(pm).sort((a, b) => b[1] - a[1]).map(([mk, c]) => { const [y, mo] = mk.split('-'); return { l: `${MONTHS[+mo - 1]} ${y}`, c } })
  const unit = (v: number) => `${fmt(v, em.d)}${em.u === '%' ? ' %' : ` ${em.u}`}`
  const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '±')

  const controles = (
    <div className="evo-ctl no-print">
      <select value={evoMet} onChange={(e) => setEvoMet(e.target.value)} style={{ padding: '7px 10px' }}>
        <option value="forceMean">Fuerza Pico (N)</option>
        <option value="forceRel">Fuerza Relativa (N/kg)</option>
        <option value="torqueRel">Torque Relativo (Nm/kg)</option>
        <option value="asymAbs">Asimetría Lateral (%)</option>
      </select>
      <div className="seg sm">
        <button className={mode === 'grouped' ? 'on' : ''} onClick={() => setMode('grouped')}>Barras agrupadas</button>
        <button className={mode === 'delta' ? 'on' : ''} onClick={() => setMode('delta')}>Δ Diferencia</button>
      </div>
    </div>
  )

  if (!pairs.length) {
    return (
      <div className="card mt">
        <div className="evo-head">
          <div>
            <h3>Evolución Colectiva: Evaluación Actual vs. Evaluación Anterior</h3>
            <p className="hint">Ningún jugador del filtro tiene una evaluación anterior registrada.</p>
          </div>
          {controles}
        </div>
      </div>
    )
  }

  const devX = pairs.filter((x) => x.t.device && x.p.device && x.t.device !== x.p.device)
  const n = pairs.length
  const imp = pairs.filter(better).length
  const mPrv = pairs.reduce((a, x) => a + x.prv, 0) / n
  const mCur = pairs.reduce((a, x) => a + x.cur, 0) / n
  const mDl = mCur - mPrv
  const mPct = mPrv ? (mDl / mPrv) * 100 : 0
  const aRed = withPrev.filter((x) => x.t.asymAbs < x.p.asymAbs).length
  const lvlUp = withPrev.filter((x) => 'gar'.indexOf(asymLvl(x.t.asymAbs)) < 'gar'.indexOf(asymLvl(x.p.asymAbs))).length
  const good = inv ? mDl <= 0 : mDl >= 0
  const sorted = [...pairs].sort((x, y) => (inv ? x.dl - y.dl : y.dl - x.dl))
  const grouped = mode === 'grouped'
  const pDates = [...new Set(sorted.map((x) => fdShort(x.p.date)))]
  const colCur = sorted.map((x) => (better(x) ? C.green : x.dl === 0 ? '#94a3b8' : C.red))
  const dUnit = em.u === '%' ? 'pts' : em.u
  const datos = sorted.map((x, i) => ({ name: x.t.name, prv: x.prv, cur: x.cur, dl: x.dl, x, col: colCur[i] }))
  const devPairs = [...new Set(devX.map((x) => `${x.p.device} → ${x.t.device}`))].join(', ')

  return (
    <div className="card mt">
      <div className="evo-head">
        <div>
          <h3>Evolución Colectiva: Evaluación Actual vs. Evaluación Anterior</h3>
          <p className="hint">
            <b>{winLabel} vs. {pms[0].l}</b>
            {pms.length > 1 && <> (y {pms.slice(1).map((p) => `${p.c} de ${p.l}`).join(', ')})</>} · {em.lab} ({em.u}) · {pairs.length} de {pool.length} jugadores con ambos tests
            {k !== 'forceMean' && k !== 'asymAbs' && pairs.length < withPrev.length ? ` (${withPrev.length - pairs.length} sin peso corporal)` : ''}. Click en una barra para abrir la ficha.
            {devX.length > 0 && (
              <>
                <br />
                <span className="pill a" style={{ marginTop: 6, whiteSpace: 'normal' }}>
                  ⚠ {devX.length} de {pairs.length} comparaciones cruzan dispositivos ({devPairs}): parte de la diferencia puede deberse al equipo y no al jugador.
                </span>
              </>
            )}
          </p>
        </div>
        {controles}
      </div>

      <div className="evo-kpis">
        <div className="dk">
          <div className="lab">% del plantel que mejoró</div>
          <div className="val" style={{ color: imp / n >= 0.5 ? 'var(--g-tx)' : 'var(--r-tx)' }}>{fmt((imp / n) * 100, 0)}<small>%</small></div>
          <div className="foot"><b>{imp} de {n}</b> jugadores {inv ? 'bajaron su asimetría' : `subieron su ${em.lab.toLowerCase()}`}</div>
        </div>
        <div className="dk">
          <div className="lab">Variación media del grupo</div>
          <div className="val" style={{ color: good ? 'var(--g-tx)' : 'var(--r-tx)' }}>{sg(mDl)}{fmt(Math.abs(mDl), em.d)}<small>{em.u === '%' ? 'pts' : em.u}</small></div>
          <div className="foot">{inv ? `${fmt(mPrv, 1)} % → ${fmt(mCur, 1)} % de asimetría media` : `${sg(mPct)}${fmt(Math.abs(mPct), 1)} % · media ${unit(mPrv)} → ${unit(mCur)}`}</div>
        </div>
        <div className="dk">
          <div className="lab">Control de asimetrías</div>
          <div className="val" style={{ color: aRed / withPrev.length >= 0.5 ? 'var(--g-tx)' : 'var(--a-tx)' }}>{aRed}<small>/ {withPrev.length}</small></div>
          <div className="foot">redujeron su déficit lateral · <b>{lvlUp}</b> mejoraron de color en el semáforo</div>
        </div>
      </div>

      <div className="legend">
        {grouped ? (
          <>
            <span><i style={{ background: '#94a3b8' }} />Test anterior{pDates.length === 1 ? ` (${pDates[0]})` : ''}</span>
            <span><i style={{ background: C.green }} />Test actual · mejoró</span>
            <span><i style={{ background: C.red }} />Test actual · empeoró</span>
            <span><i style={{ background: '#64748b', height: 2, width: 14, borderRadius: 0 }} />Media anterior</span>
            <span><i style={{ background: '#0f172a', height: 2, width: 14, borderRadius: 0 }} />Media actual (Δ {sg(mDl)}{fmt(Math.abs(mDl), em.d)})</span>
          </>
        ) : (
          <>
            <span><i style={{ background: C.green }} />Mejoró</span>
            <span><i style={{ background: C.red }} />Empeoró</span>
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
              <YAxis tick={EJE} width={52} domain={grouped ? [0, 'auto'] : ['auto', 'auto']} label={{ value: grouped ? `${em.lab} (${em.u})` : `Δ ${em.lab} (${dUnit})`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,.15)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const x = payload[0].payload.x as (typeof pairs)[number]
                  const pc = x.prv ? (x.dl / x.prv) * 100 : 0
                  return (
                    <TipBox
                      title={`${x.t.name} · ${x.t.ath.cat}`}
                      lines={[
                        `Anterior (${fdShort(x.p.date)}): ${unit(x.prv)}`,
                        `Actual (${fdShort(x.t.date)}): ${unit(x.cur)}`,
                        `Δ ${sg(x.dl)}${fmt(Math.abs(x.dl), em.d)} ${dUnit}${inv ? '' : ` (${sg(pc)}${fmt(Math.abs(pc), 1)} %)`} · ${better(x) ? 'mejoró' : x.dl === 0 ? 'sin cambios' : 'empeoró'}`,
                      ]}
                    />
                  )
                }}
              />
              {grouped ? (
                <>
                  <ReferenceLine y={mPrv} stroke="#64748b" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `Media anterior ${unit(mPrv)}`, position: 'insideTopLeft', fill: '#64748b', fontSize: 10.5, fontWeight: 700 }} />
                  <ReferenceLine y={mCur} stroke="#0f172a" strokeWidth={2} label={{ value: `Media actual ${unit(mCur)} · Δ ${sg(mDl)}${fmt(Math.abs(mDl), em.d)} ${dUnit}`, position: 'insideBottomLeft', fill: '#0f172a', fontSize: 10.5, fontWeight: 700 }} />
                  <Bar dataKey="prv" fill="#94a3b8" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(sorted[i].t.key)} />
                  <Bar dataKey="cur" radius={4} isAnimationActive={!printing} cursor="pointer" onClick={(_d, i) => openAthlete(sorted[i].t.key)}>
                    {datos.map((d) => <Cell key={d.x.t.key} fill={d.col} />)}
                  </Bar>
                </>
              ) : (
                <>
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <ReferenceLine y={mDl} stroke="#0f172a" strokeWidth={2} strokeDasharray="6 4" label={{ value: `Δ medio ${sg(mDl)}${fmt(Math.abs(mDl), em.d)} ${dUnit}${inv ? '' : ` (${sg(mPct)}${fmt(Math.abs(mPct), 1)} %)`}`, position: 'insideTopLeft', fill: '#0f172a', fontSize: 10.5, fontWeight: 700 }} />
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

