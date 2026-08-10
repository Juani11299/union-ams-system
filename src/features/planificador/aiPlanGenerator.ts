import { supabase, isSupabaseConfigured } from '@/utils/supabase'
import { getErrorMessage } from '@/utils/errors'
import { SOMA_METODOLOGIA_SYSTEM_PROMPT } from '@/utils/ai-methodology'
import type { GymSheetData } from '@/types'

/**
 * Payload del Motor de Generación de Rutinas IA (Fase 17) — se lo consume la
 * Edge Function `generate-workout` (Fase 17.5). El shape es el contrato con
 * el server: system prompt metodológico + contexto de categoría + el pedido
 * en texto libre del profe.
 */
export interface AiPlanPayload {
  categoryId: string
  categoriaNombre: string
  systemPrompt: string
  userPrompt: string
}

/** Recolecta silenciosamente el contexto necesario para pedirle un plan a la IA. */
export function construirPayloadIA(categoryId: string, categoriaNombre: string, userPrompt: string): AiPlanPayload {
  return {
    categoryId,
    categoriaNombre,
    systemPrompt: SOMA_METODOLOGIA_SYSTEM_PROMPT,
    userPrompt: userPrompt.trim(),
  }
}

/**
 * Cerebro SOMA (Fase 17.5) — invoca la Edge Function `generate-workout`
 * (`supabase/functions/generate-workout`), que corre en Deno del lado del
 * servidor y habla con la API de Anthropic (Claude): el `ANTHROPIC_API_KEY`
 * nunca llega al bundle de Vite. La función ya devuelve el objeto con la
 * forma exacta de `GymSheetData` (incluidos los `id`, que arma el server),
 * lista para pisar el lienzo del editor.
 */
export async function generatePlanWithAI(payload: AiPlanPayload): Promise<GymSheetData> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado (faltan las variables de entorno) — no se puede generar el plan.')
  }

  const { data, error } = await supabase.functions.invoke<GymSheetData | { error: string }>('generate-workout', {
    body: payload,
  })

  if (error) throw new Error(await extraerMensajeError(error))
  if (!data) throw new Error('El Cerebro SOMA no devolvió ningún plan. Probá de nuevo.')
  if ('error' in data) throw new Error(data.error)

  return data
}

/**
 * `FunctionsHttpError` de supabase-js trae la respuesta cruda en `.context`
 * (un `Response`) — ahí viaja el `{ error: "..." }` que devuelve nuestra
 * Edge Function en 400/500, mucho más útil para el toast que el mensaje
 * genérico del SDK ("Edge Function returned a non-2xx status code").
 */
async function extraerMensajeError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const body = await context.clone().json()
        if (typeof body?.error === 'string') return body.error
      } catch {
        // La respuesta no era JSON — se cae al mensaje genérico de abajo.
      }
    }
  }
  return getErrorMessage(error, 'El Cerebro SOMA no pudo generar el plan. Probá de nuevo.')
}
