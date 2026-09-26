import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSoloLectura } from '@/hooks/useSoloLectura'
import { useToastStore } from '@/store/useToastStore'
import { useAntropometriasStore } from '@/stores/useAntropometriasStore'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { catOrder, fdate, fmt, MONTHS } from '@/features/nordbord/calculations'
import { datasetDesdeFilas, filasNordBordDesdeCsv } from '@/features/nordbord/parser'
import { rosterDesdeAntropometrias } from '@/features/nordbord/roster'
import { Crest, Svg } from '@/features/nordbord/ui'
import { TEST_NORDBORD } from '../dinamicas'
import type { ConfigTest } from '../dinamicas'
import { SubirTestModal } from '../SubirTestModal'
import { useFilasEvaluaciones } from '../useFilasEvaluaciones'
import { construirDatasetU } from './datos'
import { buildCatRefU, monthKey, poolU } from './calculos'
import { DatosTab } from './DatosTab'
import { GrupalTab } from './GrupalTab'
import { IndividualTab } from './IndividualTab'
import { ResumenTab } from './ResumenTab'
import './universal.css'

type Vista = 'dt' | 'group' | 'ind' | 'data'

const TABS: Array<{ id: Vista; label: string; icon: React.ReactNode }> = [
  { id: 'dt', label: 'Resumen DT', icon: <span style={{ fontSize: 15 }}>📋</span> },
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
    id: 'ind', label: 'Ficha Individual',
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

interface Props {
  /** `test_name` en `dynamic_evaluations` ("NordBord", "CMJ Bilateral", "Velocidad 30m"…). */
  nombre: string
  onBack: () => void
  backLabel?: string
  /**
   * Configuración del test (`key_metrics`, `less_is_better`, ícono…). Pisa a la
   * guardada en las filas; si no se pasa, se usa la de `test_config`. Si el test
   * no define métricas clave se eligen solas.
   */
  config?: Partial<ConfigTest>
}

/**
 * PLANTILLA MAESTRA UNIVERSAL de tests del Hub de Evaluaciones (Fase 47) — el
 * dashboard de NordBord generalizado. Sirve para NordBord, CMJ Bilateral,
 * CMJ Unilateral y cualquier test dinámico: lee las filas de
 * `dynamic_evaluations` del test, itera sobre sus métricas (JSONB) y muestra
 * SIEMPRE las mismas 4 pestañas: Resumen DT · Informe Grupal · Ficha
 * Individual · Datos & Calidad. Semáforo clínico estricto de asimetrías
 * (< 5 % / 5–10 % / > 10 %) sólo si el test tiene métricas de asimetría.
 *
 * Pantalla completa (portal sobre `document.body`, `fixed inset-0`), botón
 * "⬅ Volver al Hub" arriba a la izquierda y PDF con `window.print()`.
 */
export function UniversalTestDashboard({ nombre, onBack, backLabel = '⬅ Volver al Hub', config }: Props) {
  const filasDb = useFilasEvaluaciones()
  const cargandoDb = useEvaluacionesDinamicasStore((s) => s.cargando)
  const errorDb = useEvaluacionesDinamicasStore((s) => s.error)
  const guardarTest = useEvaluacionesDinamicasStore((s) => s.guardarTest)
  const mediciones = useAntropometriasStore((s) => s.mediciones)
  const fetchAntropometrias = useAntropometriasStore((s) => s.fetchAntropometrias)
  const showToast = useToastStore((s) => s.showToast)
  const soloLectura = useSoloLectura()

  const rootRef = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState<Vista>('dt')
  const [winSel, setWinSel] = useState<string | null>(null)
  const [catSel, setCatSel] = useState('all')
  const [metSel, setMetSel] = useState<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [archivoPendiente, setArchivoPendiente] = useState<File | null>(null)

  const esNordBord = nombre === TEST_NORDBORD

  // Antropometrías (peso + categoría) para el cruce; sin sesión/datos, el dashboard igual funciona.
  useEffect(() => {
    void fetchAntropometrias()
  }, [fetchAntropometrias])

  // Mientras está abierto, bloquea el scroll del fondo y cierra con Escape.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !archivoPendiente) onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onBack, archivoPendiente])

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
  const filasTest = useMemo(() => filasDb.filter((f) => f.test_name === nombre), [filasDb, nombre])
  const ds = useMemo(() => (filasTest.length ? construirDatasetU(nombre, filasTest, roster, config) : null), [filasTest, roster, nombre, config])
  const hidratado = !cargandoDb || filasDb.length > 0

  // ── ventanas de evaluación
  const ventanas = useMemo(() => {
    if (!ds) return []
    const meses: Record<string, number> = {}
    ds.registros.forEach((t) => {
      const k = monthKey(t.fecha)
      meses[k] = (meses[k] || 0) + 1
    })
    return [
      ...Object.keys(meses).sort().reverse().map((k) => {
        const [y, m] = k.split('-')
        return { value: k, label: `${MONTHS[+m - 1]} ${y} · ${meses[k]} tests`, n: meses[k] }
      }),
      { value: 'latest', label: 'Última evaluación de cada atleta (histórico)', n: ds.registros.length },
    ]
  }, [ds])
  // Ventana por defecto: el mes más reciente con al menos 10 tests (un mes con 2–3 tests sueltos no representa al plantel); si no hay, el histórico.
  const ventDefault = ventanas.find((v) => v.value !== 'latest' && v.n >= 10)?.value ?? 'latest'
  const win = winSel && ventanas.some((v) => v.value === winSel) ? winSel : ventDefault
  const winLabel = (ventanas.find((v) => v.value === win)?.label ?? '').split(' · ')[0]

  const pool0 = useMemo(() => (ds ? poolU(ds, win, 'all') : []), [ds, win])
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {}
    pool0.forEach((t) => (c[t.ath.cat] = (c[t.ath.cat] || 0) + 1))
    return c
  }, [pool0])
  const cat = catSel === 'all' || catCounts[catSel] ? catSel : 'all'
  const met = ds ? (ds.visibles.find((m) => m.key === metSel) ?? ds.primaria ?? ds.visibles[0]) : undefined
  const catRef = useMemo(() => (ds ? buildCatRefU(ds, win) : {}), [ds, win])

  function openAthlete(key: string) {
    setSel(key)
    setVista('ind')
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cambiarVista(v: Vista) {
    setVista(v)
    rootRef.current?.scrollTo({ top: 0 })
  }

  /**
   * NordBord conserva su parser específico (fecha MM/DD/YYYY, columnas L/R Max Force);
   * el resto de los tests pasa por el asistente genérico (jugador, fecha, categoría, peso y métricas).
   */
  async function cargarArchivo(f: File) {
    if (soloLectura || guardando) return
    if (!esNordBord) {
      setArchivoPendiente(f)
      return
    }
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
      const previo = datasetDesdeFilas(r.filas.map((x) => ({ ...x, category_label: 'Sin categoría', test_config: {} })), roster)
      const filas = r.filas.map((x) => ({ ...x, category_label: previo.athletes[x.player_key]?.cat ?? 'Sin categoría', test_config: {} }))
      const { guardadas } = await guardarTest(TEST_NORDBORD, filas, { archivo: f.name, descartados: r.descartados, cargado_en: new Date().toISOString() })
      setWinSel(null)
      setSel(null)
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

  const ultimo = ds ? ds.registros.reduce((m, t) => (t.fecha > m ? t.fecha : m), ds.registros[0].fecha) : null
  const nombreSel = ds ? (pool0.find((t) => t.key === sel) ?? [...pool0].sort((a, b) => a.ath.nombre.localeCompare(b.ath.nombre, 'es'))[0])?.ath.nombre : ''
  const titulo = `${ds?.config.icono ?? config?.icono ?? '🧪'} ${nombre}`

  const printSub = `${nombre} · ${vista === 'dt' ? 'Resumen DT' : vista === 'ind' ? 'Ficha individual' : 'Informe grupal'}`
  const printMeta = vista === 'ind' ? `${nombreSel ?? ''} · ${cat === 'all' ? 'Todas las categorías' : cat}` : `${winLabel} · ${cat === 'all' ? 'Todas las categorías' : cat}`

  const zonaCarga = (
    <label className={`drop ${arrastrando ? 'over' : ''}`} style={{ display: 'block', cursor: 'pointer' }}>
      <b style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Subir nueva sesión (CSV/Excel) para {nombre}</b>
      Arrastrá el archivo acá o tocá para elegirlo. Se asigna automáticamente a este test.
      <input type="file" accept=".csv,.xlsx,.xls,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void cargarArchivo(f); e.target.value = '' }} />
    </label>
  )

  const cuerpo = !hidratado ? (
    <div className="empty">Cargando…</div>
  ) : !ds ? (
    <div className="card mt" style={{ maxWidth: 720, margin: '40px auto' }}>
      <h3>{titulo}</h3>
      {errorDb ? (
        <p className="hint" style={{ color: 'var(--r-tx)' }}>
          ⚠️ {errorDb} Los tests viven en Supabase y sólo los ve el Staff con sesión iniciada.
        </p>
      ) : (
        <p className="hint">Todavía no hay evaluaciones cargadas para este test. {soloLectura ? '' : 'Subí un CSV o Excel para armar el tablero.'}</p>
      )}
      {!soloLectura && zonaCarga}
      <p className="note">Se reconocen solas las columnas de jugador, fecha, categoría, peso y métricas numéricas. Las asimetrías se detectan por nombre (Asym, Asimetría, L/R) y activan el semáforo clínico.</p>
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

      {(vista === 'group' || vista === 'ind' || vista === 'data') && (
        <div className="filters">
          <div className="f">
            <label htmlFor="ut-fWin">Evaluación</label>
            <select id="ut-fWin" value={win} onChange={(e) => setWinSel(e.target.value)}>
              {ventanas.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div className="f">
            <label htmlFor="ut-fCat">Categoría / División</label>
            <select id="ut-fCat" value={cat} onChange={(e) => setCatSel(e.target.value)}>
              <option value="all">Todas ({pool0.length})</option>
              {catOrder(Object.keys(catCounts)).map((c) => <option key={c} value={c}>{c} ({catCounts[c]})</option>)}
            </select>
          </div>
          {vista === 'group' && met && (
            <div className="f grow" style={{ maxWidth: 340 }}>
              <label htmlFor="ut-fMet">Métrica a analizar</label>
              <select id="ut-fMet" value={met.key} onChange={(e) => setMetSel(e.target.value)}>
                {ds.visibles.map((m) => <option key={m.key} value={m.key}>{`${m.label}${m.unidad ? ` [${m.unidad}]` : ''}${m.menosEsMejor ? ' ↓ mejor' : ''}`}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {vista === 'dt' && <ResumenTab ds={ds} win={win} cat={cat} onCat={setCatSel} catRef={catRef} openAthlete={openAthlete} onPrint={imprimir} ventanas={ventanas} onWin={setWinSel} />}
      {vista === 'group' && met && <GrupalTab ds={ds} win={win} cat={cat} met={met} catRef={catRef} winLabel={winLabel} printing={printing} openAthlete={openAthlete} />}
      {vista === 'ind' && <IndividualTab ds={ds} win={win} cat={cat} catRef={catRef} sel={sel} onSel={setSel} printing={printing} />}
      {vista === 'data' && <DatosTab ds={ds} win={win} cat={cat} catRef={catRef} onFile={(f) => void cargarArchivo(f)} arrastrando={arrastrando} puedeCargar={!soloLectura} guardando={guardando} />}
    </>
  )

  return createPortal(
    <div
      ref={rootRef}
      className={`nb-root ${printing ? 'printing' : ''} ${printing && vista === 'dt' ? 'print-dt' : ''} ${printing && (vista === 'group' || vista === 'data') ? 'print-group' : ''} ${printing && vista === 'ind' ? 'print-ind' : ''}`}
      role="dialog"
      aria-label={`Dashboard ${nombre}`}
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
            <h1>Club Atlético Unión de Santa Fe · Evaluación {nombre}</h1>
            <div style={{ fontSize: 10, color: '#475569' }}>{printSub}</div>
          </div>
          <div className="meta">
            {printMeta}
            <br />
            Emitido {fdate(new Date())}
          </div>
        </div>

        <header className="topbar nb-topbar no-print">
          <button className="btn nb-back" onClick={onBack}>{backLabel}</button>
          <Crest />
          <div className="brand">
            <h1>{titulo}</h1>
            <div className="sub">Unión de Santa Fe · Performance Lab{ds ? ` · ${ds.clave.length} métrica${ds.clave.length === 1 ? '' : 's'} clave` : ''}</div>
          </div>
          <div className="spacer" />
          {ds && ultimo && (
            <div className="dsinfo">
              <b>{fmt(ds.registros.length, 0)}</b> tests · <b>{Object.keys(ds.atletas).length}</b> atletas
              <br />
              Último test {fdate(ultimo)}
            </div>
          )}
          {ds && (
            <button className="btn primary no-print" onClick={imprimir}>
              <Svg>
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </Svg>
              <span>{vista === 'ind' ? 'Exportar Ficha Individual (PDF)' : 'Exportar Resumen (PDF)'}</span>
            </button>
          )}
        </header>

        {cuerpo}
      </div>

      {archivoPendiente && (
        <SubirTestModal
          archivoInicial={archivoPendiente}
          nombreInicial={nombre}
          nombreBloqueado
          configBase={ds ? { icono: ds.config.icono, key_metrics: ds.config.keyMetrics, less_is_better: ds.config.lessIsBetter } : undefined}
          onClose={() => setArchivoPendiente(null)}
          onCreado={() => {
            setArchivoPendiente(null)
            setWinSel(null)
            setSel(null)
          }}
        />
      )}
    </div>,
    document.body,
  )
}
