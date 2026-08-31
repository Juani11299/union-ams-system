import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { esUrlVeo, formatTimestamp } from './videoAnalysisConstants'

export interface VideoPlayerHandle {
  seekTo: (segundos: number) => void
  getCurrentTime: () => number
}

interface VideoPlayerModuleProps {
  videoUrl: string
  onTimeUpdate?: (segundos: number) => void
  className?: string
}

const VELOCIDADES = [0.5, 1, 2] as const

/**
 * Reproductor del Módulo de Análisis de Video (Fase 34, Paso 1). Dos modos
 * según el link pegado — determinados por `esUrlVeo`:
 *
 * - Video directo (mp4/HLS propio): `<video>` HTML5 nativo — control TOTAL
 *   y real: velocidad (0.5x/1x/2x), salto de segundos, línea de tiempo,
 *   `seekTo(segundos)` expuesto por ref para que un click en un tag salte
 *   directo a ese instante.
 * - Link de VEO (`app.veo.co/...`): VEO no ofrece un embed público con API
 *   de control programático (seek/velocidad) sin credenciales de socio de
 *   la VEO API (OAuth — ver developer.veo.co.uk, verificado antes de
 *   construir esto, no es una suposición). Se embebe como `<iframe>` de
 *   sólo visualización — el reproductor de VEO trae SUS PROPIOS controles
 *   nativos, pero `seekTo` acá es un no-op documentado: no hay forma de
 *   saltar a un timestamp por click en un tag sin esa integración oficial.
 *   Los tags igual se guardan con el segundo exacto — sirven como índice de
 *   la Lista de Clips aunque el salto automático no aplique en este modo.
 */
export const VideoPlayerModule = forwardRef<VideoPlayerHandle, VideoPlayerModuleProps>(
  function VideoPlayerModule({ videoUrl, onTimeUpdate, className = '' }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [velocidad, setVelocidad] = useState<number>(1)
    const [tiempoActual, setTiempoActual] = useState(0)
    const [duracion, setDuracion] = useState(0)
    const esVeo = esUrlVeo(videoUrl)

    useImperativeHandle(ref, () => ({
      seekTo: (segundos) => {
        if (videoRef.current) videoRef.current.currentTime = segundos
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    }))

    function handleTimeUpdate() {
      const t = videoRef.current?.currentTime ?? 0
      setTiempoActual(t)
      onTimeUpdate?.(t)
    }

    function cambiarVelocidad(v: number) {
      setVelocidad(v)
      if (videoRef.current) videoRef.current.playbackRate = v
    }

    function saltar(segundos: number) {
      if (!videoRef.current) return
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + segundos)
    }

    if (esVeo) {
      return (
        <div className={`flex flex-col gap-2 ${className}`}>
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe src={videoUrl} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen title="Video VEO" />
          </div>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            ⚠️ Link de VEO: usá los controles propios del reproductor (adentro del video) para velocidad y avance —
            VEO no permite saltar a un timestamp por click desde acá sin una integración con su API oficial de
            socio. Los tags que cargues abajo igual quedan guardados con el minuto exacto, como índice de la Lista
            de Clips.
          </p>
        </div>
      )
    }

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="overflow-hidden rounded-xl bg-union-charcoal">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="aspect-video w-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuracion(videoRef.current?.duration ?? 0)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {formatTimestamp(tiempoActual)} / {formatTimestamp(duracion)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => saltar(-10)}
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              « 10s
            </button>
            <button
              type="button"
              onClick={() => saltar(10)}
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              10s »
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {VELOCIDADES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => cambiarVelocidad(v)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                  velocidad === v
                    ? 'bg-union-red-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  },
)
