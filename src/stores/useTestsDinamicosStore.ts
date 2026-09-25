import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'

export interface MetricaTestDinamico {
  /** Encabezado tal cual vino en el archivo. */
  key: string
  label: string
  unidad: string
  /** Métrica donde MENOS es mejor (asimetrías, tiempos): invierte Z-score y percentil. */
  menosEsMejor: boolean
  /** Métrica clave: se suma al Radar Neuromuscular Unificado del Perfil de Atleta 360°. */
  clave: boolean
}

export interface FilaTestDinamico {
  jugador: string
  categoria: string
  /** YYYY-MM-DD */
  fecha: string
  valores: Record<string, number>
}

/** Un test creado por el usuario a partir de un CSV/Excel nuevo (Hub de Evaluaciones). */
export interface TestDinamico {
  id: string
  nombre: string
  icono: string
  archivo: string
  creadoEn: string
  metricas: MetricaTestDinamico[]
  filas: FilaTestDinamico[]
}

interface TestsDinamicosState {
  tests: TestDinamico[]
  agregar: (test: Omit<TestDinamico, 'id' | 'creadoEn'>) => string
  eliminar: (id: string) => void
  renombrar: (id: string, nombre: string) => void
  /** Reemplaza qué métricas son "clave" (radar unificado) de un test. */
  setClaves: (id: string, claves: string[]) => void
}

/**
 * Tests dinámicos del Hub de Evaluaciones: cada CSV/Excel nuevo que el staff
 * nombra se guarda entero (filas ya parseadas) en IndexedDB del navegador y
 * genera una tarjeta nueva en el Hub. Son locales a este equipo, igual que el
 * CSV de NordBord (`useNordBordStore`) — la persistencia en Supabase queda
 * para cuando el formato del test esté estabilizado.
 */
export const useTestsDinamicosStore = create<TestsDinamicosState>()(
  persist(
    (set) => ({
      tests: [],
      agregar: (test) => {
        const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        set((s) => ({ tests: [...s.tests, { ...test, id, creadoEn: new Date().toISOString() }] }))
        return id
      },
      eliminar: (id) => set((s) => ({ tests: s.tests.filter((t) => t.id !== id) })),
      renombrar: (id, nombre) => set((s) => ({ tests: s.tests.map((t) => (t.id === id ? { ...t, nombre } : t)) })),
      setClaves: (id, claves) =>
        set((s) => ({
          tests: s.tests.map((t) =>
            t.id === id ? { ...t, metricas: t.metricas.map((m) => ({ ...m, clave: claves.includes(m.key) })) } : t,
          ),
        })),
    }),
    { name: 'soma-tests-dinamicos', storage: createJSONStorage(() => idbStorage) },
  ),
)
