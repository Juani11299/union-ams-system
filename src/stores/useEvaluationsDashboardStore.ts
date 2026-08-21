import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'

/**
 * Datos persistidos del Dashboard Analítico de Evaluaciones (Fase 33.2, ver
 * docs/Propuesta_Integracion_NSCA.md sección 1) — antes vivían en `useState`
 * dentro de `EvaluacionesRendimientoTab.tsx` y se perdían al recargar la
 * página (F5). Guarda sólo el CSV crudo + su clasificación; la métrica/
 * filtros seleccionados quedan como estado local de UI (no tiene sentido
 * persistir qué gráfico estaba mirando el profe en ese momento).
 */
const PATRONES_METADATA = {
  jugador: ['jugador', 'player', 'nombre', 'atleta', 'name'],
  fechaNacimiento: ['fechanacimiento', 'birthdate', 'dob', 'nacimiento', 'fechadenacimiento'],
  categoria: ['categoria', 'category', 'division'],
  posicion: ['posicion', 'position', 'pos'],
}

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Clave de matching más agresiva que `normalizar` — también saca espacios/guiones para que "Fecha_Nacimiento" y "Fecha Nacimiento" calcen con el mismo patrón. */
function normalizarClave(texto: string): string {
  return normalizar(texto).replace(/[^a-z0-9]/g, '')
}

function esValorNumerico(valor: string): boolean {
  const limpio = valor.trim().replace(',', '.')
  return limpio !== '' && Number.isFinite(Number(limpio))
}

/** Una columna es "métrica" si NO es metadata y al menos 80% de sus valores no vacíos parsean como número — así una columna de fecha de nacimiento o de club nunca aparece en el selector de métricas. */
function esColumnaNumerica(columna: string, filas: Record<string, string>[]): boolean {
  const valores = filas.map((f) => (f[columna] ?? '').trim()).filter((v) => v !== '')
  if (valores.length === 0) return false
  const numericos = valores.filter(esValorNumerico).length
  return numericos / valores.length >= 0.8
}

export interface ClasificacionCsv {
  columnaJugador: string
  columnaCategoria: string | null
  columnaPosicion: string | null
  metricas: string[]
}

function clasificarColumnas(columnas: string[], filas: Record<string, string>[]): ClasificacionCsv {
  const claves = columnas.map((c) => ({ original: c, clave: normalizarClave(c) }))
  const encontrar = (patrones: string[]) => claves.find((c) => patrones.includes(c.clave))?.original ?? null

  const columnaJugador = encontrar(PATRONES_METADATA.jugador) ?? columnas[0]
  const columnaCategoria = encontrar(PATRONES_METADATA.categoria)
  const columnaPosicion = encontrar(PATRONES_METADATA.posicion)
  const columnaFechaNacimiento = encontrar(PATRONES_METADATA.fechaNacimiento)

  const metadata = new Set(
    [columnaJugador, columnaCategoria, columnaPosicion, columnaFechaNacimiento].filter((c): c is string => c !== null),
  )
  const metricas = columnas.filter((c) => !metadata.has(c) && esColumnaNumerica(c, filas))

  return { columnaJugador, columnaCategoria, columnaPosicion, metricas }
}

interface EvaluationsDashboardState {
  filas: Record<string, string>[]
  clasificacion: ClasificacionCsv | null
  nombreArchivo: string
  /** Clasifica y guarda un CSV recién parseado. Devuelve la clasificación para que el caller pueda setear la métrica inicial sin esperar un re-render. */
  cargarCsv: (columnas: string[], filas: Record<string, string>[], nombreArchivo: string) => ClasificacionCsv
  borrarDatos: () => void
}

export const useEvaluationsDashboardStore = create<EvaluationsDashboardState>()(
  persist(
    (set) => ({
      filas: [],
      clasificacion: null,
      nombreArchivo: '',

      cargarCsv: (columnas, filas, nombreArchivo) => {
        const clasificacion = clasificarColumnas(columnas, filas)
        set({ filas, clasificacion, nombreArchivo })
        return clasificacion
      },

      borrarDatos: () => set({ filas: [], clasificacion: null, nombreArchivo: '' }),
    }),
    {
      name: 'soma-evaluations-dashboard-store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
