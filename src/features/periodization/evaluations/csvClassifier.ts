/**
 * Clasificador de columnas de CSV de evaluaciones (Fase 38 — reemplaza el
 * clasificador de `useEvaluationsDashboardStore.ts`, Fase 33.2, que vivía
 * acoplado a ese store efímero). El CSV puede traer CUALQUIER batería de
 * test (CMJ_Height, Fuerza_Max_Izq, Asimetria_RSI, Peso, etc.) — acá se
 * separan en grupos: identidad del jugador (Fase 40 — el nombre se toma tal
 * cual, ya no matchea contra el plantel real), categoría (Fase 41 — ídem,
 * se toma tal cual del CSV, ver `columnaCategoria`), peso corporal (campo
 * propio, no una métrica más — se usa para relativizar otras métricas), y
 * el resto de las columnas numéricas (las métricas de verdad).
 */

const PATRONES_JUGADOR = ['jugador', 'player', 'nombre', 'atleta', 'name']
const PATRONES_PESO = [
  'peso',
  'weight',
  'pesocorporal',
  'bodyweight',
  'bodymass',
  'masacorporal',
  'pesokg',
  // "BW [KG]" — exportaciones de plataformas de fuerza (ForceDecks/Hawkin, Fase 42).
  'bw',
  'bwkg',
]
const PATRONES_CATEGORIA = [
  'categoria',
  'category',
  'division',
  // "AÑO"/"CAT" — exportaciones masivas de plataformas de fuerza (Fase 42):
  // se tratan igual que Categoria/Category/Division, poblando "AGRUPAR POR".
  'ano',
  'cat',
]
const PATRONES_IGNORAR = [
  // Columnas de identidad/metadata que nunca son una métrica a graficar,
  // aunque a veces vengan como número (ej. DNI). Fase 42 — se suman los
  // identificadores típicos de exportaciones masivas de CMJ Bilateral/
  // Unilateral (ForceDecks/Hawkin): AT_ID, TEST_ID, ExternalId, Test Type,
  // Tags, FEC NAC — nunca son métricas graficables.
  'dni',
  'documento',
  'id',
  'fecha',
  'date',
  'fecnac',
  'atid',
  'testid',
  'externalid',
  'testtype',
  'tags',
  ...PATRONES_CATEGORIA,
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
  /** Fase 41 — columna que trae la categoría/división del jugador tal cual la puso el CSV (`null` si no se detectó ninguna, ver `PATRONES_CATEGORIA`). Es la base del filtro "AGRUPAR POR" del dashboard. */
  columnaCategoria: string | null
  /** Columnas numéricas que van al selector de métricas — ya sin jugador, peso, categoría, ni las columnas de metadata de `PATRONES_IGNORAR`. */
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
  const columnaCategoria = encontrar(PATRONES_CATEGORIA)

  const excluidas = new Set(
    [columnaJugador, columnaPeso, columnaCategoria].filter((c): c is string => c !== null),
  )

  const metricas = columnas.filter((c) => {
    if (excluidas.has(c)) return false
    if (PATRONES_IGNORAR.includes(normalizarClave(c))) return false
    return esColumnaNumerica(c, filas)
  })

  return { columnaJugador, columnaPeso, columnaCategoria, metricas }
}
