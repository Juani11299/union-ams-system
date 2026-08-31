import { zonaDesdeDetecciones, zonaLabel } from './videoAnalysisConstants'
import type { AnalisisVisionLocal, DeteccionObjeto } from '@/types'
import type * as CocoSsd from '@tensorflow-models/coco-ssd'

/**
 * Servicio de Visión por Computadora (Fase 34.3) — detección de objetos
 * (jugadores/pelota) sobre el fotograma actual del video, corriendo
 * ENTERAMENTE en el navegador con TensorFlow.js + COCO-SSD. Sin servidor,
 * sin API key, sin costo por uso — el modelo (~a pocos MB) se descarga una
 * sola vez la primera vez que se usa y queda cacheado por el browser.
 *
 * Reemplaza la integración anterior con la API de Claude (Anthropic): esa
 * versión requería una cuenta de facturación paga, y el club prefirió una
 * alternativa sin costo aunque sea más acotada — ver `zonaDesdeDetecciones`
 * en `videoAnalysisConstants.ts` para la limitación honesta de lo que esto
 * puede y no puede inferir (geometría real, no lectura táctica).
 */

let modeloPromise: Promise<CocoSsd.ObjectDetection> | null = null

/** Carga el modelo COCO-SSD una sola vez (lazy) y lo cachea en memoria para el resto de la sesión — evita volver a descargarlo/inicializarlo en cada click. */
function cargarModelo(): Promise<CocoSsd.ObjectDetection> {
  if (!modeloPromise) {
    modeloPromise = (async () => {
      await import('@tensorflow/tfjs')
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      return cocoSsd.load()
    })().catch((err) => {
      // Si falla la carga, hay que permitir reintentar en el próximo click
      // en vez de quedar con una promesa rota cacheada para siempre.
      modeloPromise = null
      throw err
    })
  }
  return modeloPromise
}

const CLASES_RELEVANTES = new Set(['person', 'sports ball'])

/**
 * Detecta jugadores/pelota en el elemento de video ACTUAL (se le pasa el
 * `<video>` directo, sin pasar por un `<canvas>`/base64 intermedio — TF.js
 * lee los píxeles del elemento tal cual). Lanza un error claro (no un
 * crash silencioso) si el video está en un servidor sin CORS habilitado, ya
 * que ahí el navegador bloquea la lectura de píxeles igual que bloquearía
 * un `canvas.toDataURL()`.
 */
export async function detectarObjetosEnVideo(video: HTMLVideoElement): Promise<AnalisisVisionLocal> {
  if (video.readyState < 2 || video.videoWidth === 0) {
    throw new Error('El video todavía no cargó — esperá a que tenga imagen antes de analizar.')
  }

  let modelo: CocoSsd.ObjectDetection
  try {
    modelo = await cargarModelo()
  } catch {
    throw new Error('No se pudo cargar el modelo de detección (revisá la conexión a internet la primera vez que lo usás).')
  }

  let predicciones: CocoSsd.DetectedObject[]
  try {
    predicciones = await modelo.detect(video)
  } catch {
    throw new Error(
      'No se pudo leer el fotograma del video — el servidor donde está alojado no permite esta operación (CORS).',
    )
  }

  const detecciones: DeteccionObjeto[] = predicciones
    .filter((p) => CLASES_RELEVANTES.has(p.class))
    .map((p) => ({
      clase: p.class as DeteccionObjeto['clase'],
      score: p.score,
      bbox: p.bbox as [number, number, number, number],
    }))

  const zonaSugerida = zonaDesdeDetecciones(detecciones, video.videoWidth, video.videoHeight)
  const personas = detecciones.filter((d) => d.clase === 'person')
  const pelotas = detecciones.filter((d) => d.clase === 'sports ball')

  const resumen =
    personas.length === 0
      ? 'No se detectaron jugadores en este fotograma — probá en un momento con más gente en cámara, o pausá el video en una jugada más abierta.'
      : `${personas.length} jugador(es)${pelotas.length > 0 ? ` y ${pelotas.length} pelota(s)` : ''} detectados` +
        (zonaSugerida ? ` — concentrados en ${zonaLabel(zonaSugerida)}.` : '.')

  return { detecciones, zonaSugerida, resumen }
}
