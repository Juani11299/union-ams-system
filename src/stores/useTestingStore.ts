import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'

/**
 * Catálogo de tests (Fase 30 — Perfil de Rendimiento 360°, ver
 * docs/Propuesta_Integracion_NSCA.md sección 1). `higherIsBetter=false` marca
 * los tests de tiempo (sprint, agilidad): ahí un valor MENOR es la mejor
 * marca, así que el z-score se invierte antes de graficarlo — si no,
 * un jugador rápido aparecería en rojo (izquierda) por tener un número
 * "negativo" en la resta, cuando en realidad es su fortaleza.
 */
export interface TestDefinition {
  key: string
  label: string
  unidad: string
  higherIsBetter: boolean
}

export const TEST_CATALOG: TestDefinition[] = [
  { key: 'salto_vertical_cm', label: 'Salto Vertical (CMJ)', unidad: 'cm', higherIsBetter: true },
  { key: 'rsi', label: 'Índice de Fuerza Reactiva (RSI)', unidad: 'ratio', higherIsBetter: true },
  { key: 'sprint_10m_s', label: 'Sprint 10m', unidad: 's', higherIsBetter: false },
  { key: 'sprint_20m_s', label: 'Sprint 20m', unidad: 's', higherIsBetter: false },
  { key: 'agilidad_505_s', label: 'Agilidad 505', unidad: 's', higherIsBetter: false },
  { key: 'test_t_s', label: 'Test T (agilidad)', unidad: 's', higherIsBetter: false },
]

export interface TestRecord {
  id: string
  athleteId: string
  testKey: string
  valor: number
  fecha: string
}

export interface ZScoreResult {
  testKey: string
  label: string
  unidad: string
  valor: number
  zScore: number | null
  muestraInsuficiente: boolean
}

interface TestingState {
  records: TestRecord[]
  addRecord: (input: Omit<TestRecord, 'id'>) => void
  removeRecord: (id: string) => void
  /** Últimos valores del atleta (uno por test, el más reciente por fecha). */
  getUltimosValores: (athleteId: string) => TestRecord[]
  /**
   * Z-scores del atleta, calculados contra la población de TODOS los
   * registros de ese test en el store (todos los atletas cargados hasta
   * ahora) — mismo método del Cap. 13 de la NSCA (z = (x-media)/DE),
   * invertido en los tests de tiempo para que "positivo" sea siempre
   * "mejor" en el gráfico.
   */
  getZScoresParaAtleta: (athleteId: string) => ZScoreResult[]
}

export const useTestingStore = create<TestingState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (input) => {
        const record: TestRecord = { ...input, id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
        set((state) => ({ records: [...state.records, record] }))
      },

      removeRecord: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }))
      },

      getUltimosValores: (athleteId) => {
        const { records } = get()
        const porTest = new Map<string, TestRecord>()
        for (const r of records.filter((r) => r.athleteId === athleteId)) {
          const actual = porTest.get(r.testKey)
          if (!actual || r.fecha > actual.fecha) porTest.set(r.testKey, r)
        }
        return Array.from(porTest.values())
      },

      getZScoresParaAtleta: (athleteId) => {
        const { records, getUltimosValores } = get()
        const ultimos = getUltimosValores(athleteId)

        return ultimos.map((registro) => {
          const def = TEST_CATALOG.find((t) => t.key === registro.testKey)
          const label = def?.label ?? registro.testKey
          const unidad = def?.unidad ?? ''
          const higherIsBetter = def?.higherIsBetter ?? true

          const poblacion = records.filter((r) => r.testKey === registro.testKey).map((r) => r.valor)
          if (poblacion.length < 2) {
            return { testKey: registro.testKey, label, unidad, valor: registro.valor, zScore: null, muestraInsuficiente: true }
          }

          const media = poblacion.reduce((sum, v) => sum + v, 0) / poblacion.length
          const varianza = poblacion.reduce((sum, v) => sum + (v - media) ** 2, 0) / poblacion.length
          const desvioEstandar = Math.sqrt(varianza)

          if (desvioEstandar === 0) {
            return { testKey: registro.testKey, label, unidad, valor: registro.valor, zScore: 0, muestraInsuficiente: false }
          }

          let z = (registro.valor - media) / desvioEstandar
          if (!higherIsBetter) z = -z

          return { testKey: registro.testKey, label, unidad, valor: registro.valor, zScore: z, muestraInsuficiente: false }
        })
      },
    }),
    {
      name: 'soma-testing-store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
