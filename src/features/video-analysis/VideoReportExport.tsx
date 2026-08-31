import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAthletesActivos, useAppStore } from '@/store/useAppStore'
import { EVENTO_ICONO, EVENTO_LABEL, FASE_LABEL, formatTimestamp, coordenadasDeZona, zonaLabel } from './videoAnalysisConstants'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'
import type { VideoMatch, VideoTag } from '@/types'

interface VideoReportExportProps {
  /** Título del informe — el nombre del partido (uso normal) o el concepto de una Smart Playlist ("Todas las Recuperaciones en Campo Rival"). */
  titulo: string
  subtitulo: string
  tags: VideoTag[]
  matches: VideoMatch[]
  onClose: () => void
}

/**
 * Exportación de Informe de Video (Fase 34, Paso 5; generalizado en Fase
 * 34.2 para servir tanto al informe de UN partido como a una Smart
 * Playlist que cruza varios). Dos pasos: elegir qué clips entran
 * (checkboxes, todos tildados por defecto) y generar el PDF. Reusa
 * exactamente la arquitectura de impresión ya establecida en la plataforma
 * (`.print-area`, `createPortal(..., document.body)` para escapar de
 * cualquier ancestro `position:fixed`/`overflow` — mismo fix que
 * `BulkComplementaryPdfExport.tsx`).
 */
export function VideoReportExport({ titulo, subtitulo, tags, matches, onClose }: VideoReportExportProps) {
  const athletes = useAthletesActivos()
  const club = useAppStore((s) => s.club)

  const [seleccionados, setSeleccionados] = useState<Set<string>>(() => new Set(tags.map((t) => t.id)))
  const [imprimiendo, setImprimiendo] = useState(false)

  function toggle(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clipsElegidos = tags
    .filter((t) => seleccionados.has(t.id))
    .sort((a, b) => a.timestampSegundos - b.timestampSegundos)
  const esMultiPartido = new Set(tags.map((t) => t.matchId)).size > 1

  if (imprimiendo) {
    return (
      <ReporteImprimible
        titulo={titulo}
        subtitulo={subtitulo}
        tags={clipsElegidos}
        matches={matches}
        athletes={athletes}
        clubNombre={club?.nombre ?? 'C.A. Unión'}
        mostrarColumnaPartido={esMultiPartido}
        onClose={() => {
          setImprimiendo(false)
          onClose()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">📄 {titulo}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitulo} — elegí qué clips incluir.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tags.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No hay clips que coincidan con este concepto.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {tags.map((tag) => {
                const jugador = athletes.find((a) => a.id === tag.athleteId)
                const match = matches.find((m) => m.id === tag.matchId)
                return (
                  <li key={tag.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(tag.id)}
                        onChange={() => toggle(tag.id)}
                        className="h-4 w-4 rounded border-slate-300 text-union-red-600 focus:ring-union-red-500"
                      />
                      <span className="font-mono text-xs font-semibold text-union-red-600">
                        {formatTimestamp(tag.timestampSegundos)}
                      </span>
                      <span>{EVENTO_ICONO[tag.tipo]}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
                        {EVENTO_LABEL[tag.tipo]}
                        {jugador ? ` — ${jugador.nombre}` : ''}
                      </span>
                      {esMultiPartido && match && (
                        <span className="shrink-0 truncate text-[10px] text-slate-400">{match.title}</span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <span className="text-xs text-slate-400">{clipsElegidos.length} clip(s) seleccionados</span>
          <button
            type="button"
            onClick={() => setImprimiendo(true)}
            disabled={clipsElegidos.length === 0}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🖨️ Generar Informe (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}

interface ReporteImprimibleProps {
  titulo: string
  subtitulo: string
  tags: VideoTag[]
  matches: VideoMatch[]
  athletes: ReturnType<typeof useAthletesActivos>
  clubNombre: string
  mostrarColumnaPartido: boolean
  onClose: () => void
}

/** Mini-gráfico táctico (Fase 34.2, Paso 3) — silueta de cancha de ~60x38px con un punto en la zona del evento, para que el informe impreso muestre de un vistazo DÓNDE pasó cada jugada, no sólo cuándo. */
function MiniCanchaZona({ zona }: { zona: VideoTag['zona'] }) {
  const ANCHO = 60
  const ALTO = 38
  if (!zona) {
    return (
      <svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} className="shrink-0">
        <rect x={1} y={1} width={ANCHO - 2} height={ALTO - 2} fill="#1e7a3d" stroke="#94a3b8" strokeWidth={1} />
      </svg>
    )
  }
  const { x, y } = coordenadasDeZona(zona)
  return (
    <svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} className="shrink-0">
      <title>{zonaLabel(zona)}</title>
      <rect x={1} y={1} width={ANCHO - 2} height={ALTO - 2} fill="#1e7a3d" stroke="#94a3b8" strokeWidth={1} />
      <line x1={ANCHO / 2} y1={1} x2={ANCHO / 2} y2={ALTO - 1} stroke="#f8fafc" strokeWidth={0.75} opacity={0.6} />
      <circle cx={x * ANCHO} cy={y * ALTO} r={3.5} fill="#ed1c24" stroke="#ffffff" strokeWidth={1} />
    </svg>
  )
}

function ReporteImprimible({
  titulo,
  subtitulo,
  tags,
  matches,
  athletes,
  clubNombre,
  mostrarColumnaPartido,
  onClose,
}: ReporteImprimibleProps) {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = `
      @page { size: A4 portrait; margin: 12mm; }
      @media print {
        body, html, #root { height: auto !important; overflow: visible !important; }
      }
    `
    document.head.appendChild(styleEl)

    function handleAfterPrint() {
      onClose()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    window.print()

    return () => {
      styleEl.remove()
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onClose])

  return createPortal(
    <div className="hidden print-area print:block">
      <div className="flex items-start justify-between gap-4 border-b-4 border-union-red-600 pb-3">
        <div className="flex items-center gap-3">
          <img src="/logo-union.png" alt="" className="h-14 w-14 shrink-0 object-contain" />
          <div>
            <p className="text-xl font-bold text-union-charcoal">{titulo}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {clubNombre} — {subtitulo}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded bg-union-charcoal px-3 py-1.5 text-xs font-bold text-white">🎥 Análisis de Video</div>
      </div>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-union-charcoal text-left text-[10px] uppercase tracking-wide text-white">
            <th className="border border-slate-300 px-2 py-1.5">Zona</th>
            <th className="border border-slate-300 px-2 py-1.5">Minuto</th>
            <th className="border border-slate-300 px-2 py-1.5">Evento</th>
            <th className="border border-slate-300 px-2 py-1.5">Jugador</th>
            <th className="border border-slate-300 px-2 py-1.5">Fase</th>
            {mostrarColumnaPartido && <th className="border border-slate-300 px-2 py-1.5">Partido</th>}
            <th className="border border-slate-300 px-2 py-1.5">Nota</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => {
            const jugador = athletes.find((a) => a.id === tag.athleteId)
            const match = matches.find((m) => m.id === tag.matchId)
            return (
              <tr key={tag.id} className="break-inside-avoid">
                <td className="border border-slate-300 p-1 align-top">
                  <MiniCanchaZona zona={tag.zona} />
                </td>
                <td className="border border-slate-300 px-2 py-2 align-top font-mono font-semibold text-slate-700">
                  {formatTimestamp(tag.timestampSegundos)}
                </td>
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-700">
                  {EVENTO_ICONO[tag.tipo]} {EVENTO_LABEL[tag.tipo]}
                </td>
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-700">{jugador?.nombre ?? '—'}</td>
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-500">{FASE_LABEL[tag.fase]}</td>
                {mostrarColumnaPartido && (
                  <td className="border border-slate-300 px-2 py-2 align-top text-slate-500">{match?.title ?? '—'}</td>
                )}
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-500">{tag.nota ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-3">
        <p className="text-[10px] text-slate-400">
          Club Atlético Unión de Santa Fe — {NOMBRE_AREA}. Documento interno de uso metodológico.
        </p>
        <p className="text-[10px] font-semibold tracking-wide text-union-charcoal">{FIRMA_AUTOR}</p>
      </div>
    </div>,
    document.body,
  )
}
