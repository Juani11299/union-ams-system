import { useMemo, useState } from 'react'
import { ASYM_A, ASYM_R, LVL_ICO, LVL_TXT } from './constants'
import { asymLvl, catOrder, dtAdvice, fmt, ok, poolFor, statusOf } from './calculations'
import { LvlPill } from './ui'
import type { CatRef, Dataset, Lvl, Ventana } from './types'

interface Props {
  data: Dataset
  win: Ventana
  /** Categoría activa (compartida con los filtros del resto de las pestañas). */
  cat: string
  onCat: (c: string) => void
  catRef: CatRef
  openAthlete: (key: string) => void
  onPrint: () => void
  ventanas: Array<{ value: string; label: string }>
  onWin: (w: string) => void
}

/** Resumen DT & PF — lenguaje de campo, lectura en 15 segundos. */
export function ResumenDtTab({ data, win, cat, onCat, catRef, openAthlete, onPrint, ventanas, onWin }: Props) {
  const [dtLvl, setDtLvl] = useState<Lvl | null>(null)

  const all = useMemo(() => poolFor(data, win, 'all', 'all'), [data, win])
  const cats = useMemo(() => {
    const c: Record<string, number> = {}
    all.forEach((t) => (c[t.ath.cat] = (c[t.ath.cat] || 0) + 1))
    return c
  }, [all])
  const ck = catOrder(Object.keys(cats))

  const rows = useMemo(
    () =>
      poolFor(data, win, cat, 'all').map((t) => {
        const so = statusOf(t, catRef)
        return { t, so, ...dtAdvice(t, so) }
      }),
    [data, win, cat, catRef],
  )
  const cnt = { g: 0, a: 0, r: 0 }
  rows.forEach((r) => cnt[r.so.lvl]++)
  const n = rows.length || 1
  const pc = (k: Lvl) => fmt((cnt[k] / n) * 100, 0)

  const ord = { r: 0, a: 1, g: 2 }
  const list = rows
    .filter((r) => !dtLvl || r.so.lvl === dtLvl)
    .sort((x, y) => ord[x.so.lvl] - ord[y.so.lvl] || y.t.asymAbs - x.t.asymAbs)

  const nm = (arr: typeof rows, max = 6) => (
    <>
      {arr.slice(0, max).map((r, i) => (
        <span key={r.t.key}>
          {i > 0 && ', '}
          <b>{r.t.name}</b>
        </span>
      ))}
      {arr.length > max ? ` y ${arr.length - max} más` : ''}
    </>
  )

  // 3 claves del entrenador
  const weakF = rows.filter((r) => r.so.low).length
  const wfP = (weakF / n) * 100
  const deltas = rows.map((r) => r.so.delta).filter(ok)
  const dm = deltas.length >= 3 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null
  const brake = wfP < 15 ? 'buena' : wfP < 30 ? 'aceptable' : 'a mejorar'
  const hsr = rows
    .filter((r) => r.so.lvl === 'r' || r.so.aA)
    .sort((x, y) => ord[x.so.lvl] - ord[y.so.lvl] || y.t.asymAbs - x.t.asymAbs)
  const comp = rows.filter((r) => r.t.asymAbs >= ASYM_A)
  const cI = comp.filter((r) => r.t.weakSide === 'I')
  const cD = comp.filter((r) => r.t.weakSide === 'D')

  const card = (k: Lvl, emo: string, title: string, desc: React.ReactNode) => (
    <div key={k} className={`av ${k} ${dtLvl === k ? 'sel' : ''}`} title="Click para filtrar la tabla" onClick={() => setDtLvl(dtLvl === k ? null : k)}>
      <div className="top">
        <span className="t">{title}</span>
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
          <button className={cat === 'all' ? 'on' : ''} onClick={() => { onCat('all'); setDtLvl(null) }}>
            Plantel completo · {all.length}
          </button>
          {ck.map((c) => (
            <button key={c} className={cat === c ? 'on' : ''} onClick={() => { onCat(c); setDtLvl(null) }}>
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
            🖨️ Imprimir Resumen DT (A4)
          </button>
        </div>
      </div>

      <div className="avail">
        {card('g', '🟢', 'Disponibles al 100 %', <>Asimetría &lt; {ASYM_A} % y fuerza adecuada. <b>Entrenamiento normal.</b></>)}
        {card('a', '🟡', 'En observación', <>Asimetría {ASYM_A}–{ASYM_R} % o fuerza por debajo de su grupo. <b>Dosificar sprints máximos y volumen de frenadas.</b></>)}
        {card('r', '🔴', 'Atención especial / Kinesio', <>Asimetría &gt; {ASYM_R} % o déficit severo de fuerza. <b>Compensatorio unilateral obligatorio.</b></>)}
      </div>

      <div className="dt-grid mt">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h3>Semáforo de Vestuario</h3>
              <p className="hint">Ordenado por prioridad. Click en un jugador para ver su ficha completa.</p>
            </div>
            {dtLvl && (
              <span className={`pill ${dtLvl}`} style={{ cursor: 'pointer' }} onClick={() => setDtLvl(null)}>
                {LVL_ICO[dtLvl]} Solo {LVL_TXT[dtLvl]} · {list.length} ✕
              </span>
            )}
          </div>
          <div className="tbl" style={{ maxHeight: 640 }}>
            {list.length ? (
              <table className="vest">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Pierna a cuidar</th>
                    <th>Recomendación para la sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(({ t, so, care, rec }) => (
                    <tr key={t.key} className={so.lvl} onClick={() => openAthlete(t.key)}>
                      <td className="nm">{t.name}</td>
                      <td>{t.ath.cat}</td>
                      <td>
                        <LvlPill lvl={so.lvl} />
                      </td>
                      <td
                        className="leg-care"
                        style={{ color: t.asymAbs >= ASYM_A ? `var(--${asymLvl(t.asymAbs)}-tx)` : 'var(--muted)' }}
                      >
                        {care}
                      </td>
                      <td className="rec">{rec}</td>
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
          <p className="hint">Acciones prácticas para el microciclo.</p>
          <ol>
            <li>
              <h4>Balance del equipo y frenado</h4>
              <b>
                {cnt.g} de {rows.length}
              </b>{' '}
              jugadores ({pc('g')} %) están disponibles al 100 %. La capacidad de frenado (fuerza de isquios) del grupo es <b>{brake}</b>:{' '}
              {weakF ? `${weakF} jugador${weakF > 1 ? 'es están' : ' está'} por debajo de su grupo` : 'nadie está por debajo de su grupo'}.
              {dm != null && (
                <>
                  {' '}
                  Respecto de la evaluación anterior el equipo{' '}
                  {dm >= 3 ? <b>ganó fuerza (+{fmt(dm, 0)} %)</b> : dm <= -3 ? <b>perdió fuerza ({fmt(dm, 0)} %) — revisar carga acumulada</b> : <b>se mantuvo estable</b>}.
                </>
              )}
            </li>
            <li>
              <h4>Alta velocidad (HSR / sprints)</h4>
              {hsr.length ? (
                <>
                  Cuidar en tareas de alta velocidad a {nm(hsr)}. Sprints máximos al inicio de la sesión, con pausa completa, y evitar acumular sprints repetidos o frenadas bruscas con fatiga.
                </>
              ) : (
                'Sin restricciones: todo el grupo puede completar sprints máximos y tareas de alta velocidad.'
              )}
            </li>
            <li>
              <h4>Gimnasio · compensatorios</h4>
              Nórdicos para todo el grupo 1–2 veces por semana (2×5, lejos del partido: MD-4 / MD-3).
              {comp.length ? (
                <>
                  {' '}
                  <b>Vitamina unilateral</b> para {comp.length} jugador{comp.length > 1 ? 'es' : ''} con una pierna marcada: nórdico isométrico 3×4 de 5 s + peso muerto a una pierna 2×6 del lado a cuidar.
                  {cI.length > 0 && (
                    <>
                      <br />
                      Izquierda: {nm(cI, 8)}.
                    </>
                  )}
                  {cD.length > 0 && (
                    <>
                      <br />
                      Derecha: {nm(cD, 8)}.
                    </>
                  )}
                </>
              ) : (
                ' Nadie necesita trabajo compensatorio unilateral.'
              )}
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
