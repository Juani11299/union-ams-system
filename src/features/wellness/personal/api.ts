import { supabase, isSupabaseConfigured } from '@/utils/supabase'

/**
 * Acceso a "Mis Evaluaciones" / "Mi Composición Corporal" desde el link personal del
 * jugador (Fase 53). El jugador entra con el rol `anon`, que NO tiene acceso directo
 * a `dynamic_evaluations` ni a `antropometrias`: la única puerta es la función
 * `mi_perfil_atleta(athlete_id, token)` (ver `migration_fase53_link_personal.sql`),
 * que valida el token del jugador y devuelve exclusivamente SUS filas — sin
 * pliegues cutáneos y sin datos de compañeros.
 */

export interface EvaluacionPersonal {
  test_name: string
  /** YYYY-MM-DD */
  fecha: string
  metrics: Record<string, number | string | null>
}

export interface EvaluacionLegacy {
  evaluation_name: string
  fecha: string
  metrics: Record<string, number>
  body_weight_kg: number | null
}

export interface AntropometriaPersonal {
  fecha: string
  peso: number | string | null
  masa_adiposa: number | string | null
  masa_muscular: number | string | null
}

export interface PerfilPersonal {
  nombre: string
  evaluaciones: EvaluacionPersonal[]
  legacy: EvaluacionLegacy[]
  antropometrias: AntropometriaPersonal[]
}

export type ResultadoPerfil = { estado: 'ok'; perfil: PerfilPersonal } | { estado: 'link-invalido' } | { estado: 'error'; mensaje: string }

export async function cargarMiPerfil(athleteId: string, token: string): Promise<ResultadoPerfil> {
  if (!isSupabaseConfigured) return { estado: 'error', mensaje: 'Supabase no está configurado.' }
  const { data, error } = await supabase.rpc('mi_perfil_atleta', { p_athlete_id: athleteId, p_token: token })
  if (error) {
    // Sin la migración aplicada la función no existe: se avisa con claridad en vez de mostrar "link inválido".
    const sinFuncion = /function|does not exist|schema cache|PGRST202/i.test(error.message)
    return { estado: 'error', mensaje: sinFuncion ? 'Esta sección todavía no está habilitada (falta activar el acceso personal en la base).' : 'No se pudieron cargar tus datos. Probá de nuevo en unos minutos.' }
  }
  const r = data as { ok?: boolean; nombre?: string; evaluaciones?: EvaluacionPersonal[]; legacy?: EvaluacionLegacy[]; antropometrias?: AntropometriaPersonal[] } | null
  if (!r?.ok) return { estado: 'link-invalido' }
  return { estado: 'ok', perfil: { nombre: r.nombre ?? '', evaluaciones: r.evaluaciones ?? [], legacy: r.legacy ?? [], antropometrias: r.antropometrias ?? [] } }
}

/** Staff: asegura que el jugador tenga token y devuelve el link personal completo. Requiere sesión (rol `authenticated`). */
export async function generarLinkPersonal(athleteId: string, seasonId: string, categoryId: string, tipo: 'rpe' | 'wellness' = 'rpe'): Promise<string> {
  const { error: e1 } = await supabase.from('athlete_links').upsert({ athlete_id: athleteId }, { onConflict: 'athlete_id', ignoreDuplicates: true })
  if (e1) throw e1
  const { data, error: e2 } = await supabase.from('athlete_links').select('token').eq('athlete_id', athleteId).single()
  if (e2) throw e2
  const qs = new URLSearchParams({ athlete: athleteId, t: String((data as { token: string }).token), season: seasonId, category: categoryId, type: tipo })
  return `${window.location.origin}/ingreso-rapido?${qs.toString()}`
}
