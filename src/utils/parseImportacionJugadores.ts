const FECHA_NACIMIENTO_FALLBACK = '2000-01-01'

/**
 * Diccionario de abreviaturas reales de posición tal como las usa el club en
 * su propia planilla de Excel (ej. "def. central", "vol. der.") — no son las
 * 7 etiquetas prolijas de `Posicion` (`src/types/athlete.ts`) que usa el
 * formulario manual de "Nuevo jugador". La tabla `athletes` no tiene un
 * `check` sobre `posiciones` (a diferencia de `estado_salud`, que sí lo
 * tiene) — es `text[]` libre — así que el importador puede guardar la
 * posición "canonizada" cuando reconoce la abreviatura, y si no la reconoce,
 * guarda el string tal cual vino en vez de rechazar la fila entera: perder
 * al jugador por una abreviatura de posición que no anticipamos es peor que
 * guardar una posición con el texto crudo del staff.
 */
const ABREVIATURAS_POSICION: Record<string, string> = {
  arq: 'Arquero',
  arquero: 'Arquero',
  def: 'Defensor Central',
  'def central': 'Defensor Central',
  defensor: 'Defensor Central',
  'defensor central': 'Defensor Central',
  central: 'Defensor Central',
  lat: 'Lateral',
  lateral: 'Lateral',
  vol: 'Volante Central',
  volante: 'Volante Central',
  'vol central': 'Volante Central',
  'volante central': 'Volante Central',
  mediocampista: 'Volante Central',
  'vol of': 'Volante Ofensivo',
  'vol ofensivo': 'Volante Ofensivo',
  'volante ofensivo': 'Volante Ofensivo',
  ofensivo: 'Volante Ofensivo',
  ext: 'Extremo',
  extremo: 'Extremo',
  wing: 'Extremo',
  del: 'Delantero',
  delantero: 'Delantero',
  dt: 'Delantero',
}

// Modificadores de lado/orientación que el club agrega después de la
// posición base ("vol. der.", "lateral izq.") — no cambian a qué de las 7
// posiciones "madre" corresponde el jugador, así que se recortan antes de
// buscar en el diccionario de arriba.
const SUFIJOS_DIRECCIONALES = [' der', ' derecho', ' derecha', ' izq', ' izquierdo', ' izquierda']

function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Intenta canonizar una posición cruda del Excel del club a una de las 7
 * `Posicion` del sistema. Si no reconoce ni la forma completa ni la forma
 * sin sufijo direccional, devuelve el texto original (recortado, con la
 * primera letra en mayúscula) en vez de fallar — ver comentario del
 * diccionario de arriba sobre por qué no se rechaza la fila por esto.
 */
function canonizarPosicion(crudo: string): string {
  const normalizado = normalizarTexto(crudo)
  const directo = ABREVIATURAS_POSICION[normalizado]
  if (directo) return directo

  const sinSufijo = SUFIJOS_DIRECCIONALES.reduce(
    (acc, sufijo) => (acc.endsWith(sufijo) ? acc.slice(0, -sufijo.length).trim() : acc),
    normalizado,
  )
  const base = ABREVIATURAS_POSICION[sinSufijo]
  if (base) return base

  const original = crudo.trim()
  return original.charAt(0).toUpperCase() + original.slice(1)
}

/**
 * Convierte una fecha `DD/MM/AAAA` o `D/M/AAAA` (formato real del Excel del
 * club) a ISO `AAAA-MM-DD`. Ante cualquier fecha vacía, incompleta o
 * inválida (día/mes/año fuera de rango), devuelve el fallback en vez de
 * rechazar la fila — a diferencia del nombre y la posición, no hay forma de
 * pedirle al staff "corregí esta celda" fila por fila sin trabar todo el
 * import por un typo de fecha.
 */
function parsearFechaNacimiento(crudo: string | undefined): string {
  const partes = crudo?.trim().split('/')
  if (!partes || partes.length !== 3) return FECHA_NACIMIENTO_FALLBACK

  const [d, m, a] = partes.map((p) => Number(p))
  const anioCompleto = a < 100 ? 2000 + a : a
  if (
    !Number.isInteger(d) ||
    !Number.isInteger(m) ||
    !Number.isInteger(anioCompleto) ||
    d < 1 ||
    d > 31 ||
    m < 1 ||
    m > 12 ||
    anioCompleto < 1980 ||
    anioCompleto > new Date().getFullYear()
  ) {
    return FECHA_NACIMIENTO_FALLBACK
  }

  return `${anioCompleto}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * El Excel del club junta apellido(s) y nombre(s) en una sola celda, sin
 * separador ("Drescher Krause Thiago", "Albornoz Mateo") — la única
 * heurística simple que no depende de una lista de apellidos compuestos
 * conocidos es asumir que la ÚLTIMA palabra es el nombre de pila y todo lo
 * anterior es el apellido (posiblemente compuesto). Se reordena a "Nombre
 * Apellido" para guardar en `Athlete.nombre` con el mismo criterio que usa
 * el formulario manual de "Nuevo jugador" (placeholder "Ej. Juan Pérez").
 */
function dividirNombreCompleto(crudo: string): string {
  const palabras = crudo.trim().split(/\s+/).filter(Boolean)
  if (palabras.length <= 1) return crudo.trim()
  const nombre = palabras[palabras.length - 1]
  const apellido = palabras.slice(0, -1).join(' ')
  return `${nombre} ${apellido}`
}

export interface FilaJugadorImportado {
  nombre: string
  posiciones: string[]
  fechaNacimiento: string
  /** No se persiste todavía — `athletes` no tiene columna de documento. Se
   * conserva en el resultado del parseo únicamente para mostrarlo en la
   * previsualización, así el staff no tiene que reordenar su planilla. */
  documento?: string
}

export interface ErrorFilaImportacion {
  fila: number
  texto: string
  motivo: string
}

export interface ResultadoParseoImportacion {
  validas: FilaJugadorImportado[]
  errores: ErrorFilaImportacion[]
}

function dividirColumnas(linea: string): string[] {
  // Pegado directo desde Excel/Sheets viene separado por tabulaciones; un
  // .csv exportado viene separado por comas. Si hay tabs, son la fuente de
  // verdad (una posición como "Defensor, Central" con coma no debería
  // romper el parseo de un pegado de Excel).
  const porTab = linea.split('\t')
  if (porTab.length > 1) return porTab.map((c) => c.trim())
  return linea.split(',').map((c) => c.trim())
}

/**
 * Parsea el texto pegado en el importador masivo de jugadores (Fase 19).
 * Formato real del club: `Apellido y Nombre | Posición | Fecha Nac.
 * (DD/MM/AAAA) | DNI (opcional)`, separado por tabulaciones (pegado desde
 * Excel/Sheets) o comas (.csv). Ignora filas vacías y junta cada error de
 * fila individualmente en vez de abortar todo el pegado — el staff puede
 * corregir sólo las filas que fallaron sin tener que volver a pegar las que
 * ya estaban bien.
 *
 * Sólo el nombre y la posición pueden hacer fallar una fila: la fecha de
 * nacimiento y el documento siempre resuelven a algún valor (ver
 * `parsearFechaNacimiento` y el campo `documento`, respectivamente).
 */
export function parsearImportacionJugadores(texto: string): ResultadoParseoImportacion {
  const validas: FilaJugadorImportado[] = []
  const errores: ErrorFilaImportacion[] = []

  texto.split('\n').forEach((lineaCruda, indice) => {
    const linea = lineaCruda.trim()
    if (!linea) return

    const numeroFila = indice + 1
    const [nombreCompleto, posicionCruda, fechaCruda, documento] = dividirColumnas(linea)

    if (!nombreCompleto?.trim()) {
      errores.push({ fila: numeroFila, texto: linea, motivo: 'Falta el nombre y apellido.' })
      return
    }
    if (!posicionCruda?.trim()) {
      errores.push({ fila: numeroFila, texto: linea, motivo: 'Falta la posición.' })
      return
    }

    validas.push({
      nombre: dividirNombreCompleto(nombreCompleto),
      posiciones: [canonizarPosicion(posicionCruda)],
      fechaNacimiento: parsearFechaNacimiento(fechaCruda),
      documento: documento?.trim() || undefined,
    })
  })

  return { validas, errores }
}
