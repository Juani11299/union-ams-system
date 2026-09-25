import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloLectura } from '@/hooks/useSoloLectura'
import { useAppStore } from '@/store/useAppStore'
import { useNordBordStore } from '@/stores/useNordBordStore'
import { useTestsDinamicosStore } from '@/stores/useTestsDinamicosStore'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SubirTestModal } from './SubirTestModal'

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
  const csv = useNordBordStore((s) => s.csv)
  const cmj = useAppStore((s) => s.performanceEvaluations)
  const tests = useTestsDinamicosStore((s) => s.tests)
  const eliminar = useTestsDinamicosStore((s) => s.eliminar)
  const [subiendo, setSubiendo] = useState(false)
  const [aBorrar, setABorrar] = useState<string | null>(null)

  const cmjJugadores = new Set(cmj.map((e) => e.playerKey)).size
  const cmjUltima = cmj.reduce((m, e) => (e.fecha > m ? e.fecha : m), '')
  const cmjTipos = [...new Set(cmj.map((e) => e.evaluationName))]
  const fuentes = 2 + tests.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">EVALUACIONES DE RENDIMIENTO</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Centro de comando: cada prueba tiene su dashboard, y el Perfil 360° las cruza todas.</p>
        </div>
        {!soloLectura && (
          <button
            type="button"
            onClick={() => setSubiendo(true)}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-union-red-700"
          >
            ＋ Subir Nuevo Test
          </button>
        )}
      </div>

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
          descripcion="Curl nórdico: fuerza excéntrica de isquiotibiales, asimetrías con semáforo, Resumen DT & PF y ficha individual."
          detalle={csv ? `📄 ${csv.nombre} · cargado ${new Date(csv.cargadoEn).toLocaleDateString('es-AR')}` : 'Sin export cargado — subí el CSV adentro'}
          acento="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"
          onClick={() => navigate('/evaluaciones/nordbord')}
        />
        <Tarjeta
          icono="⚡"
          titulo="ForceDecks (CMJ)"
          descripcion="Saltos bilaterales y unilaterales: altura, RSI-modificado, fuerza relativa, asimetrías y Smart Analysis por jugador."
          detalle={cmj.length ? `${cmj.length} evaluaciones · ${cmjJugadores} jugadores · última ${cmjUltima} · ${cmjTipos.slice(0, 3).join(', ')}${cmjTipos.length > 3 ? '…' : ''}` : 'Sin evaluaciones cargadas todavía'}
          acento="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          onClick={() => navigate('/evaluaciones/cmj')}
        />
        {tests.map((t) => (
          <Tarjeta
            key={t.id}
            icono={t.icono}
            titulo={t.nombre}
            descripcion={`Test propio · ${t.metricas.length} métricas detectadas en ${t.archivo}.`}
            detalle={`${t.filas.length} evaluaciones · ${new Set(t.filas.map((f) => f.jugador)).size} jugadores · creado ${new Date(t.creadoEn).toLocaleDateString('es-AR')}`}
            acento="bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
            onClick={() => navigate(`/evaluaciones/test/${t.id}`)}
            onEliminar={soloLectura ? undefined : () => setABorrar(t.id)}
          />
        ))}
        {!soloLectura && (
          <button
            type="button"
            onClick={() => setSubiendo(true)}
            className="flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-center text-slate-500 transition-colors hover:border-union-red-400 hover:bg-union-red-50/50 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-union-red-500/5"
          >
            <span className="text-3xl" aria-hidden>
              ＋
            </span>
            <span className="text-sm font-semibold">Subir Nuevo Test</span>
            <span className="text-xs">Cargá un CSV/Excel, nombralo y se crea su tarjeta acá</span>
          </button>
        )}
      </div>

      {subiendo && (
        <SubirTestModal
          onClose={() => setSubiendo(false)}
          onCreado={(id) => {
            setSubiendo(false)
            navigate(`/evaluaciones/test/${id}`)
          }}
        />
      )}
      {aBorrar && (
        <ConfirmDialog
          titulo="Eliminar test"
          mensaje="Se borra el test y su tarjeta de este navegador (también deja de aparecer en el Perfil 360°). El archivo original no se toca. ¿Seguro?"
          confirmando={false}
          onConfirm={() => {
            eliminar(aBorrar)
            setABorrar(null)
          }}
          onCancel={() => setABorrar(null)}
        />
      )}
    </div>
  )
}
