import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAntropometriasStore } from '@/stores/useAntropometriasStore'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { useSoloLectura } from '@/hooks/useSoloLectura'
import { TEST_NORDBORD } from '@/features/evaluaciones/dinamicas'
import { useToastStore } from '@/store/useToastStore'
import { METRICS } from './constants'
import { buildCatRef, catOrder, fdate, fmt, MONTHS, monthKey, ok, poolFor } from './calculations'
import { datasetDesdeFilas, filasNordBordDesdeCsv } from './parser'
import { rosterDesdeAntropometrias } from './roster'
import { DatosTab } from './DatosTab'
import { GrupalTab } from './GrupalTab'
import { IndividualTab } from './IndividualTab'
import { ResumenDtTab } from './ResumenDtTab'
import { Crest, Svg } from './ui'
import type { MetricKey } from './types'
import './nordbord.css'

type Vista = 'dt' | 'group' | 'ind' | 'data'

const TABS: Array<{ id: Vista; label: string; icon: React.ReactNode }> = [
  { id: 'dt', label: 'Resumen DT & PF', icon: <span style={{ fontSize: 15 }}>📋</span> },
  {
    id: 'group', label: 'Informe Grupal',
    icon: (
      <Svg>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </Svg>
    ),
  },
  {
    id: 'ind', label: 'Dashboard Individual',
    icon: (
      <Svg>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </Svg>
    ),
  },
  {
    id: 'data', label: 'Datos & Calidad',
    icon: (
      <Svg>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </Svg>
    ),
  },
]

const MESES_LARGO = MONTHS

/**
 * Dashboard NordBord en PANTALLA COMPLETA (Fase 44): reemplaza la interfaz vieja
 * de "Evaluaciones de Rendimiento". Se monta con un portal sobre `document.body`
 * (`fixed inset-0`, por encima del layout de la app) y "⬅ Volver atrás" lo
 * desmonta llamando a `onBack`. Migración del HTML `NordBord Dashboard - Sep
 * 2026.html`: mismos cálculos (Z-score, percentiles, torque relativo, semáforo
 * de asimetrías 10/20 %, comparativa vs. test anterior), ahora con estado de
 * React (`useState`/`useMemo`) y gráficos Recharts.
 *
 * Datos: el CSV de NordBord se sube acá y se guarda en Supabase (tabla
 * `dynamic_evaluations`, test 'NordBord', métricas en JSONB — ver
 * `useEvaluacionesDinamicasStore`); el dashboard lee de ahí, así que lo ve todo
 * el Staff desde cualquier dispositivo. Categoría y peso salen de la última
 * antropometría del club (`useAntropometriasStore` → Supabase).
 */
export function NordBordDashboard({ onBack, backLabel = '⬅ Volver atrás' }: { onBack: () => void; backLabel?: string }) {
  const filasDb = useEvaluacionesDinamicasStore((s) => s.filas)
  const cargandoDb = useEvaluacionesDinamicasStore((s) => s.cargando)
  const errorDb = useEvaluacionesDinamicasStore((s) => s.error)
  const guardarTest = useEvaluacionesDinamicasStore((s) => s.guardarTest)
  const soloLectura = useSoloLectura()
  const showToast = useToastStore((s) => s.showToast)
  const mediciones = useAntropometriasStore((s) => s.mediciones)
  const fetchAntropometrias = useAntropometriasStore((s) => s.fetchAntropometrias)

  const rootRef = useRef<HTMLDivElement>(null)
  const [guardando, setGuardando] = useState(false)
  const [vista, setVista] = useState<Vista>('dt')
  const [winSel, setWinSel] = useState<string | null>(null)
  const [catSel, setCatSel] = useState('all')
  const [posSel, setPosSel] = useState('all')
  const [metSel, setMetSel] = useState<MetricKey | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)

  // Trae las antropometrías (peso + categoría) para el cruce; sin sesión/datos, el dashboard igual funciona.
  useEffect(() => {
    void fetchAntropometrias()
  }, [fetchAntropometrias])

  // Mientras está abierto, bloquea el scroll del fondo y cierra con Escape.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onBack])

  // Impresión: los gráficos se redibujan sin animación mientras el navegador arma la vista de impresión.
  useEffect(() => {
    const antes = () => setPrinting(true)
    const despues = () => setPrinting(false)
    window.addEventListener('beforeprint', antes)
    window.addEventListener('afterprint', despues)
    return () => {
      window.removeEventListener('beforeprint', antes)
      window.removeEventListener('afterprint', despues)
    }
  }, [])

  const roster = useMemo(() => rosterDesdeAntropometrias(mediciones), [mediciones])
  const filasNb = useMemo(() => filasDb.filter((f) => f.test_name === TEST_NORDBORD), [filasDb])
  const data = useMemo(() => (filasNb.length ? datasetDesdeFilas(filasNb, roster) : null), [filasNb, roster])
  const hidratado = !cargandoDb || filasDb.length > 0

  // ── ventanas de evaluación
  const ventanas = useMemo(() => {
    if (!data) return []
    const meses: Record<string, number> = {}
    data.tests.forEach((t) => {
      const k = monthKey(t.date)
      meses[k] = (meses[k] || 0) + 1
    })
    const keys = Object.keys(meses).sort().reverse()
    return [
      ...keys.map((k) => {
        const [y, m] = k.split('-')
        return { value: k, label: `${MESES_LARGO[+m - 1]} ${y} · ${meses[k]} tests` }
      }),
      { value: 'latest', label: 'Última evaluación de cada atleta (histórico)' },
    ]
  }, [data])
  const win = winSel && ventanas.some((v) => v.value === winSel) ? winSel : (ventanas[0]?.value ?? 'latest')
  const winLabel = (ventanas.find((v) => v.value === win)?.label ?? '').split(' · ')[0]

  const pool0 = useMemo(() => (data ? poolFor(data, win, 'all', 'all') : []), [data, win])
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {}
    pool0.forEach((t) => (c[t.ath.cat] = (c[t.ath.cat] || 0) + 1))
    return c
  }, [pool0])
  const cat = catSel === 'all' || catCounts[catSel] ? catSel : 'all'
  const posiciones = useMemo(
    () => [...new Set(pool0.filter((t) => cat === 'all' || t.ath.cat === cat).map((t) => t.ath.pos).filter((p): p is string => !!p))].sort(),
    [pool0, cat],
  )
  const pos = posiciones.includes(posSel) ? posSel : 'all'
  // Métrica por defecto: relativa si hay cobertura de peso suficiente, si no fuerza pico.
  const metDefault: MetricKey = pool0.filter((t) => ok(t.forceRel)).length < pool0.length * 0.5 ? 'forceMean' : 'forceRel'
  const met = metSel ?? metDefault
  const catRef = useMemo(() => (data ? buildCatRef(data, win) : {}), [data, win])

  function openAthlete(key: string) {
    setSel(key)
    setVista('ind')
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cambiarVista(v: Vista) {
    setVista(v)
    rootRef.current?.scrollTo({ top: 0 })
  }

  async function cargarArchivo(f: File) {
    if (soloLectura || guardando) return
    setGuardando(true)
    try {
      const r = filasNordBordDesdeCsv(await f.text())
      if (!r.ok) {
        showToast('error', r.error)
        return
      }
      if (r.filas.length === 0) {
        showToast('error', 'El archivo no tiene tests válidos (fuerza izquierda y derecha > 0 y fecha).')
        return
      }
      // Categoría de cada fila: la que resulta del cruce con la última antropometría (o "Sin categoría").
      const previo = datasetDesdeFilas(r.filas.map((x) => ({ ...x, category_label: 'Sin categoría', test_config: {} })), roster)
      const filas = r.filas.map((x) => ({ ...x, category_label: previo.athletes[x.player_key]?.cat ?? 'Sin categoría', test_config: {} }))
      const { guardadas } = await guardarTest(TEST_NORDBORD, filas, { archivo: f.name, descartados: r.descartados, cargado_en: new Date().toISOString() })
      setWinSel(null)
      setSel(null)
      setMetSel(null)
      showToast('success', `${f.name}: ${guardadas} evaluaciones guardadas en Supabase (${Object.keys(previo.athletes).length} atletas).`)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo guardar el archivo.')
    } finally {
      setGuardando(false)
    }
  }

  function imprimir() {
    if (vista === 'data') setVista('group')
    setPrinting(true)
    setTimeout(() => window.print(), 350)
  }

  const ultimo = data ? data.tests.reduce((m, t) => (t.date > m ? t.date : m), data.tests[0].date) : null
  const nombreSel = data ? (pool0.find((t) => t.key === sel) ?? [...pool0].sort((a, b) => a.name.localeCompare(b.name, 'es'))[0])?.name : ''
  const filtrosVisibles = vista !== 'dt'

  const printSub = vista === 'dt' ? 'Resumen DT & PF · Disponibilidad de isquiotibiales' : 'Fuerza excéntrica de isquiotibiales'
  const printMeta =
    vista === 'ind'
      ? `${nombreSel ?? ''} · ${cat === 'all' ? 'Todas las categorías' : cat}`
      : `${winLabel} · ${cat === 'all' ? (vista === 'dt' ? 'Plantel completo' : 'Todas las categorías') : cat}`

  const botonImprimir = (
    <button className="btn primary no-print" onClick={imprimir}>
      <Svg>
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </Svg>
      <span>{vista === 'ind' ? 'Exportar Ficha Individual (PDF)' : 'Exportar Resumen Ejecutivo (PDF)'}</span>
    </button>
  )

  const selectorArchivo = (
    <label className="btn no-print" title="Cargar otro export de NordBord (.csv)" style={guardando ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
      <Svg>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </Svg>
      {guardando ? 'Guardando…' : 'Cargar CSV'}
      <input type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void cargarArchivo(f); e.target.value = '' }} />
    </label>
  )

  const cuerpo = !hidratado ? (
    <div className="empty">Cargando…</div>
  ) : !data ? (
    <div className="card mt" style={{ maxWidth: 720, margin: '40px auto' }}>
      <h3>Dashboard NordBord</h3>
      {errorDb ? (
        <p className="hint" style={{ color: 'var(--r-tx)' }}>
          ⚠️ {errorDb} Los tests de NordBord viven en Supabase y sólo los ve el Staff con sesión iniciada.
        </p>
      ) : (
        <p className="hint">Todavía no hay ningún export cargado. {soloLectura ? '' : 'Subí el CSV de NordBord para armar el tablero.'}</p>
      )}
      {!soloLectura && (
        <label className={`drop ${arrastrando ? 'over' : ''}`} style={{ display: 'block', cursor: 'pointer' }}>
          Arrastrá acá el export de NordBord (.csv, separador , o ;) o tocá para elegirlo. Se guarda en Supabase.
          <input type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void cargarArchivo(f); e.target.value = '' }} />
        </label>
      )}
      <p className="note">
        Se reconocen solas las columnas de fuerza, torque e impulso izquierda/derecha. Categoría y peso corporal se toman de la última antropometría cargada en el club.
      </p>
    </div>
  ) : (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${vista === t.id ? 'active' : ''}`} onClick={() => cambiarVista(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {filtrosVisibles && (
        <div className="filters">
          <div className="f">
            <label htmlFor="nb-fWin">Evaluación</label>
            <select id="nb-fWin" value={win} onChange={(e) => setWinSel(e.target.value)}>
              {ventanas.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div className="f">
            <label htmlFor="nb-fCat">Categoría / División</label>
            <select id="nb-fCat" value={cat} onChange={(e) => setCatSel(e.target.value)}>
              <option value="all">Todas ({pool0.length})</option>
              {catOrder(Object.keys(catCounts)).map((c) => <option key={c} value={c}>{c} ({catCounts[c]})</option>)}
            </select>
          </div>
          <div className="f">
            <label htmlFor="nb-fPos">Posición</label>
            <select id="nb-fPos" value={pos} disabled={!posiciones.length} onChange={(e) => setPosSel(e.target.value)}>
              {posiciones.length ? (
                <>
                  <option value="all">Todas</option>
                  {posiciones.map((p) => <option key={p}>{p}</option>)}
                </>
              ) : (
                <option value="all">Sin dato de posición en el CSV</option>
              )}
            </select>
          </div>
          {vista !== 'ind' && (
            <div className="f grow" style={{ maxWidth: 340 }}>
              <label htmlFor="nb-fMet">Métrica a analizar</label>
              <select id="nb-fMet" value={met} onChange={(e) => setMetSel(e.target.value as MetricKey)}>
                {METRICS.map((m) => <option key={m.k} value={m.k}>{`${m.label} [${m.u}]${m.inv ? ' ↓ mejor' : ''}`}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {vista === 'dt' && (
        <ResumenDtTab data={data} win={win} cat={cat} onCat={setCatSel} catRef={catRef} openAthlete={openAthlete} onPrint={imprimir} ventanas={ventanas} onWin={setWinSel} />
      )}
      {vista === 'group' && <GrupalTab data={data} win={win} cat={cat} pos={pos} met={met} winLabel={winLabel} printing={printing} openAthlete={openAthlete} />}
      {vista === 'ind' && <IndividualTab data={data} win={win} cat={cat} pos={pos} catRef={catRef} sel={sel} onSel={setSel} printing={printing} />}
      {vista === 'data' && <DatosTab data={data} win={win} cat={cat} pos={pos} met={met} catRef={catRef} onFile={(f) => void cargarArchivo(f)} arrastrando={arrastrando} puedeCargar={!soloLectura} />}
    </>
  )

  return createPortal(
    <div
      ref={rootRef}
      className={`nb-root ${printing ? 'printing' : ''} ${printing && vista === 'dt' ? 'print-dt' : ''} ${printing && (vista === 'group' || vista === 'data') ? 'print-group' : ''} ${printing && vista === 'ind' ? 'print-ind' : ''}`}
      role="dialog"
      aria-label="Dashboard NordBord"
      onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault()
        setArrastrando(false)
        const f = e.dataTransfer.files?.[0]
        if (f) void cargarArchivo(f)
      }}
    >
      <div className="wrap">
        <div className="print-head">
          <Crest style={{ width: 34, height: 38 }} />
          <div>
            <h1>Club Atlético Unión de Santa Fe · Evaluación NordBord</h1>
            <div style={{ fontSize: 10, color: '#475569' }}>{printSub}</div>
          </div>
          <div className="meta">
            {printMeta}
            <br />
            Emitido {fdate(new Date())}
          </div>
        </div>

        <header className="topbar nb-topbar no-print">
          <button className="btn nb-back" onClick={onBack}>
            {backLabel}
          </button>
          <Crest />
          <div className="brand">
            <h1>Unión de Santa Fe · Performance Lab</h1>
            <div className="sub">NordBord · Fuerza excéntrica de isquiotibiales (Curl Nórdico)</div>
          </div>
          <div className="spacer" />
          {data && ultimo && (
            <div className="dsinfo">
              <b>{fmt(data.tests.length, 0)}</b> tests · <b>{Object.keys(data.athletes).length}</b> atletas
              <br />
              Último test {fdate(ultimo)}
            </div>
          )}
          {!soloLectura && selectorArchivo}
          {data && vista !== 'dt' && botonImprimir}
        </header>

        {cuerpo}
      </div>
    </div>,
    document.body,
  )
}

