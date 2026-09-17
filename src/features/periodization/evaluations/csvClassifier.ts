/**
 * Clasificador de columnas de CSV de evaluaciones (Fase 38 — reemplaza el
 * clasificador de `useEvaluationsDashboardStore.ts`, Fase 33.2, que vivía
 * acoplado a ese store efímero). El CSV puede traer CUALQUIER batería de
 * test (CMJ_Height, Fuerza_Max_Izq, Asimetria_RSI, Peso, etc.) — acá se
 * separan en grupos: identidad del jugador (Fase 40 — el nombre se toma tal
 * cual, ya no matchea contra el plantel real), categoría (Fase 41 — ídem,
 * se toma tal cual del CSV, ver `columnaCategoria`), fecha por fila (Fase
 * 42.1 — ver `columnaFecha`), peso corporal (campo propio, no una métrica
 * más — se usa para relativizar otras métricas), y el resto de las
 * columnas numéricas (las métricas de verdad).
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
// "CAT" — exportaciones masivas de plataformas de fuerza (Fase 42): la
// categoría/división REAL del deportista. Fase 42.1 (corrección del profe)
// — "AÑO" NO va acá: es el año de la EVALUACIÓN, no la categoría del
// jugador, así que no debe poblar "AGRUPAR POR" (queda sólo ignorada, ver
// PATRONES_IGNORAR más abajo). `cat` se busca antes que nada en `encontrar`
// para priorizar la categoría real del deportista.
const PATRONES_CATEGORIA = ['cat', 'categoria', 'category', 'division']
// "FECHA"/"DATE" — fecha de CADA fila (Fase 42.1): en un CSV longitudinal
// (exportación de toda la temporada) cada jugador puede tener varias filas
// en fechas distintas — se usa el valor de ESTA columna por fila, no una
// única fecha tipeada a mano para todo el lote, así los gráficos de
// evolución (Tabla Comparativa, Línea de Tiempo) ven todas las fechas
// reales del CSV.
const PATRONES_FECHA = ['fecha', 'date']
const PATRONES_IGNORAR = [
  // Columnas de identidad/metadata que nunca son una métrica a graficar,
  // aunque a veces vengan como número (ej. DNI). Fase 42 — se suman los
  // identificadores típicos de exportaciones masivas de CMJ Bilateral/
  // Unilateral (ForceDecks/Hawkin): AT_ID, TEST_ID, ExternalId, Test Type,
  // Tags, FEC NAC — nunca son métricas graficables. Fase 42.1 — se suma
  // "AÑO" (año de la evaluación, no categoría — ver arriba).
  'dni',
  'documento',
  'id',
  'ano',
  'fecnac',
  'atid',
  'testid',
  'externalid',
  'testtype',
  'tags',
  ...PATRONES_CATEGORIA,
  ...PATRONES_FECHA,
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

function armarFechaIso(anio: number, mes: number, dia: number): string | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * Parsea la fecha de UNA fila del CSV a "YYYY-MM-DD" (Fase 42.1) — soporta
 * "YYYY-MM-DD" (ya ISO, con o sin hora pegada atrás) y "DD/MM/YYYY" o
 * "DD-MM-YYYY" (día primero, el formato que traen la mayoría de las
 * plataformas de fuerza configuradas en español/Argentina), con año de 2 o
 * 4 dígitos. `null` si el texto no se pudo interpretar — esa fila cae al
 * selector de fecha manual del panel.
 */
export function parsearFechaCsv(valor: unknown): string | null {
  const texto = String(valor ?? '').trim()
  if (texto === '') return null

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return armarFechaIso(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const diaPrimero = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (diaPrimero) {
    const anio = diaPrimero[3].length === 2 ? 2000 + Number(diaPrimero[3]) : Number(diaPrimero[3])
    return armarFechaIso(anio, Number(diaPrimero[2]), Number(diaPrimero[1]))
  }

  return null
}

export interface ClasificacionCsvEvaluacion {
  columnaJugador: string
  columnaPeso: string | null
  /** Fase 41 — columna que trae la categoría/división del jugador tal cual la puso el CSV (`null` si no se detectó ninguna, ver `PATRONES_CATEGORIA`). Es la base del filtro "AGRUPAR POR" del dashboard. */
  columnaCategoria: string | null
  /** Fase 42.1 — columna que trae la fecha DE ESA FILA (`null` si no se detectó ninguna, ver `PATRONES_FECHA`). Si existe, cada fila usa su propia fecha (CSV longitudinal); si no, el import cae al selector de fecha manual del panel. */
  columnaFecha: string | null
  /** Columnas numéricas que van al selector de métricas — ya sin jugador, peso, categoría, fecha, ni las columnas de metadata de `PATRONES_IGNORAR`. */
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
  const columnaFecha = encontrar(PATRONES_FECHA)

  const excluidas = new Set(
    [columnaJugador, columnaPeso, columnaCategoria, columnaFecha].filter((c): c is string => c !== null),
  )

  const metricas = columnas.filter((c) => {
    if (excluidas.has(c)) return false
    if (PATRONES_IGNORAR.includes(normalizarClave(c))) return false
    return esColumnaNumerica(c, filas)
  })

  return { columnaJugador, columnaPeso, columnaCategoria, columnaFecha, metricas }
}
