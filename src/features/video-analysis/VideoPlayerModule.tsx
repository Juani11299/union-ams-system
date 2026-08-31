import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { esUrlVeo, formatTimestamp } from './videoAnalysisConstants'
import { analizarFrameConIA } from './aiVisionService'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import type { AnalisisIA } from '@/types'

export interface VideoPlayerHandle {
  seekTo: (segundos: number) => void
  getCurrentTime: () => number
}

interface VideoPlayerModuleProps {
  videoUrl: string
  onTimeUpdate?: (segundos: number) => void
  /** Fase 34.3 — se dispara cuando el Análisis Táctico por Visión (Claude) termina de leer el fotograma actual. `VideoAnalysisView` lo usa para prellenar el formulario de tagging con la sugerencia. */
  onAnalisisIA?: (resultado: AnalisisIA, timestampSegundos: number) => void
  className?: string
}

const VELOCIDADES = [0.5, 1, 2] as const

/**
 * Reproductor del Módulo de Análisis de Video (Fase 34, Paso 1; corregido en
 * Fase 34.1 tras confirmarlo en producción). Dos modos según el link
 * pegado — determinados por `esUrlVeo`:
 *
 * - Video directo (mp4/HLS propio): `<video>` HTML5 nativo — control TOTAL
 *   y real: velocidad (0.5x/1x/2x), salto de segundos, línea de tiempo,
 *   `seekTo(segundos)` expuesto por ref para que un click en un tag salte
 *   directo a ese instante.
 * - Link de VEO (`app.veo.co/...`): la Fase 34 original embebía esto en un
 *   `<iframe>`, asumiendo (por la documentación pública de la VEO API, sin
 *   API key de socio propia) que al menos la VISUALIZACIÓN funcionaría
 *   aunque el control programático no. Confirmado en producción que NO —
 *   VEO responde `X-Frame-Options`/CSP que rechaza el framing por completo
 *   ("app.veo.co rechazó la conexión"), así que ni siquiera embeber para
 *   mirar es viable sin la integración OAuth de socio (developer.veo.co.uk).
 *   Reemplazado por un "Cronómetro Manual": el profe abre VEO en una
 *   pestaña aparte y usa este cronómetro sincronizado a mano para taggear
 *   con un segundo aproximado — no es el video real, es la mejor
 *   aproximación posible sin credenciales de socio.
 */
export const VideoPlayerModule = forwardRef<VideoPlayerHandle, VideoPlayerModuleProps>(
  function VideoPlayerModule({ videoUrl, onTimeUpdate, onAnalisisIA, className = '' }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [velocidad, setVelocidad] = useState<number>(1)
    const [tiempoActual, setTiempoActual] = useState(0)
    const [duracion, setDuracion] = useState(0)
    const [analizandoIA, setAnalizandoIA] = useState(false)
    const showToast = useToastStore((s) => s.showToast)
    const esVeo = esUrlVeo(videoUrl)

    // --- Cronómetro Manual (sólo modo VEO) ---
    const [segundosManual, setSegundosManual] = useState(0)
    const [corriendo, setCorriendo] = useState(false)
    const inicioRef = useRef<number>(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
      if (!corriendo) return
      inicioRef.current = Date.now() - segundosManual * 1000
      intervalRef.current = setInterval(() => {
        const t = (Date.now() - inicioRef.current) / 1000
        setSegundosManual(t)
        onTimeUpdate?.(t)
      }, 200)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [corriendo])

    useImperativeHandle(ref, () => ({
      seekTo: (segundos) => {
        if (esVeo) {
          // No hay video real que mover — dejamos el cronómetro marcando el
          // objetivo para que el profe sepa a qué minuto llevar VEO a mano.
          setCorriendo(false)
          setSegundosManual(segundos)
          return
        }
        if (videoRef.current) videoRef.current.currentTime = segundos
      },
      getCurrentTime: () => (esVeo ? segundosManual : (videoRef.current?.currentTime ?? 0)),
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

    /**
     * Captura el fotograma ACTUAL del `<video>` como JPEG base64 (mismo
     * truco `<canvas>` + `toDataURL` que ya usa `TacticalCanvas2D.exportarPng`).
     * Devuelve `null` si el video todavía no cargó metadata, o si el canvas
     * queda "tainted" por CORS (el host del video no manda los headers que
     * permiten leer sus píxeles) — en ese caso no hay forma de capturar el
     * frame desde el browser, punto.
     */
    function capturarFrame(): string | null {
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return null
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      try {
        return canvas.toDataURL('image/jpeg', 0.85)
      } catch {
        return null
      }
    }

    /**
     * Análisis Táctico por Visión (Fase 34.3) — captura el fotograma actual
     * y se lo manda a Claude vía `aiVisionService`/Edge Function
     * `analizar-frame-ia`. El resultado sube por `onAnalisisIA` para que
     * `VideoAnalysisView` lo lleve a `LiveTaggingView` como SUGERENCIA a
     * revisar — este componente no decide ni crea ningún tag, sólo dispara
     * el análisis y muestra el estado de carga/error.
     */
    async function analizarConIA() {
      const frame = capturarFrame()
      if (!frame) {
        showToast(
          'error',
          'No se pudo capturar el fotograma — esperá a que cargue el video, o el servidor donde está alojado no permite esta operación (CORS).',
        )
        return
      }
      setAnalizandoIA(true)
      try {
        const segundo = videoRef.current?.currentTime ?? 0
        const resultado = await analizarFrameConIA(frame, segundo)
        onAnalisisIA?.(resultado, segundo)
        showToast('success', '🧠 Lectura táctica lista — revisala en "Tagging en Vivo" antes de confirmar el tag.')
      } catch (err) {
        showToast('error', getErrorMessage(err, 'No se pudo analizar el fotograma con IA.'))
      } finally {
        setAnalizandoIA(false)
      }
    }

    if (esVeo) {
      return (
        <div className={`flex flex-col gap-3 rounded-xl bg-union-charcoal p-5 ${className}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Cronómetro Manual</p>
              <p className="mt-1 font-mono text-4xl font-bold text-white">{formatTimestamp(segundosManual)}</p>
            </div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-union-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-union-red-700"
            >
              ↗ Abrir en VEO
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorriendo((v) => !v)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                corriendo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {corriendo ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCorriendo(false)
                setSegundosManual(0)
              }}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              ↺ Reiniciar
            </button>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-white/60">
              Corregir a
              <input
                type="number"
                min={0}
                step={1}
                value={Math.round(segundosManual)}
                onChange={(e) => {
                  const nuevoValor = Math.max(0, Number(e.target.value) || 0)
                  // Si el cronómetro sigue corriendo, hay que correr también el
                  // "inicio" de referencia — si no, el próximo tick del interval
                  // (cada 200ms) pisa esta corrección con el cálculo viejo
                  // (Date.now() - inicioRef), como si nunca la hubiéramos tocado.
                  if (corriendo) inicioRef.current = Date.now() - nuevoValor * 1000
                  setSegundosManual(nuevoValor)
                }}
                className="w-16 rounded border-none bg-white/10 px-2 py-1 text-white outline-none focus:bg-white/20"
              />
              s
            </label>
          </div>

          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
            ⚠️ VEO no permite embeberse dentro de otras páginas (rechaza el framing) — no es un límite de esta
            plataforma, es una restricción del lado de VEO. Abrí el video en la pestaña nueva, dale play ahí, y
            usá "▶ Iniciar" acá al mismo tiempo para mantener el cronómetro sincronizado. Si se desincroniza,
            corregilo con el campo de arriba. Los tags se guardan con este segundo — es una aproximación, no el
            timestamp exacto del archivo de VEO.
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

        <button
          type="button"
          onClick={analizarConIA}
          disabled={analizandoIA}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-union-red-600 to-union-red-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {analizandoIA ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Analizando jugada con IA…
            </>
          ) : (
            <>🧠 Analizar con IA (fotograma actual)</>
          )}
        </button>
        <p className="-mt-1 text-center text-[10px] text-slate-400">
          Claude lee UN fotograma fijo (no todo el video en movimiento) y sugiere fase, zona y una lectura táctica —
          la revisás y confirmás vos en "Tagging en Vivo", nunca se guarda un tag solo.
        </p>
      </div>
    )
  },
)
