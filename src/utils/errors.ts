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
