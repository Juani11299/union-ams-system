import { useRef, useState } from 'react'
import {
  useAppStore,
  useVideoMatchesActivos,
  useVideoTagsDeMatch,
} from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Tabs, type TabItem } from '@/components/Tabs'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import { fechaHoyLocal } from '@/utils/fecha'
import { VideoPlayerModule, type VideoPlayerHandle } from './VideoPlayerModule'
import { LiveTaggingView } from './LiveTaggingView'
import { TagFilterPanel } from './TagFilterPanel'
import { TacticalCanvas2D } from './TacticalCanvas2D'
import { VideoReportExport } from './VideoReportExport'
import type { VideoMatch, VideoTag } from '@/types'

const TABS: TabItem[] = [
  { id: 'tagging', label: 'Tagging en Vivo', icon: '🏷️' },
  { id: 'filtros', label: 'Filtros y Clips', icon: '🔍' },
  { id: 'pizarra', label: 'Pizarra 2D', icon: '🎨' },
]

function NuevoPartidoForm({ onClose }: { onClose: () => void }) {
  const createVideoMatch = useAppStore((s) => s.createVideoMatch)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const showToast = useToastStore((s) => s.showToast)

  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [fecha, setFecha] = useState(fechaHoyLocal())
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCategoryId || !activeSeasonId) return
    setGuardando(true)
    try {
      await createVideoMatch({
        categoryId: activeCategoryId,
        seasonId: activeSeasonId,
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        fecha,
      })
      showToast('success', '¡Partido cargado!')
      onClose()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo cargar el partido.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
      >
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">🎥 Nuevo Partido / Entrenamiento</h3>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Título</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. vs Colón — Fecha 12"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Link de video (VEO u otro)</span>
          <input
            required
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://app.veo.co/matches/... o un .mp4 directo"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Fecha</span>
          <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Cargar Partido'}
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * Módulo de Análisis de Video y Tagging Inteligente (Fase 34, "estilo AURE
 * Sports") — contenedor que une los 5 componentes pedidos: reproductor
 * (`VideoPlayerModule`, ref compartida entre pestañas para que un click en
 * un clip de Filtros salte en el video sin desmontar el player), Tagging en
 * Vivo, Filtros y Búsqueda Táctica, Pizarra 2D, y Exportación de Informe.
 */
export function VideoAnalysisView() {
  const matches = useVideoMatchesActivos()
  const deleteVideoMatch = useAppStore((s) => s.deleteVideoMatch)
  const showToast = useToastStore((s) => s.showToast)

  const [matchId, setMatchId] = useState<string | null>(null)
  const [tabActiva, setTabActiva] = useState('tagging')
  const [creandoPartido, setCreandoPartido] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<VideoMatch | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [exportandoInforme, setExportandoInforme] = useState(false)

  const playerRef = useRef<VideoPlayerHandle>(null)
  const match = matches.find((m) => m.id === matchId) ?? null
  const tagsDelMatch = useVideoTagsDeMatch(match?.id ?? null)

  function seleccionarClip(matchDelClip: VideoMatch, tag: VideoTag) {
    if (matchDelClip.id !== matchId) {
      setMatchId(matchDelClip.id)
      // El reproductor recién se monta con el video nuevo — darle un instante
      // antes de pedirle que salte, si no `seekTo` cae en un player viejo/null.
      setTimeout(() => playerRef.current?.seekTo(tag.timestampSegundos), 300)
    } else {
      playerRef.current?.seekTo(tag.timestampSegundos)
    }
  }

  async function handleEliminarPartido() {
    if (!confirmandoEliminar) return
    setEliminando(true)
    try {
      await deleteVideoMatch(confirmandoEliminar.id)
      showToast('success', 'Partido eliminado.')
      if (matchId === confirmandoEliminar.id) setMatchId(null)
      setConfirmandoEliminar(null)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar el partido.'))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">🎥 Análisis de Video</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tagging inteligente, filtros tácticos y pizarra 2D — reproductor propio o links de VEO.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreandoPartido(true)}
          className="rounded-xl bg-union-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-union-red-700"
        >
          + Nuevo Partido
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-400">
            Todavía no hay partidos cargados para esta categoría. Pegá un link de VEO o un video directo para empezar.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={matchId ?? ''}
            onChange={(e) => setMatchId(e.target.value || null)}
            className={`max-w-xs ${inputClass}`}
          >
            <option value="">Elegí un partido…</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} — {m.fecha}
              </option>
            ))}
          </select>
          {match && (
            <button
              type="button"
              onClick={() => setConfirmandoEliminar(match)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              ✕ Eliminar partido
            </button>
          )}
        </div>
      )}

      {match && (
        <>
          <VideoPlayerModule ref={playerRef} videoUrl={match.videoUrl} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />
            <button
              type="button"
              onClick={() => setExportandoInforme(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              📄 Exportar Informe
            </button>
          </div>

          {tabActiva === 'tagging' && <LiveTaggingView match={match} playerRef={playerRef} />}
          {tabActiva === 'filtros' && <TagFilterPanel onSeleccionarClip={seleccionarClip} />}
          {tabActiva === 'pizarra' && <TacticalCanvas2D />}
        </>
      )}

      {creandoPartido && <NuevoPartidoForm onClose={() => setCreandoPartido(false)} />}

      {exportandoInforme && match && (
        <VideoReportExport match={match} tags={tagsDelMatch} onClose={() => setExportandoInforme(false)} />
      )}

      {confirmandoEliminar && (
        <ConfirmDialog
          titulo="Eliminar partido"
          mensaje={`¿Seguro que querés eliminar "${confirmandoEliminar.title}"? Se van a borrar también todos sus tags.`}
          onConfirm={handleEliminarPartido}
          onCancel={() => setConfirmandoEliminar(null)}
          confirmando={eliminando}
        />
      )}
    </div>
  )
}
