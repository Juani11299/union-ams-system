import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloLectura } from '@/hooks/useSoloLectura'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { TEST_CMJ_BILATERAL, TEST_CMJ_UNILATERAL, TEST_NORDBORD, TESTS_FIJOS, testsDesdeFilas } from './dinamicas'
import type { FilaEvaluacionDinamica } from './dinamicas'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SubirTestModal } from './SubirTestModal'
import { useFilasEvaluaciones } from './useFilasEvaluaciones'

interface TarjetaProps {
  icono: string
  titulo: string
  descripcion: string
  detalle: string
  onClick: () => void
  acento: string
  onEliminar?: () => void
}

function Tarjeta({ icono, titulo, descripcion, detalle, onClick, acento, onEliminar }: TarjetaProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-union-red-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-union-red-500/50"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${acento}`} aria-hidden>
            {icono}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-colors group-hover:bg-union-red-50 group-hover:text-union-red-700 dark:bg-slate-800 dark:text-slate-400">
            Abrir →
          </span>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{titulo}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{descripcion}</p>
        </div>
        <p className="mt-auto border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">{detalle}</p>
      </button>
      {onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar test"
          className="absolute right-14 top-4 hidden rounded-md px-1.5 py-0.5 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 group-hover:block dark:hover:bg-rose-500/10"
        >
          🗑️
        </button>
      )}
    </div>
  )
}

/**
 * Hub de Evaluaciones de Rendimiento (Centro de Comando) — `/evaluaciones`.
 * Grid de tarjetas: NordBord, ForceDecks (CMJ), un test por cada CSV nuevo que
 * suba el staff, y la tarjeta maestra PERFIL DE ATLETA 360°. Cada tarjeta abre
 * su dashboard en pantalla completa (ruta hija, botón "⬅ Volver al Hub").
 */
export function EvaluacionesHub() {
  const navigate = useNavigate()
  const soloLectura = useSoloLectura()
  const filas = useFilasEvaluaciones()
  const cargando = useEvaluacionesDinamicasStore((s) => s.cargando)
  const error = useEvaluacionesDinamicasStore((s) => s.error)
  const fetchEvaluaciones = useEvaluacionesDinamicasStore((s) => s.fetchEvaluaciones)
  const eliminarTest = useEvaluacionesDinamicasStore((s) => s.eliminarTest)
  const showToast = useToastStore((s) => s.showToast)
  // Tests propios (los creados con "Crear Nuevo Test"): los fijos tienen su tarjeta aparte.
  const tests = useMemo(() => testsDesdeFilas(filas).filter((t) => !TESTS_FIJOS.includes(t.id)), [filas])
  const resumen = (nombre: string) => {
    const r: FilaEvaluacionDinamica[] = filas.filter((f) => f.test_name === nombre)
    return { filas: r.length, jugadores: new Set(r.map((f) => f.player_key)).size, ultima: r.reduce((m, f) => (f.fecha > m ? f.fecha : m), ''), archivo: r.map((f) => f.test_config.archivo).filter(Boolean).pop() ?? '' }
  }
  const detalleFijo = (nombre: string) => {
    const r = resumen(nombre)
    return r.filas ? `${r.filas} evaluaciones · ${r.jugadores} jugadores · último test ${r.ultima}${r.archivo ? ` · 📄 ${r.archivo}` : ''}` : cargando ? 'Cargando desde Supabase…' : 'Sin datos todavía — subí el CSV adentro'
  }
  const [subiendo, setSubiendo] = useState(false)
  const [aBorrar, setABorrar] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)

  const fuentes = 3 + tests.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">EVALUACIONES DE RENDIMIENTO</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Centro de comando: cada prueba tiene su dashboard, y el Perfil 360° las cruza todas.</p>
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span>
            ⚠️ {error} NordBord y los tests propios se guardan en Supabase y sólo los ve el Staff con sesión iniciada.
          </span>
          <button type="button" onClick={() => void fetchEvaluaciones()} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">
            Reintentar
          </button>
        </div>
      )}

      {/* Tarjeta maestra */}
      <button
        type="button"
        onClick={() => navigate('/evaluaciones/perfil')}
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-union-red-600 via-rose-700 to-slate-900 p-7 text-left text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <span className="pointer-events-none absolute -right-8 -top-10 select-none text-[11rem] leading-none opacity-10" aria-hidden>
          ◎
        </span>
        <div className="relative flex flex-col gap-3">
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">Vista maestra</span>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">PERFIL DE ATLETA 360°</h2>
          <p className="max-w-2xl text-sm text-white/85">
            Integra NordBord, ForceDecks, Antropometrías y todos los tests que subas: radar neuromuscular unificado, alertas que cruzan pruebas (ej. asimetría de isquios + salto bajo) y cuadrantes para clasificar al plantel.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/15 px-2.5 py-1">{fuentes + 1} fuentes de datos</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">Radar unificado</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">Global Smart Insights</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">Cuadrantes X/Y</span>
            <span className="ml-auto rounded-full bg-white px-4 py-1.5 font-bold text-union-red-700 transition-transform group-hover:translate-x-1">Abrir perfil →</span>
          </div>
        </div>
      </button>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tarjeta
          icono="🦵"
          titulo="NordBord (Fuerza Isométrica/Excéntrica)"
          descripcion="Curl nórdico: fuerza excéntrica de isquiotibiales, asimetrías con semáforo, ranking y ficha individual."
          detalle={detalleFijo(TEST_NORDBORD)}
          acento="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"
          onClick={() => navigate(`/evaluaciones/test/${encodeURIComponent(TEST_NORDBORD)}`)}
        />
        <Tarjeta
          icono="⚡"
          titulo="ForceDecks (CMJ Bilateral)"
          descripcion="Salto con contramovimiento sobre dos piernas: altura, RSI-modificado, fuerza relativa y asimetrías de aterrizaje."
          detalle={detalleFijo(TEST_CMJ_BILATERAL)}
          acento="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          onClick={() => navigate(`/evaluaciones/test/${encodeURIComponent(TEST_CMJ_BILATERAL)}`)}
        />
        <Tarjeta
          icono="🦿"
          titulo="ForceDecks (CMJ Unilateral)"
          descripcion="Salto a una pierna (SLJ / CMJ 1PP): comparación entre lados con semáforo clínico de asimetrías."
          detalle={detalleFijo(TEST_CMJ_UNILATERAL)}
          acento="bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
          onClick={() => navigate(`/evaluaciones/test/${encodeURIComponent(TEST_CMJ_UNILATERAL)}`)}
        />
        <Tarjeta
          icono="🧹"
          titulo="🧹 Limpieza de Datos (Data Wrangler)"
          descripcion="Subí el Excel/CSV de cualquier test, auditá celdas sospechosas (nulos, ceros, ±3 DE), eliminá intentos fallidos, corregí tipeos y descargá un CSV limpio."
          detalle="Herramienta de pre-procesamiento · todo en tu navegador"
          acento="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          onClick={() => navigate('/evaluaciones/limpieza')}
        />
        {tests.map((t) => (
          <Tarjeta
            key={t.id}
            icono={t.icono}
            titulo={t.nombre}
            descripcion={`Test propio · ${t.metricas.length} métricas detectadas en ${t.archivo}.`}
            detalle={`${t.filas.length} evaluaciones · ${new Set(t.filas.map((f) => f.jugador)).size} jugadores${t.creadoEn ? ` · cargado ${new Date(t.creadoEn).toLocaleDateString('es-AR')}` : ''}`}
            acento="bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
            onClick={() => navigate(`/evaluaciones/test/${encodeURIComponent(t.id)}`)}
            onEliminar={soloLectura || filas.filter((f) => f.test_name === t.id).every((f) => f.test_config.desde_legacy) ? undefined : () => setABorrar(t.id)}
          />
        ))}
        {!soloLectura && (
          <button
            type="button"
            onClick={() => setSubiendo(true)}
            className="flex min-h-[140px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-300 p-4 text-center text-slate-400 transition-colors hover:border-union-red-400 hover:bg-union-red-50/50 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-union-red-500/5"
          >
            <span className="text-sm font-semibold">＋ Crear Nuevo Test</span>
            <span className="text-xs">Para un protocolo que nunca se evaluó antes</span>
          </button>
        )}
      </div>

      {subiendo && (
        <SubirTestModal
          onClose={() => setSubiendo(false)}
          onCreado={(id) => {
            setSubiendo(false)
            navigate(`/evaluaciones/test/${encodeURIComponent(id)}`)
          }}
        />
      )}
      {aBorrar && (
        <ConfirmDialog
          titulo="Eliminar test"
          mensaje="Se borran TODAS las evaluaciones de este test de Supabase: desaparece para todo el Staff y del Perfil 360°. El archivo original no se toca. ¿Seguro?"
          confirmando={borrando}
          onConfirm={async () => {
            setBorrando(true)
            try {
              await eliminarTest(aBorrar)
              showToast('success', 'Test eliminado.')
            } catch (err) {
              showToast('error', getErrorMessage(err, 'No se pudo eliminar el test.'))
            } finally {
              setBorrando(false)
              setABorrar(null)
            }
          }}
          onCancel={() => setABorrar(null)}
        />
      )}
    </div>
  )
}
