import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'
import type { MedicionAntropo } from '@/features/antropometrias/types'

export interface ArchivoImportado {
  nombre: string
  /** ISO datetime de cuándo se importó. */
  importadoEn: string
  mediciones: number
}

interface AntropometriasState {
  mediciones: MedicionAntropo[]
  archivos: ArchivoImportado[]
  /**
   * Suma las mediciones nuevas. Si ya existía una del mismo jugador+categoría+
   * fecha (mismo `id`) la PISA con el dato nuevo — re-importar el archivo
   * corregido por el nutricionista no duplica nada.
   */
  importar: (nuevas: MedicionAntropo[], nombreArchivo: string) => { agregadas: number; actualizadas: number }
  limpiarTodo: () => void
}

/**
 * Store del módulo de Antropometrías — INDEPENDIENTE de `useAppStore`
 * (mismo criterio que el panel de Evaluaciones de Rendimiento, Fase 39/41):
 * no lee ni escribe jugadores/categorías del club, todo sale del archivo
 * importado. Persiste en IndexedDB del navegador (`idbStorage`, como
 * `useTestingStore`), NO en Supabase: son datos de salud (composición
 * corporal, incluye juveniles) y quedan sólo en el equipo donde se
 * importó el archivo — no viajan por la base compartida.
 */
export const useAntropometriasStore = create<AntropometriasState>()(
  persist(
    (set, get) => ({
      mediciones: [],
      archivos: [],

      importar: (nuevas, nombreArchivo) => {
        const porId = new Map(get().mediciones.map((m) => [m.id, m]))
        let agregadas = 0
        let actualizadas = 0
        for (const m of nuevas) {
          if (porId.has(m.id)) actualizadas++
          else agregadas++
          porId.set(m.id, m)
        }
        set((state) => ({
          mediciones: Array.from(porId.values()),
          archivos: [
            { nombre: nombreArchivo, importadoEn: new Date().toISOString(), mediciones: nuevas.length },
            ...state.archivos,
          ].slice(0, 20),
        }))
        return { agregadas, actualizadas }
      },

      limpiarTodo: () => set({ mediciones: [], archivos: [] }),
    }),
    {
      name: 'soma-antropometrias-store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
