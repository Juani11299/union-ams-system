import { useMemo } from 'react'
import { fmt } from '@/features/nordbord/calculations'
import { columnasClinicas, filaClinica, lecturaClinica, type NivelClinico } from './perfilClinico'
import { enrichU, ordenarMejorPrimero } from './calculos'
import type { DatasetU, RegistroU } from './tipos'

const COLOR: Record<NivelClinico, { fondo: string; texto: string; borde: string; etiqueta: string }> = {
  ok: { fondo: 'var(--g-bg)', texto: 'var(--g-tx)', borde: 'var(--g-bd)', etiqueta: '🟢' },
  info: { fondo: '#f1f5f9', texto: 'var(--text2)', borde: 'var(--border)', etiqueta: 'ℹ️' },
  precaucion: { fondo: 'var(--a-bg)', texto: 'var(--a-tx)', borde: 'var(--a-bd)', etiqueta: '🟡' },
  critico: { fondo: 'var(--r-bg)', texto: 'var(--r-tx)', borde: 'var(--r-bd)', etiqueta: '🔴' },
}

const TITULO_FAMILIA = {
  nordbord: 'Lectura clínica NordBord · fuerza excéntrica de isquiotibiales',
  'cmj-bilateral': 'Lectura clínica CMJ bilateral · potencia vertical y función neuromuscular',
  'cmj-unilateral': 'Lectura clínica CMJ unilateral / SLJ · rendimiento por pierna y absorción de impacto',
  generico: '',
} as const

const REGLAS = {
  nordbord: 'Reglas: pierna débil < 337 N (Timmins 2016, orientativo en juveniles) · meta élite del club > 4,0 N/kg · asimetría < 10 % 🟢 · 10–20 % 🟡 · > 20 % 🔴 (alto riesgo de lesión).',
  'cmj-bilateral': 'Reglas del club: RSI-mod < 0,35 bajo / fatiga residual · 0,35–0,45 promedio competitivo · > 0,45 élite neuromuscular · asimetría concéntrica de fuerza pico > 10 % = compensación unilateral. Referencia: McMahon et al. (2020) en rugby league senior reportó RSImod medio de 0,45–0,48.',
  'cmj-unilateral': 'Reglas del club: asimetría de aterrizaje > 15 % = alerta crítica de frenado/absorción de impacto (prioridad kinesiología) · resto de las fases con semáforo 5 % / 10 %.',
  generico: '',
} as const

/** Tarjetas ejecutivas: promedio grupal, top performer y atletas con asimetría crítica (pool de la ventana activa). */
export function KpisEjecutivos({ ds, pool }: { ds: DatasetU; pool: RegistroU[] }) {
  const datos = useMemo(() => {
    const m = ds.primaria
    if (!m) return null
    const { rows, s } = enrichU(pool, m)
    const mejor = ordenarMejorPrimero(rows, m)[0]
    const criticos = ds.tipo === 'generico' ? pool.filter((t) => ds.asimetrias.some((a) => (t.valores[a.key] ?? 0) > ds.umbrales.rojo)) : pool.filter((t) => lecturaClinica(ds.tipo, t).asimCritica)
    return { m, s, mejor, criticos }
  }, [ds, pool])
  if (!datos) return null
  const { m, s, mejor, criticos } = datos
  return (
    <div className="grid g-kpi mt" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
      <div className="card kpi">
        <div className="lab">Promedio grupal · {m.label}</div>
        <div className="val">{fmt(s.mean, m.d)}<small>{m.unidad}</small></div>
        <div className="foot">± {fmt(s.sd, m.d)} DE · n = {s.n} atletas · rango {fmt(s.min, m.d)}–{fmt(s.max, m.d)}</div>
      </div>
      <div className="card kpi">
        <div className="lab">Top performer · {m.label}</div>
        <div className="val">{mejor ? fmt(mejor.v, m.d) : '—'}<small>{m.unidad}</small></div>
        <div className="foot">{mejor ? <><b>{mejor.t.ath.nombre}</b> · {mejor.t.ath.cat} · Z {fmt(mejor.z, 2)}</> : 'Sin datos'}</div>
      </div>
      <div className={`card kpi ${criticos.length ? 'flag' : ''}`}>
        <div className="lab">Atletas con asimetría crítica</div>
        <div className="val">{criticos.length}<small>/ {pool.length}</small></div>
        <div className="foot">
          {ds.tipo === 'nordbord' ? `Asimetría de isquios > ${ds.umbrales.rojo} %` : ds.tipo === 'cmj-bilateral' ? 'Asimetría concéntrica de fuerza pico > 10 %' : ds.tipo === 'cmj-unilateral' ? 'Asimetría de aterrizaje > 15 %' : `Asimetría > ${ds.umbrales.rojo} %`}
          {criticos.length > 0 && <> · {criticos.slice(0, 3).map((t) => t.ath.nombre).join(', ')}{criticos.length > 3 ? '…' : ''}</>}
        </div>
      </div>
    </div>
  )
}

/** Tabla clínica del grupo: una fila por atleta con los hallazgos de su familia de test, ordenada por gravedad. */
export function PanelClinicoGrupal({ ds, pool, openAthlete }: { ds: DatasetU; pool: RegistroU[]; openAthlete: (k: string) => void }) {
  const cols = columnasClinicas(ds.tipo)
  const filas = useMemo(() => {
    const orden: Record<NivelClinico, number> = { critico: 0, precaucion: 1, info: 2, ok: 3 }
    return pool.map((t) => filaClinica(ds.tipo, t)).sort((a, b) => orden[a.nivel] - orden[b.nivel] || a.nombre.localeCompare(b.nombre, 'es'))
  }, [ds.tipo, pool])
  if (ds.tipo === 'generico' || cols.length === 0) return null
  const cuenta = (n: NivelClinico) => filas.filter((f) => f.nivel === n).length
  return (
    <div className="card mt">
      <h3>{TITULO_FAMILIA[ds.tipo]}</h3>
      <p className="hint">
        {cuenta('critico')} crítico(s) · {cuenta('precaucion')} en precaución · {cuenta('ok') + cuenta('info')} sin alertas. Click en un jugador para abrir su ficha.
      </p>
      <div className="tbl" style={{ maxHeight: 460 }}>
        <table className="vest">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Cat.</th>
              {cols.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.key} onClick={() => openAthlete(f.key)} style={{ cursor: 'pointer' }}>
                <td className="nm" style={{ boxShadow: `inset 4px 0 0 ${COLOR[f.nivel].texto}` }}>{f.nombre}</td>
                <td>{f.cat}</td>
                {f.celdas.map((c, i) => (
                  <td key={i} style={i === f.celdas.length - 1 ? { color: COLOR[f.nivel].texto, fontWeight: 600, whiteSpace: 'normal' } : undefined}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">{REGLAS[ds.tipo]}</div>
    </div>
  )
}

/** Hallazgos clínicos del atleta seleccionado (Ficha Individual). */
export function LecturaClinicaAtleta({ ds, reg }: { ds: DatasetU; reg: RegistroU }) {
  const lc = useMemo(() => lecturaClinica(ds.tipo, reg), [ds.tipo, reg])
  if (ds.tipo === 'generico' || lc.hallazgos.length === 0) return null
  return (
    <div className="card mt">
      <h3>{TITULO_FAMILIA[ds.tipo]}</h3>
      <p className="hint">Hallazgos del último test de {reg.ath.nombre} ({reg.iso}).</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {lc.hallazgos.map((h) => (
          <div key={h.id} style={{ background: COLOR[h.nivel].fondo, border: `1px solid ${COLOR[h.nivel].borde}`, borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ color: COLOR[h.nivel].texto, fontWeight: 700, fontSize: 13 }}>{COLOR[h.nivel].etiqueta} {h.titulo}</div>
            <div style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2, lineHeight: 1.5 }}>{h.detalle}</div>
          </div>
        ))}
      </div>
      <div className="note">{REGLAS[ds.tipo]}</div>
    </div>
  )
}

