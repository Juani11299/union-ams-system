import { useMemo, useState } from 'react'
import { LVL_TXT } from './constants'
import { enrich, fdate, fmt, poolFor, sideName, statusOf } from './calculations'
import { LvlPill } from './ui'
import type { CatRef, Dataset, MetricKey, NbRow, Ventana } from './types'

interface Props {
  data: Dataset
  win: Ventana
  cat: string
  pos: string
  met: MetricKey
  catRef: CatRef
  onFile: (f: File) => void
  arrastrando: boolean
}

type ColKey = 'name' | 'cat' | 'pos' | 'date' | 'bw' | 'L' | 'R' | 'asymAbs' | 'weakSide' | 'forceMean' | 'forceRel' | 'torqueRel' | '_z' | '_p'
const COLS: Array<[ColKey, string, number?]> = [
  ['name', 'Atleta'], ['cat', 'Cat.'], ['pos', 'Pos.'], ['date', 'Fecha'], ['bw', 'Peso', 1], ['L', 'Izq. N', 0], ['R', 'Der. N', 0],
  ['asymAbs', 'Asim. %', 1], ['weakSide', 'Débil'], ['forceMean', 'Fza pico N', 0], ['forceRel', 'N/kg', 2], ['torqueRel', 'Nm/kg', 2], ['_z', 'Z', 2], ['_p', 'Pctl', 0],
]

function Chips({ items, cls = '' }: { items: string[]; cls?: string }) {
  return (
    <div className="chips">
      {items.length ? items.map((h, i) => <span key={`${h}-${i}`} className={`chip ${cls}`}>{h}</span>) : <span className="note">—</span>}
    </div>
  )
}

const valDe = (t: NbRow, k: ColKey): string | number | Date | null =>
  k === 'cat' ? t.ath.cat : k === 'pos' ? t.ath.pos : k === 'bw' ? t.bw : (t[k as keyof NbRow] as string | number | Date | null)

/** Datos & Calidad — smart parsing del archivo, cruce con la ficha antropométrica y base procesada. */
export function DatosTab({ data: D, win, cat, pos, met, catRef, onFile, arrastrando }: Props) {
  const [sort, setSort] = useState<{ k: ColKey; dir: 1 | -1 }>({ k: 'forceMean', dir: -1 })
  const ci = D.colInfo
  const mt = D.match
  const n = Object.keys(D.athletes).length
  const matched = mt.exact.length + mt.fuzzy.length + mt.csv.length

  const rows = useMemo(() => {
    const { rows: r } = enrich(poolFor(D, win, cat, pos), met)
    return [...r].sort((a, b) => {
      const x = valDe(a, sort.k)
      const y = valDe(b, sort.k)
      if (x == null) return 1
      if (y == null) return -1
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir
    })
  }, [D, win, cat, pos, met, sort])

  function descargarCsv() {
    const hdr = ['Atleta', 'Categoria', 'Posicion', 'Fecha', 'Peso_kg', 'Izq_N', 'Der_N', 'Asimetria_pct', 'Pierna_debil', 'Fuerza_pico_N', 'Fuerza_rel_Nkg', 'Torque_Nm', 'Torque_rel_Nmkg', 'Impulso_Ns', `Z_${met}`, `Percentil_${met}`, 'Estado']
    const filas = rows.map((t) => [
      t.name, t.ath.cat, t.ath.pos || '', t.date.toISOString().slice(0, 10), t.bw ?? '', t.L, t.R, t.asym.toFixed(2), sideName(t.weakSide), t.forceMean.toFixed(1),
      t.forceRel?.toFixed(3) ?? '', t.torque?.toFixed(1) ?? '', t.torqueRel?.toFixed(3) ?? '', t.impulse?.toFixed(0) ?? '', t._z?.toFixed(3) ?? '', t._p?.toFixed(0) ?? '', LVL_TXT[statusOf(t, catRef).lvl],
    ])
    const csv = '﻿' + [hdr, ...filas].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'nordbord_procesado.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <section className="view active" id="v-data">
      <div className="grid g-2">
        <div className="card">
          <h3>Smart Parsing del archivo</h3>
          <p className="hint">
            Archivo <b>{D.fileName}</b> · separador <b>"{D.sep}"</b> · UTF-8 · {D.nRows} filas × {D.nCols} columnas · <b>{D.tests.length}</b> tests válidos de <b>{n}</b> atletas · {D.invalid.length} descartados.
          </p>
          <p className="note" style={{ margin: '0 0 6px' }}><b>Metadatos detectados</b></p>
          <Chips items={ci.meta} />
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Métricas de rendimiento con datos</b> ({ci.metrics.length})</p>
          <Chips items={ci.metrics} cls="m" />
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Ignoradas en selectores</b> (IDs / administrativas)</p>
          <Chips items={ci.ignored} cls="x" />
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Columnas vacías en este export</b> ({ci.empty.length}) — p. ej. RFD y "Per Kg" requieren peso cargado en la plataforma</p>
          <Chips items={ci.empty.slice(0, 12).concat(ci.empty.length > 12 ? [`+${ci.empty.length - 12} más`] : [])} cls="x" />
          {D.invalid.length > 0 && (
            <>
              <p className="note" style={{ margin: '12px 0 6px' }}><b>Tests descartados</b></p>
              <Chips items={D.invalid.map((i) => `${i.name} · ${fdate(i.date)} · ${i.why}`)} />
            </>
          )}
          <p className="note">
            Variables derivadas: Fuerza relativa = media(I,D) / peso ficha antropométrica; Torque relativo = torque / peso; Asimetría = (D − I) / máx(I,D) × 100 (negativo ⇒ domina la izquierda). Z-score con inversión automática en métricas de asimetría.
          </p>
        </div>

        <div className="card">
          <h3>Cruce con ficha antropométrica</h3>
          <p className="hint">
            El CSV de NordBord no trae categoría, posición ni peso. Se cruzó por apellido + inicial contra la última antropometría cargada en el club ({D.rosterSize} jugadores). Resultado: <b>{matched}/{n}</b> atletas vinculados
            {mt.fuzzy.length > 0 && ` (${mt.fuzzy.length} por similitud ortográfica)`}.
            {D.rosterSize === 0 && ' No hay antropometrías disponibles: todos quedan en "Sin categoría" y sin métricas relativas. Importalas en el módulo Antropometrías.'}
          </p>
          {mt.fuzzy.length > 0 && (
            <>
              <p className="note" style={{ margin: '0 0 6px' }}><b>Vinculados por similitud</b> — verificar</p>
              <Chips items={mt.fuzzy} cls="m" />
            </>
          )}
          {mt.amb.length > 0 && (
            <>
              <p className="note" style={{ margin: '12px 0 6px' }}><b>Ambiguos</b> (no asignados — resolver en MANUAL_MATCH, <code>nordbord/constants.ts</code>)</p>
              <Chips items={mt.amb} />
            </>
          )}
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Sin ficha antropométrica</b> ({mt.none.length}) → "Sin categoría", sin métricas relativas</p>
          <Chips items={mt.none} />
          <label className={`drop mt no-print ${arrastrando ? 'over' : ''}`} style={{ display: 'block', cursor: 'pointer' }}>
            Arrastrá acá un nuevo export de NordBord (.csv, separador , o ;) o tocá para elegirlo, y se recalcula todo el tablero.
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
          </label>
        </div>
      </div>

      <div className="card mt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h3>Base procesada (grupo filtrado)</h3>
            <p className="hint" style={{ margin: 0 }}>Una fila por atleta (último test de la ventana). Click en encabezados para ordenar.</p>
          </div>
          <button className="btn no-print" onClick={descargarCsv}>Descargar CSV procesado</button>
        </div>
        <div className="tbl mt">
          <table>
            <thead>
              <tr>
                {COLS.map(([k, l, d]) => (
                  <th key={k} className={d != null ? 'num' : ''} onClick={() => setSort((s) => ({ k, dir: s.k === k ? (-s.dir as 1 | -1) : k === 'name' ? 1 : -1 }))}>
                    {l}{sort.k === k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.key}>
                  {COLS.map(([k, , d]) => {
                    const v = valDe(t, k)
                    return (
                      <td key={k} className={d != null ? 'num' : ''}>
                        {k === 'date' ? fdate(v as Date) : k === 'weakSide' ? sideName(t.weakSide) : d != null ? fmt(v as number | null, d) : String(v || '—')}
                      </td>
                    )
                  })}
                  <td><LvlPill lvl={statusOf(t, catRef).lvl} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

