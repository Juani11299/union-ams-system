import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAthletesActivos, useAppStore } from '@/store/useAppStore'
import { EVENTO_ICONO, EVENTO_LABEL, FASE_LABEL, formatTimestamp } from './videoAnalysisConstants'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'
import type { VideoMatch, VideoTag } from '@/types'

interface VideoReportExportProps {
  match: VideoMatch
  tags: VideoTag[]
  onClose: () => void
}

/**
 * Exportación de Informe de Video (Fase 34, Paso 5) — dos pasos: elegir qué
 * clips entran en el informe (checkboxes, todos tildados por defecto) y
 * generar el PDF con `window.print()`. Reusa exactamente la arquitectura de
 * impresión ya establecida en la plataforma (`.print-area` de
 * `src/index.css`, `createPortal(..., document.body)` para escapar de
 * cualquier ancestro `position:fixed`/`overflow` del modal — mismo fix que
 * `BulkComplementaryPdfExport.tsx`).
 */
export function VideoReportExport({ match, tags, onClose }: VideoReportExportProps) {
  const athletes = useAthletesActivos()
  const club = useAppStore((s) => s.club)
  const categories = useAppStore((s) => s.categories)
  const categoriaNombre = categories.find((c) => c.id === match.categoryId)?.nombre ?? 'Categoría'

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

  const clipsElegidos = tags.filter((t) => seleccionados.has(t.id))

  if (imprimiendo) {
    return (
      <ReporteImprimible
        match={match}
        tags={clipsElegidos}
        athletes={athletes}
        clubNombre={club?.nombre ?? 'C.A. Unión'}
        categoriaNombre={categoriaNombre}
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
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">📄 Informe de Video</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{match.title} — elegí qué clips incluir.</p>
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
            <p className="py-8 text-center text-sm text-slate-400">Este partido todavía no tiene eventos taggeados.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {tags.map((tag) => {
                const jugador = athletes.find((a) => a.id === tag.athleteId)
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
                      <span className="text-slate-700 dark:text-slate-300">
                        {EVENTO_LABEL[tag.tipo]}
                        {jugador ? ` — ${jugador.nombre}` : ''}
                      </span>
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
  match: VideoMatch
  tags: VideoTag[]
  athletes: ReturnType<typeof useAthletesActivos>
  clubNombre: string
  categoriaNombre: string
  onClose: () => void
}

function ReporteImprimible({ match, tags, athletes, clubNombre, categoriaNombre, onClose }: ReporteImprimibleProps) {
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
            <p className="text-xl font-bold text-union-charcoal">{match.title}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {clubNombre} — {categoriaNombre} · Informe de Video ({match.fecha})
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded bg-union-charcoal px-3 py-1.5 text-xs font-bold text-white">🎥 Análisis de Video</div>
      </div>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-union-charcoal text-left text-[10px] uppercase tracking-wide text-white">
            <th className="border border-slate-300 px-2 py-1.5">Minuto</th>
            <th className="border border-slate-300 px-2 py-1.5">Evento</th>
            <th className="border border-slate-300 px-2 py-1.5">Jugador</th>
            <th className="border border-slate-300 px-2 py-1.5">Fase</th>
            <th className="border border-slate-300 px-2 py-1.5">Nota</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => {
            const jugador = athletes.find((a) => a.id === tag.athleteId)
            return (
              <tr key={tag.id} className="break-inside-avoid">
                <td className="border border-slate-300 px-2 py-2 align-top font-mono font-semibold text-slate-700">
                  {formatTimestamp(tag.timestampSegundos)}
                </td>
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-700">
                  {EVENTO_ICONO[tag.tipo]} {EVENTO_LABEL[tag.tipo]}
                </td>
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-700">{jugador?.nombre ?? '—'}</td>
                <td className="border border-slate-300 px-2 py-2 align-top text-slate-500">{FASE_LABEL[tag.fase]}</td>
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
