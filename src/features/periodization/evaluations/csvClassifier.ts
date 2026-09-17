/**
 * Clasificador de columnas de CSV de evaluaciones (Fase 38 — reemplaza el
 * clasificador de `useEvaluationsDashboardStore.ts`, Fase 33.2, que vivía
 * acoplado a ese store efímero). El CSV puede traer CUALQUIER batería de
 * test (CMJ_Height, Fuerza_Max_Izq, Asimetria_RSI, Peso, etc.) — acá se
 * separan en 3 grupos: identidad del jugador (para matchear contra el
 * plantel real, ver `smartEntityMatcher.ts`), peso corporal (campo propio,
 * no una métrica más — se usa para relativizar otras métricas), y el resto
 * de las columnas numéricas (las métricas de verdad).
 */

const PATRONES_JUGADOR = ['jugador', 'player', 'nombre', 'atleta', 'name']
const PATRONES_PESO = ['peso', 'weight', 'pesocorporal', 'bodyweight', 'bodymass', 'masacorporal', 'pesokg']
const PATRONES_IGNORAR = [
  // Columnas de identidad/metadata que nunca son una métrica a graficar,
  // aunque a veces vengan como número (ej. DNI).
  'dni',
  'documento',
  'id',
  'fecha',
  'date',
  'categoria',
  'category',
  'division',
  'posicion',
  'position',
  'pos',
  'club',
  'equipo',
  'observaciones',
  'notas',
  'comentarios',
]

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Clave de matching más agresiva que `normalizar` — también saca espacios/guiones para que "Peso Corporal" y "peso_corporal" calcen con el mismo patrón. */
export function normalizarClave(texto: string): string {
  return normalizar(texto).replace(/[^a-z0-9]/g, '')
}

function esValorNumerico(valor: string): boolean {
  const limpio = valor.trim().replace(',', '.')
  return limpio !== '' && Number.isFinite(Number(limpio))
}

/** Una columna es "métrica" si al menos 80% de sus valores no vacíos parsean como número — así una columna de texto suelta nunca aparece en el selector de métricas. */
function esColumnaNumerica(columna: string, filas: Record<string, string>[]): boolean {
  const valores = filas.map((f) => (f[columna] ?? '').trim()).filter((v) => v !== '')
  if (valores.length === 0) return false
  const numericos = valores.filter(esValorNumerico).length
  return numericos / valores.length >= 0.8
}

export function parsearNumeroCsv(valor: unknown): number | null {
  const num = Number(String(valor ?? '').replace(',', '.'))
  return Number.isFinite(num) ? num : null
}

export interface ClasificacionCsvEvaluacion {
  columnaJugador: string
  columnaPeso: string | null
  /** Columnas numéricas que van al selector de métricas — ya sin jugador, peso, ni las columnas de metadata de `PATRONES_IGNORAR`. */
  metricas: string[]
}

export function clasificarColumnasEvaluacion(
  columnas: string[],
  filas: Record<string, string>[],
): ClasificacionCsvEvaluacion {
  const claves = columnas.map((c) => ({ original: c, clave: normalizarClave(c) }))
  const encontrar = (patrones: string[]) => claves.find((c) => patrones.includes(c.clave))?.original ?? null

  const columnaJugador = encontrar(PATRONES_JUGADOR) ?? columnas[0]
  const columnaPeso = encontrar(PATRONES_PESO)

  const excluidas = new Set([columnaJugador, columnaPeso].filter((c): c is string => c !== null))

  const metricas = columnas.filter((c) => {
    if (excluidas.has(c)) return false
    if (PATRONES_IGNORAR.includes(normalizarClave(c))) return false
    return esColumnaNumerica(c, filas)
  })

  return { columnaJugador, columnaPeso, metricas }
}
