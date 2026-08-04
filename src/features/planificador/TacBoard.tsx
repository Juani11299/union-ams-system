import { useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import type { DailyTask, TacboardElemento, TacboardTipoElemento } from '@/types'

const ICONOS: Record<TacboardTipoElemento, string> = {
  cono: '🔶',
  arco: '🥅',
  balon: '⚽',
  jugador: '🔵',
}

const PALETA_SIDEBAR: { tipo: TacboardTipoElemento; label: string }[] = [
  { tipo: 'cono', label: 'Cono' },
  { tipo: 'arco', label: 'Arco' },
  { tipo: 'balon', label: 'Balón' },
  { tipo: 'jugador', label: 'Jugador' },
]

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

interface TacBoardProps {
  tarea: DailyTask
}

/**
 * Editor táctico 2D — Fase 11. Sin librerías nuevas: posicionamiento libre por
 * porcentaje (0-100) del ancho/alto de la cancha vía pointer events (mueve
 * elementos ya puestos, funciona igual en mouse/touch) + HTML5 drag-and-drop
 * desde la barra lateral (desktop) con un botón "tap para agregar" como
 * respaldo (iOS Safari no soporta bien HTML5 DnD por touch).
 */
export function TacBoard({ tarea }: TacBoardProps) {
  const updateDailyTaskTacboard = useAppStore((s) => s.updateDailyTaskTacboard)
  const showToast = useToastStore((s) => s.showToast)

  const [elementos, setElementos] = useState<TacboardElemento[]>(tarea.tacboardData?.elementos ?? [])
  const [colorActivo, setColorActivo] = useState<'azul' | 'rojo'>('azul')
  const [seleccionId, setSeleccionId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const canchaRef = useRef<HTMLDivElement>(null)
  const arrastrandoId = useRef<string | null>(null)

  const numerosExistentes = (tarea.tacboardData?.elementos ?? [])
    .filter((e) => e.tipo === 'jugador')
    .map((e) => e.numero ?? 0)
  const siguienteNumero = useRef(numerosExistentes.length > 0 ? Math.max(...numerosExistentes) + 1 : 1)

  function agregarElemento(tipo: TacboardTipoElemento, xPct: number, yPct: number) {
    const nuevo: TacboardElemento = {
      id: nuevoId(),
      tipo,
      x: Math.min(96, Math.max(4, xPct)),
      y: Math.min(96, Math.max(4, yPct)),
      ...(tipo === 'jugador' ? { numero: siguienteNumero.current++, color: colorActivo } : {}),
    }
    setElementos((els) => [...els, nuevo])
  }

  function handleDropEnCancha(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const tipo = e.dataTransfer.getData('text/tacboard-tipo') as TacboardTipoElemento
    if (!tipo) return
    const rect = canchaRef.current?.getBoundingClientRect()
    if (!rect) return
    agregarElemento(tipo, ((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100)
  }

  function handleTapAgregar(tipo: TacboardTipoElemento) {
    agregarElemento(tipo, 45 + Math.random() * 10, 45 + Math.random() * 10)
  }

  function handlePointerDownElemento(e: React.PointerEvent<HTMLDivElement>, id: string) {
    setSeleccionId(id)
    arrastrandoId.current = id
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMoveCancha(e: React.PointerEvent<HTMLDivElement>) {
    const id = arrastrandoId.current
    if (!id) return
    const rect = canchaRef.current?.getBoundingClientRect()
    if (!rect) return
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    setElementos((els) =>
      els.map((el) =>
        el.id === id
          ? { ...el, x: Math.min(97, Math.max(3, xPct)), y: Math.min(97, Math.max(3, yPct)) }
          : el,
      ),
    )
  }

  function handlePointerUp() {
    arrastrandoId.current = null
  }

  function eliminarSeleccionado() {
    if (!seleccionId) return
    setElementos((els) => els.filter((el) => el.id !== seleccionId))
    setSeleccionId(null)
  }

  async function handleGuardar() {
    setGuardando(true)
    try {
      await updateDailyTaskTacboard(tarea.id, { elementos })
      showToast('success', '¡Pizarra táctica guardada!')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar la pizarra táctica.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Arrastrá un ícono a la cancha (o tocalo para agregarlo). Un elemento ya puesto se mueve
          arrastrándolo directo.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setElementos([])}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Limpiar cancha
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="rounded-lg bg-union-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar pizarra'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:w-32 sm:flex-col sm:flex-nowrap">
          {PALETA_SIDEBAR.map((item) => (
            <button
              key={item.tipo}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/tacboard-tipo', item.tipo)}
              onClick={() => handleTapAgregar(item.tipo)}
              className="flex flex-1 cursor-grab flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-600 hover:bg-slate-50 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span className="text-xl" aria-hidden>
                {ICONOS[item.tipo]}
              </span>
              {item.label}
            </button>
          ))}

          <div className="flex gap-1 sm:mt-1">
            <button
              type="button"
              onClick={() => setColorActivo('azul')}
              aria-label="Equipo azul"
              className={`h-7 flex-1 rounded-md border-2 bg-sky-500 ${colorActivo === 'azul' ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
            />
            <button
              type="button"
              onClick={() => setColorActivo('rojo')}
              aria-label="Equipo rojo"
              className={`h-7 flex-1 rounded-md border-2 bg-rose-500 ${colorActivo === 'rojo' ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
            />
          </div>

          {seleccionId && (
            <button
              type="button"
              onClick={eliminarSeleccionado}
              className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
            >
              ✕ Eliminar seleccionado
            </button>
          )}
        </div>

        <div
          ref={canchaRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropEnCancha}
          onPointerMove={handlePointerMoveCancha}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSeleccionId(null)
          }}
          className="relative aspect-[3/4] w-full flex-1 touch-none select-none overflow-hidden rounded-lg bg-emerald-600"
        >
          <svg
            viewBox="0 0 100 133"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <rect x="2" y="2" width="96" height="129" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
            <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="white" strokeWidth="0.5" opacity="0.8" />
            <circle cx="50" cy="66.5" r="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
            <rect x="25" y="2" width="50" height="16" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
            <rect x="25" y="115" width="50" height="16" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
          </svg>

          {elementos.map((el) => (
            <div
              key={el.id}
              onPointerDown={(e) => handlePointerDownElemento(e, el.id)}
              style={{ left: `${el.x}%`, top: `${el.y}%` }}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full active:cursor-grabbing ${
                seleccionId === el.id ? 'ring-2 ring-white ring-offset-2 ring-offset-emerald-600' : ''
              }`}
            >
              {el.tipo === 'jugador' ? (
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${el.color === 'rojo' ? 'bg-rose-500' : 'bg-sky-500'}`}
                >
                  {el.numero}
                </span>
              ) : (
                <span className="text-2xl drop-shadow" aria-hidden>
                  {ICONOS[el.tipo]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
