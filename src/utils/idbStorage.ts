import { get, set, del } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

/**
 * Adaptador de IndexedDB (Fase 18) para el middleware `persist` de Zustand —
 * en vez de `localStorage`, que tiene un techo de ~5MB fácil de pisar con las
 * planillas/JSON del planificador (`gymSheetData`, `tacboardData`) sumadas a
 * todo el resto del store del club. `idb-keyval` es sólo un wrapper mínimo
 * sobre IndexedDB (un único object store, API get/set/del), no una capa de
 * queries — acá sólo se usa como backend de storage para `persist`.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}
