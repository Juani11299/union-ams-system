import { supabase, isSupabaseConfigured } from '@/utils/supabase'
import { extraerMensajeErrorEdgeFunction } from '@/utils/errors'
import { FASE_LABEL, ORDEN_BANDAS, ORDEN_CARRILES } from './videoAnalysisConstants'
import type { AnalisisIA, BandaCancha, CarrilCancha, FaseJuego } from '@/types'

/** Forma cruda que devuelve la Edge Function `analizar-frame-ia` (output de la tool forzada de Claude, ver `index.ts` del lado del servidor). */
interface RespuestaAnalisisIA {
  fase: string
  zonaBanda: string
  zonaCarril: string
  descripcion: string
  alertaTactica: string
  confianza: number
}

const FASES_VALIDAS = new Set(Object.keys(FASE_LABEL))
const BANDAS_VALIDAS = new Set<string>(ORDEN_BANDAS)
const CARRILES_VALIDOS = new Set<string>(ORDEN_CARRILES)

/**
 * Servicio de Análisis Táctico por Visión (Fase 34.3) — capa modular entre
 * el reproductor y la Edge Function `analizar-frame-ia`, que es la que
 * realmente le habla a Claude (Anthropic Messages API con imágenes) del
 * lado del servidor. El `ANTHROPIC_API_KEY` NUNCA viaja al bundle de
 * Vite/browser — si lo hiciera, cualquiera que abra las DevTools de la app
 * en producción podría robarlo y gastar saldo de la cuenta sin límite. Acá
 * sólo se manda el fotograma (base64) ya capturado del `<video>`, autenticado
 * con la sesión de Supabase normal de la app (mismo mecanismo que
 * `generatePlanWithAI`, Fase 17.5).
 */
export async function analizarFrameConIA(frameDataUrl: string, timestampSegundos: number): Promise<AnalisisIA> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado (faltan las variables de entorno) — no se puede analizar el fotograma.')
  }

  const match = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(frameDataUrl)
  if (!match) {
    throw new Error('No se pudo procesar el fotograma capturado del video.')
  }
  const [, mimeType, imageBase64] = match

  const { data, error } = await supabase.functions.invoke<RespuestaAnalisisIA | { error: string }>('analizar-frame-ia', {
    body: { imageBase64, mimeType, timestampSegundos },
  })

  if (error) {
    throw new Error(await extraerMensajeErrorEdgeFunction(error, 'No se pudo analizar el fotograma con IA. Probá de nuevo.'))
  }
  if (!data) throw new Error('La IA no devolvió ningún análisis. Probá de nuevo.')
  if ('error' in data) throw new Error(data.error)

  // El `tool_choice` forzado del lado del server ya constriñe estos valores
  // a los enums válidos, pero nunca hay que confiar ciegamente en algo que
  // cruzó la red — si algún día cambia el prompt/modelo y devuelve otra
  // cosa, mejor un error claro acá que un tag con una fase/zona inventada.
  if (!FASES_VALIDAS.has(data.fase)) {
    throw new Error(`La IA devolvió una fase de juego inesperada: "${data.fase}".`)
  }
  if (!BANDAS_VALIDAS.has(data.zonaBanda) || !CARRILES_VALIDOS.has(data.zonaCarril)) {
    throw new Error('La IA devolvió una zona de cancha inesperada.')
  }

  return {
    fase: data.fase as FaseJuego,
    zona: { banda: data.zonaBanda as BandaCancha, carril: data.zonaCarril as CarrilCancha },
    descripcion: data.descripcion,
    alertaTactica: data.alertaTactica,
    confianza: typeof data.confianza === 'number' ? Math.max(0, Math.min(1, data.confianza)) : 0.5,
  }
}
