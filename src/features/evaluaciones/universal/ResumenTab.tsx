import { useMemo, useState } from 'react'
import { catOrder } from '@/features/nordbord/calculations'
import { LvlPill } from '@/features/nordbord/ui'
import { asymLvlGenerico, ASIM_VERDE, ASIM_ROJO } from './semaforo'
import { enrichU, estadoU, fmt, fmtV, LVL_ICO_U, LVL_TXT_U, ordenarMejorPrimero, poolU } from './calculos'
import type { CatRefU, DatasetU, LvlU, Ventana } from './tipos'

interface Props {
  ds: DatasetU
  win: Ventana
  cat: string
  onCat: (c: string) => void
  catRef: CatRefU
  openAthlete: (key: string) => void
  onPrint: () => void
  ventanas: Array<{ value: string; label: string }>
  onWin: (w: string) => void
}

/** Resumen DT — semáforo de vestuario + Ranking Top 5 / Bottom 5 de cada métrica clave del test. */
export function ResumenTab({ ds, win, cat, onCat, catRef, openAthlete, onPrint, ventanas, onWin }: Props) {
  const [lvlSel, setLvlSel] = useState<LvlU | null>(null)
  const all = useMemo(() => poolU(ds, win, 'all'), [ds, win])
  const cats = useMemo(() => {
    const c: Record<string, number> = {}
    all.forEach((t) => (c[t.ath.cat] = (c[t.ath.cat] || 0) + 1))
    return c
  }, [all])
  const pool = useMemo(() => poolU(ds, win, cat), [ds, win, cat])
  const rows = useMemo(() => pool.map((t) => ({ t, e: estadoU(t, ds, catRef) })), [pool, ds, catRef])

  const cnt = { g: 0, a: 0, r: 0 }
  rows.forEach((r) => cnt[r.e.lvl]++)
  const n = rows.length || 1
  const pc = (k: LvlU) => fmt((cnt[k] / n) * 100, 0)
  const ord = { r: 0, a: 1, g: 2 }
  const lista = rows.filter((r) => !lvlSel || r.e.lvl === lvlSel).sort((x, y) => ord[x.e.lvl] - ord[y.e.lvl] || (y.e.asimMax ?? 0) - (x.e.asimMax ?? 0) || (x.e.zMin ?? 0) - (y.e.zMin ?? 0))
  const hayAsim = ds.asimetrias.length > 0
  const p = ds.primaria

  // 3 claves del entrenador
  const deltas = rows.map((r) => r.e.delta).filter((d): d is number => d !== null)
  const dm = deltas.length >= 3 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null
  const criticas = ds.clave
    .filter((m) => !m.esAsim)
    .map((m) => ({ m, bajos: enrichU(pool, m).rows.filter((r) => r.z !== null && r.z <= -1).length }))
    .sort((a, b) => b.bajos - a.bajos)
  const rojosAsim = rows.filter((r) => r.e.asimMax !== null && asymLvlGenerico(r.e.asimMax) === 'r')
  const nombres = (arr: typeof rows, max = 6) => (
    <>
      {arr.slice(0, max).map((r, i) => (
        <span key={r.t.key}>
          {i > 0 && ', '}
          <b>{r.t.ath.nombre}</b>
        </span>
      ))}
      {arr.length > max ? ` y ${arr.length - max} más` : ''}
    </>
  )

  const card = (k: LvlU, emo: string, titulo: string, desc: React.ReactNode) => (
    <div key={k} className={`av ${k} ${lvlSel === k ? 'sel' : ''}`} title="Click para filtrar la tabla" onClick={() => setLvlSel(lvlSel === k ? null : k)}>
      <div className="top">
        <span className="t">{titulo}</span>
        <span className="emo">{emo}</span>
      </div>
      <div className="n">
        {cnt[k]}
        <small>{pc(k)} % del plantel</small>
      </div>
      <div className="d">{desc}</div>
    </div>
  )

  return (
    <section className="view active" id="v-dt">
      <div className="dt-bar">
        <div className="seg">
          <button className={cat === 'all' ? 'on' : ''} onClick={() => { onCat('all'); setLvlSel(null) }}>
            Plantel completo · {all.length}
          </button>
          {catOrder(Object.keys(cats)).map((c) => (
            <button key={c} className={cat === c ? 'on' : ''} onClick={() => { onCat(c); setLvlSel(null) }}>
              {c} · {cats[c]}
            </button>
          ))}
        </div>
        <div className="win">
          <span>Evaluación</span>
          <select value={win} onChange={(e) => onWin(e.target.value)}>
            {ventanas.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={onPrint}>
            🖨️ Imprimir Resumen (A4)
          </button>
        </div>
      </div>

      <div className="avail">
        {card('g', '🟢', 'Disponibles al 100 %', <>{hayAsim ? `Asimetrías < ${ASIM_VERDE} % y ` : ''}valores dentro de lo esperado para su categoría. <b>Entrenamiento normal.</b></>)}
        {card('a', '🟡', 'En observación', <>{hayAsim ? `Asimetría ${ASIM_VERDE}–${ASIM_ROJO} %, ` : ''}algún valor 1 DE por debajo de su grupo o caída ≥ 8 % vs el test anterior. <b>Dosificar y monitorear.</b></>)}
        {card('r', '🔴', 'Atención especial', <>{hayAsim ? `Asimetría > ${ASIM_ROJO} %, ` : ''}déficit severo (≤ −1,5 DE) o caída ≥ 15 % vs el test anterior. <b>Intervención y re-test.</b></>)}
      </div>

      <div className="card mt">
        <h3>Ranking Top 5 y Bottom 5 · métricas clave</h3>
        <p className="hint">Último resultado de cada jugador en la ventana, según el sentido de cada métrica (en las de "menos es mejor" el mejor es el valor más bajo). Click en un jugador para abrir su ficha.</p>
        <div className="grid g-2">
          {ds.clave.map((m) => {
            const { rows: r } = enrichU(pool, m)
            const ordenados = ordenarMejorPrimero(r, m)
            const top = ordenados.slice(0, 5)
            const bottom = ordenados.slice(-5).reverse()
            const mn = Math.min(...r.map((x) => x.v))
            const mx = Math.max(...r.map((x) => x.v))
            const ancho = (v: number) => (mx > mn ? Math.max(4, ((m.menosEsMejor ? mx - v : v - mn) / (mx - mn)) * 100) : 50)
            const item = (x: (typeof r)[number], i: number, col: string) => (
              <div className="ritem" key={x.t.key} onClick={() => openAthlete(x.t.key)}>
                <span className="n">{i + 1}</span>
                <span className="nm">
                  {x.t.ath.nombre}
                  <small>{x.t.ath.cat}</small>
                </span>
                <span className="v">{fmtV(x.v, m)}</span>
                <div className="bar">
                  <span style={{ width: `${ancho(x.v)}%`, background: col }} />
                </div>
              </div>
            )
            return (
              <div key={m.key} className="card" style={{ boxShadow: 'none' }}>
                <h3>
                  {m.label} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{m.unidad && `[${m.unidad}]`}{m.menosEsMejor ? ' · menos es mejor' : ''}</span>
                </h3>
                {r.length < 2 ? (
                  <p className="hint">Sin datos suficientes para armar el ranking.</p>
                ) : (
                  <div className="rank-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
                    <div className="rank">
                      <h4><span className="dot" style={{ background: '#10b981' }} />Top 5</h4>
                      {top.map((x, i) => item(x, i, '#10b981'))}
                    </div>
                    <div className="rank">
                      <h4><span className="dot" style={{ background: '#f97316' }} />Bottom 5</h4>
                      {bottom.map((x, i) => item(x, i, '#f97316'))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="dt-grid mt">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h3>Semáforo de Vestuario</h3>
              <p className="hint">Ordenado por prioridad. Click en un jugador para ver su ficha completa.</p>
            </div>
            {lvlSel && (
              <span className={`pill ${lvlSel}`} style={{ cursor: 'pointer' }} onClick={() => setLvlSel(null)}>
                {LVL_ICO_U[lvlSel]} Solo {LVL_TXT_U[lvlSel]} · {lista.length} ✕
              </span>
            )}
          </div>
          <div className="tbl" style={{ maxHeight: 640 }}>
            {lista.length ? (
              <table className="vest">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    {p && <th className="num">{p.label}</th>}
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(({ t, e }) => (
                    <tr key={t.key} className={e.lvl} onClick={() => openAthlete(t.key)}>
                      <td className="nm">{t.ath.nombre}</td>
                      <td>{t.ath.cat}</td>
                      <td><LvlPill lvl={e.lvl} /></td>
                      {p && <td className="num">{fmt(t.valores[p.key], p.d)}</td>}
                      <td className="rec">{e.motivos.length ? e.motivos.join(' · ') : 'Sin alertas: entrena sin restricciones'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">Sin jugadores evaluados para este filtro.</div>
            )}
          </div>
        </div>

        <div className="card keys keys-card">
          <h3>🎯 3 Claves del Entrenador</h3>
          <p className="hint">Lectura automática de {ds.config.nombre}.</p>
          <ol>
            <li>
              <h4>Balance del equipo</h4>
              <b>{cnt.g} de {rows.length}</b> jugadores ({pc('g')} %) están disponibles al 100 %.
              {dm !== null && p && (
                <>
                  {' '}Respecto de la evaluación anterior el grupo {dm >= 3 ? <b>mejoró en {p.label} (+{fmt(dm, 0)} %)</b> : dm <= -3 ? <b>empeoró en {p.label} ({fmt(dm, 0)} %) — revisar carga acumulada</b> : <b>se mantuvo estable en {p.label}</b>}.
                </>
              )}
            </li>
            <li>
              <h4>{hayAsim ? 'Asimetrías' : 'Foco de trabajo'}</h4>
              {hayAsim ? (
                rojosAsim.length ? (
                  <>{rojosAsim.length} jugador{rojosAsim.length > 1 ? 'es' : ''} con asimetría &gt; {ASIM_ROJO} %: {nombres(rojosAsim)}. Trabajo unilateral correctivo y re-test en 3–4 semanas.</>
                ) : (
                  <>Nadie supera el {ASIM_ROJO} % de asimetría: sostener el trabajo unilateral preventivo.</>
                )
              ) : criticas[0] && criticas[0].bajos > 0 ? (
                <>La métrica más comprometida es <b>{criticas[0].m.label}</b>: {criticas[0].bajos} jugador{criticas[0].bajos > 1 ? 'es' : ''} 1 DE por debajo de su categoría. Priorizarla en el próximo bloque.</>
              ) : (
                'Ninguna métrica clave tiene jugadores marcadamente por debajo de su categoría.'
              )}
            </li>
            <li>
              <h4>Intervención individual</h4>
              {cnt.r > 0 ? (
                <>Revisar de forma individual a {nombres(rows.filter((r) => r.e.lvl === 'r'))}. Ver la ficha para el detalle de cada métrica.</>
              ) : (
                'No hay jugadores en zona de intervención en este filtro.'
              )}
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
