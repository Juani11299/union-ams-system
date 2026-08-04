import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/**
 * El cliente de Supabase ya agrega `/rest/v1` internamente — si el .env viene con esa
 * ruta pegada (typo común al copiar la URL del dashboard) hay que sacarla, si no las
 * queries terminan pidiendo `/rest/v1/rest/v1/tabla` y Postgrest responde PGRST125
 * ("Invalid path specified in request URL").
 */
function normalizarUrl(url: string | undefined): string | undefined {
  if (!url) return url
  return url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
}

const supabaseUrl = normalizarUrl(rawUrl)

// TEMPORAL — sacar una vez confirmado que la URL resuelve bien en el incidente actual.
if (import.meta.env.DEV) {
  console.log('[Supabase] URL resuelta:', supabaseUrl, '(cruda del .env:', rawUrl, ')')
}

/** false si faltan las variables de entorno — evita que la app crashee al importar el cliente. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
