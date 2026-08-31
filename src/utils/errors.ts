/**
 * Los errores de supabase-js (PostgrestError, AuthError) no son `instanceof Error`
 * pero sí tienen `.message` — por eso no alcanza con chequear `err instanceof Error`.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return fallback
}

/**
 * `FunctionsHttpError` de supabase-js trae la respuesta cruda en `.context`
 * (un `Response`) — ahí viaja el `{ error: "..." }` que devuelven nuestras
 * Edge Functions en 400/500, mucho más útil para el toast que el mensaje
 * genérico del SDK ("Edge Function returned a non-2xx status code"). Extraído
 * de `aiPlanGenerator.ts` (Fase 17.5) para reusarlo también en
 * `aiVisionService.ts` (Fase 34.3) — misma forma de error, misma Edge Function
 * de origen (Anthropic).
 */
export async function extraerMensajeErrorEdgeFunction(error: unknown, fallback: string): Promise<string> {
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
  return getErrorMessage(error, fallback)
}
