import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/utils/supabase'
import { getErrorMessage } from '@/utils/errors'
import { TEST_NORDBORD } from '@/features/evaluaciones/dinamicas'
import type { ConfigTest, FilaEvaluacionDinamica } from '@/features/evaluaciones/dinamicas'

const COLUMNAS = 'id, test_name, player_name, player_key, category_label, fecha, metrics, test_config'
const PAGINA = 1000 // tope de filas por request de PostgREST
const LOTE_UPSERT = 500

interface EvaluacionesDinamicasState {
  /** Todas las filas de `dynamic_evaluations` (NordBord + tests dinámicos). */
  filas: FilaEvaluacionDinamica[]
  /** true hasta que termina la primera lectura desde Supabase. */
  cargando: boolean
  error: string | null
  fetchEvaluaciones: () => Promise<void>
  /**
   * Upsertea las filas de UN test sobre (test_name, player_key, fecha). Es
   * ACUMULATIVO: una fecha nueva crea filas nuevas y el historial anterior del
   * jugador no se toca; sólo se pisa la fila que coincide en test + jugador +
   * fecha (volver a subir el Excel corregido de una sesión). Después unifica
   * `test_config` en todas las filas del test (una re-subida puede cambiar el
   * ícono o las claves).
   */
  guardarTest: (testName: string, filas: FilaEvaluacionDinamica[], config: ConfigTest) => Promise<{ guardadas: number }>
  /** Borra todas las filas de un test (NordBord incluido). */
  eliminarTest: (testName: string) => Promise<void>
}

function exigirSupabase(): void {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.')
}

/**
 * Store de NordBord y de los Tests Dinámicos del Hub de Evaluaciones — datos en
 * la tabla `dynamic_evaluations` (Supabase, RLS sólo `authenticated`), ya sin
 * persistencia local. Sin sesión de Staff las consultas fallan y el error queda
 * en `error` (el Hub y los dashboards lo muestran).
 */
export const useEvaluacionesDinamicasStore = create<EvaluacionesDinamicasState>()((set, get) => ({
  filas: [],
  cargando: true,
  error: null,

  fetchEvaluaciones: async () => {
    set({ cargando: true, error: null })
    try {
      exigirSupabase()
      const acumuladas: FilaEvaluacionDinamica[] = []
      for (let desde = 0; ; desde += PAGINA) {
        const { data, error } = await supabase
          .from('dynamic_evaluations')
          .select(COLUMNAS)
          .order('fecha', { ascending: true })
          .order('id', { ascending: true })
          .range(desde, desde + PAGINA - 1)
        if (error) throw error
        acumuladas.push(...(data as FilaEvaluacionDinamica[]))
        if (data.length < PAGINA) break
      }
      set({ filas: acumuladas, cargando: false })
    } catch (err) {
      set({ cargando: false, error: getErrorMessage(err, 'No se pudieron cargar las evaluaciones.') })
    }
  },

  guardarTest: async (testName, filas, config) => {
    exigirSupabase()
    // Una misma clave repetida dentro del lote haría fallar el upsert ("cannot affect row a second time"): queda la última.
    for (const f of filas) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha)) throw new Error(`Fecha inválida ("${f.fecha}") para ${f.player_name}: se esperaba AAAA-MM-DD.`)
    }
    const porClave = new Map<string, FilaEvaluacionDinamica>()
    for (const f of filas) porClave.set(`${f.player_key}|${f.fecha}`, { ...f, test_name: testName, test_config: config })
    const lote = Array.from(porClave.values())
    for (let i = 0; i < lote.length; i += LOTE_UPSERT) {
      const { error } = await supabase.from('dynamic_evaluations').upsert(lote.slice(i, i + LOTE_UPSERT), { onConflict: 'test_name,player_key,fecha' })
      if (error) {
        await get().fetchEvaluaciones() // un lote anterior pudo haberse guardado
        throw new Error(getErrorMessage(error, 'No se pudieron guardar las evaluaciones.'))
      }
    }
    const { error } = await supabase.from('dynamic_evaluations').update({ test_config: config }).eq('test_name', testName)
    if (error) throw new Error(getErrorMessage(error, 'Se guardaron las filas pero no se pudo actualizar la configuración del test.'))
    await get().fetchEvaluaciones()
    return { guardadas: lote.length }
  },

  eliminarTest: async (testName) => {
    exigirSupabase()
    const { error } = await supabase.from('dynamic_evaluations').delete().eq('test_name', testName)
    if (error) throw new Error(getErrorMessage(error, 'No se pudo eliminar el test.'))
    set((s) => ({ filas: s.filas.filter((f) => f.test_name !== testName) }))
  },
}))

/** Filas del dashboard de NordBord. */
export const filasNordBord = (filas: FilaEvaluacionDinamica[]): FilaEvaluacionDinamica[] => filas.filter((f) => f.test_name === TEST_NORDBORD)
