import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/utils/supabase'
import { getErrorMessage } from '@/utils/errors'
import type { MedicionAntropo } from '@/features/antropometrias/types'

interface FilaAntropometria {
  id: string
  player_name: string
  player_key: string
  category_label: string
  fecha: string
  peso: number | string | null
  masa_adiposa: number | string | null
  masa_muscular: number | string | null
  sumatoria_pliegues: number | string | null
}

type FilaUpsert = Omit<FilaAntropometria, 'id'>

interface AntropometriasState {
  mediciones: MedicionAntropo[]
  /** true hasta que termina la primera lectura desde Supabase. */
  cargando: boolean
  error: string | null
  fetchAntropometrias: () => Promise<void>
  /**
   * Sube las mediciones con `upsert` sobre (player_key, fecha, category_label):
   * re-importar el archivo corregido por el nutricionista pisa, no duplica.
   * Devuelve cuántas eran nuevas y cuántas actualizaron una existente.
   */
  importarAntropometrias: (nuevas: MedicionAntropo[]) => Promise<{ agregadas: number; actualizadas: number }>
  borrarAntropometrias: () => Promise<void>
}

const COLUMNAS = 'id, player_name, player_key, category_label, fecha, peso, masa_adiposa, masa_muscular, sumatoria_pliegues'
const PAGINA = 1000 // tope de filas por request de PostgREST
const LOTE_UPSERT = 500

/** `numeric` puede llegar como string desde PostgREST. */
function aNumero(v: number | string | null): number | null {
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Misma forma que consume todo el dashboard (`MedicionAntropo`); `id` = uuid de la fila. */
function filaAMedicion(f: FilaAntropometria): MedicionAntropo {
  return {
    id: f.id,
    jugador: f.player_name,
    jugadorKey: f.player_key,
    categoria: f.category_label,
    fecha: f.fecha,
    pesoKg: aNumero(f.peso),
    grasaPct: aNumero(f.masa_adiposa),
    musculoPct: aNumero(f.masa_muscular),
    pliegues: aNumero(f.sumatoria_pliegues),
  }
}

function medicionAFila(m: MedicionAntropo): FilaUpsert {
  return {
    player_name: m.jugador,
    player_key: m.jugadorKey,
    category_label: m.categoria,
    fecha: m.fecha,
    peso: m.pesoKg,
    masa_adiposa: m.grasaPct,
    masa_muscular: m.musculoPct,
    sumatoria_pliegues: m.pliegues,
  }
}

const claveConflicto = (k: string, fecha: string, cat: string) => `${k}|${fecha}|${cat}`

function exigirSupabase(): void {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.')
}

/**
 * Store del módulo de Antropometrías — INDEPENDIENTE de `useAppStore`. Los
 * datos viven en la tabla `antropometrias` de Supabase, cerrada por RLS al rol
 * `authenticated` (Staff): son datos de salud de juveniles. Sin sesión las
 * consultas devuelven vacío/error, y la ruta ya está detrás de `ProtectedRoute`.
 */
export const useAntropometriasStore = create<AntropometriasState>()((set, get) => ({
  mediciones: [],
  cargando: true,
  error: null,

  fetchAntropometrias: async () => {
    set({ cargando: true, error: null })
    try {
      exigirSupabase()
      const filas: FilaAntropometria[] = []
      for (let desde = 0; ; desde += PAGINA) {
        const { data, error } = await supabase
          .from('antropometrias')
          .select(COLUMNAS)
          .order('fecha', { ascending: true })
          .order('id', { ascending: true })
          .range(desde, desde + PAGINA - 1)
        if (error) throw error
        filas.push(...(data as FilaAntropometria[]))
        if (data.length < PAGINA) break
      }
      set({ mediciones: filas.map(filaAMedicion), cargando: false })
    } catch (err) {
      set({ cargando: false, error: getErrorMessage(err, 'No se pudieron cargar las antropometrías.') })
    }
  },

  importarAntropometrias: async (nuevas) => {
    exigirSupabase()
    const existentes = new Set(get().mediciones.map((m) => claveConflicto(m.jugadorKey, m.fecha, m.categoria)))
    // Una misma clave repetida dentro del lote haría fallar el upsert
    // ("cannot affect row a second time"): se queda la última.
    const porClave = new Map<string, MedicionAntropo>()
    for (const m of nuevas) porClave.set(claveConflicto(m.jugadorKey, m.fecha, m.categoria), m)

    let actualizadas = 0
    for (const clave of porClave.keys()) if (existentes.has(clave)) actualizadas++
    const agregadas = porClave.size - actualizadas

    const filas = Array.from(porClave.values()).map(medicionAFila)
    for (let i = 0; i < filas.length; i += LOTE_UPSERT) {
      const { error } = await supabase
        .from('antropometrias')
        .upsert(filas.slice(i, i + LOTE_UPSERT), { onConflict: 'player_key,fecha,category_label' })
      if (error) {
        // Un lote anterior pudo haberse guardado: se resincroniza para no mostrar datos viejos.
        await get().fetchAntropometrias()
        throw new Error(getErrorMessage(error, 'No se pudieron guardar las antropometrías.'))
      }
    }
    await get().fetchAntropometrias()
    return { agregadas, actualizadas }
  },

  borrarAntropometrias: async () => {
    exigirSupabase()
    // PostgREST exige un filtro en DELETE; `not id is null` matchea todas las filas.
    const { error } = await supabase.from('antropometrias').delete().not('id', 'is', null)
    if (error) throw new Error(getErrorMessage(error, 'No se pudieron borrar las antropometrías.'))
    set({ mediciones: [], error: null })
  },
}))
