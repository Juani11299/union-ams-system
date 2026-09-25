import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'

interface CsvGuardado {
  nombre: string
  texto: string
  /** ISO datetime de cuándo se cargó. */
  cargadoEn: string
}

interface NordBordState {
  csv: CsvGuardado | null
  setCsv: (nombre: string, texto: string) => void
  limpiar: () => void
}

/**
 * Último export de NordBord cargado en el dashboard. Se guarda el CSV crudo en
 * IndexedDB del navegador (mismo mecanismo que `useTestingStore`) y se vuelve a
 * procesar al abrir el dashboard — por eso el cruce con la antropometría
 * (categoría + peso) siempre usa la ficha más reciente. Es local a este equipo:
 * para verlo desde otro dispositivo hay que cargar el CSV ahí también.
 */
export const useNordBordStore = create<NordBordState>()(
  persist(
    (set) => ({
      csv: null,
      setCsv: (nombre, texto) => set({ csv: { nombre, texto, cargadoEn: new Date().toISOString() } }),
      limpiar: () => set({ csv: null }),
    }),
    { name: 'soma-nordbord-csv', storage: createJSONStorage(() => idbStorage) },
  ),
)
