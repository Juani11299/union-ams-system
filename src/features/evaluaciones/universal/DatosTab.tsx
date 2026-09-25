import { useMemo, useState } from 'react'
import { fdate, fmt } from '@/features/nordbord/calculations'
import { LvlPill } from '@/features/nordbord/ui'
import { asymLvlGenerico, ASIM_COLOR } from './semaforo'
import { estadoU, LVL_TXT_U, poolU } from './calculos'
import type { CatRefU, DatasetU, RegistroU, Ventana } from './tipos'

interface Props {
  ds: DatasetU
  win: Ventana
  cat: string
  catRef: CatRefU
  onFile: (f: File) => void
  arrastrando: boolean
  puedeCargar: boolean
  guardando: boolean
}

function Chips({ items, cls = '' }: { items: string[]; cls?: string }) {
  return <div className="chips">{items.length ? items.map((h, i) => <span key={`${h}-${i}`} className={`chip ${cls}`}>{h}</span>) : <span className="note">—</span>}</div>
}

/** Datos & Calidad — smart parsing del test, cruce con antropometrías (peso corporal), panel para subir un CSV nuevo y tabla cruda de datos. */
export function DatosTab({ ds, win, cat, catRef, onFile, arrastrando, puedeCargar, guardando }: Props) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: 'nombre', dir: 1 })
  const mt = ds.match
  const n = Object.keys(ds.atletas).length
  const vinculados = mt.exact.length + mt.fuzzy.length
  const cols = useMemo(() => [...ds.clave, ...ds.asimetrias.filter((m) => !m.clave)].slice(0, 10), [ds])
  const pool = useMemo(() => poolU(ds, win, cat), [ds, win, cat])

  const filas = useMemo(() => {
    const val = (t: RegistroU, k: string): string | number | null => (k === 'nombre' ? t.ath.nombre : k === 'cat' ? t.ath.cat : k === 'fecha' ? t.iso : k === 'bw' ? t.ath.bw : (t.valores[k] ?? null))
    return [...pool].sort((a, b) => {
      const x = val(a, sort.k)
      const y = val(b, sort.k)
      if (x == null) return 1
      if (y == null) return -1
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir
    })
  }, [pool, sort])

  function descargarCsv() {
    const hdr = ['Atleta', 'Categoria', 'Fecha', 'Peso_kg', ...cols.map((m) => m.key), 'Estado']
    const data = filas.map((t) => [t.ath.nombre, t.ath.cat, t.iso, t.ath.bw ?? '', ...cols.map((m) => t.valores[m.key] ?? ''), LVL_TXT_U[estadoU(t, ds, catRef).lvl]])
    const csv = '﻿' + [hdr, ...data].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${ds.config.nombre.replace(/[^\w-]+/g, '_')}_procesado.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const ordenar = (k: string) => setSort((s) => ({ k, dir: s.k === k ? (-s.dir as 1 | -1) : k === 'nombre' || k === 'cat' ? 1 : -1 }))
  const flecha = (k: string) => (sort.k === k ? (sort.dir > 0 ? ' ▲' : ' ▼') : '')

  return (
    <section className="view active" id="v-data">
      <div className="grid g-2">
        <div className="card">
          <h3>Smart Parsing del test</h3>
          <p className="hint">
            Origen <b>{ds.origen}</b> · {ds.registros.length} registros · <b>{ds.metricas.filter((m) => !m.derivada).length}</b> métricas en el JSONB · <b>{n}</b> atletas · {ds.descartados} fila(s) del archivo descartadas al importar.
          </p>
          <p className="note" style={{ margin: '0 0 6px' }}><b>Métricas clave</b> (protagonizan Resumen, Grupal y Radar) — {ds.clave.length}</p>
          <Chips items={ds.clave.map((m) => `${m.label}${m.menosEsMejor ? ' ↓' : ''}`)} cls="m" />
          <p className="note" style={{ margin: '12px 0 6px' }}>
            <b>Asimetrías detectadas</b> ({ds.asimetrias.length}) {ds.asimetrias.length ? '— semáforo clínico: < 5 % verde · 5–10 % amarillo · > 10 % rojo' : '— este test no trae asimetrías: la sección se oculta'}
          </p>
          <Chips items={ds.asimetrias.map((m) => m.label)} />
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Calculadas por la plantilla</b> (media I/D, asimetría de pares L/R, valores relativos al peso)</p>
          <Chips items={ds.metricas.filter((m) => m.derivada).map((m) => m.label)} />
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Otras métricas</b> ({ds.metricas.filter((m) => !m.clave && !m.esAsim && !m.derivada).length})</p>
          <Chips items={ds.metricas.filter((m) => !m.clave && !m.esAsim && !m.derivada).slice(0, 16).map((m) => m.key).concat(ds.metricas.filter((m) => !m.clave && !m.esAsim && !m.derivada).length > 16 ? ['…'] : [])} cls="x" />
          <p className="note">Las métricas de "menos es mejor" (↓) invierten el Z-score y el percentil. Las claves y las inversas se definen al crear el test (Hub → Subir Nuevo Test).</p>
        </div>

        <div className="card">
          <h3>Cruce con antropometrías</h3>
          <p className="hint">
            Se cruzó por apellido + inicial contra la última antropometría cargada en el club ({ds.rosterSize} jugadores) para obtener categoría y peso corporal. <b>{vinculados}/{n}</b> atletas vinculados{mt.fuzzy.length > 0 && ` (${mt.fuzzy.length} por similitud ortográfica)`}; <b>{ds.conPeso}</b> con peso corporal.
            {ds.rosterSize === 0 && ' No hay antropometrías disponibles: los atletas quedan en la categoría del archivo (o "Sin categoría") y sin métricas relativas al peso.'}
          </p>
          {mt.fuzzy.length > 0 && (<><p className="note" style={{ margin: '0 0 6px' }}><b>Vinculados por similitud</b> — verificar</p><Chips items={mt.fuzzy} cls="m" /></>)}
          {mt.amb.length > 0 && (<><p className="note" style={{ margin: '12px 0 6px' }}><b>Ambiguos</b> (no asignados)</p><Chips items={mt.amb} /></>)}
          {mt.meta.length > 0 && (<><p className="note" style={{ margin: '12px 0 6px' }}><b>Peso tomado del archivo</b> ({mt.meta.length})</p><Chips items={mt.meta} /></>)}
          <p className="note" style={{ margin: '12px 0 6px' }}><b>Sin ficha antropométrica</b> ({mt.none.length}) → categoría del archivo, sin peso</p>
          <Chips items={mt.none} />
          {puedeCargar ? (
            <label className={`drop mt no-print ${arrastrando ? 'over' : ''}`} style={{ display: 'block', cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>
              {guardando ? 'Guardando en Supabase…' : `Arrastrá acá un nuevo CSV/Excel de ${ds.config.nombre} o tocá para elegirlo: se guarda en Supabase y, si un jugador ya tenía ese día, se actualiza.`}
              <input type="file" accept=".csv,.xlsx,.xls,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
            </label>
          ) : (
            <p className="note">Vista de sólo lectura: la carga de archivos nuevos requiere sesión de Staff.</p>
          )}
        </div>
      </div>

      <div className="card mt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h3>Tabla de datos (grupo filtrado)</h3>
            <p className="hint" style={{ margin: 0 }}>Un registro por atleta (último test de la ventana). Click en los encabezados para ordenar.</p>
          </div>
          <button className="btn no-print" onClick={descargarCsv}>Descargar CSV procesado</button>
        </div>
        <div className="tbl mt">
          <table>
            <thead>
              <tr>
                <th onClick={() => ordenar('nombre')}>Atleta{flecha('nombre')}</th>
                <th onClick={() => ordenar('cat')}>Cat.{flecha('cat')}</th>
                <th onClick={() => ordenar('fecha')}>Fecha{flecha('fecha')}</th>
                <th className="num" onClick={() => ordenar('bw')}>Peso{flecha('bw')}</th>
                {cols.map((m) => <th key={m.key} className="num" onClick={() => ordenar(m.key)}>{m.label}{m.unidad ? ` (${m.unidad})` : ''}{flecha(m.key)}</th>)}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((t) => (
                <tr key={t.key}>
                  <td>{t.ath.nombre}</td>
                  <td>{t.ath.cat}</td>
                  <td>{fdate(t.fecha)}</td>
                  <td className="num">{fmt(t.ath.bw, 1)}</td>
                  {cols.map((m) => (
                    <td key={m.key} className="num" style={m.esAsim && t.valores[m.key] !== undefined ? { color: ASIM_COLOR[asymLvlGenerico(t.valores[m.key])], fontWeight: 700 } : undefined}>
                      {fmt(t.valores[m.key], m.d)}
                    </td>
                  ))}
                  <td><LvlPill lvl={estadoU(t, ds, catRef).lvl} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

