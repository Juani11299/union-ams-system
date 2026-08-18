import type { Posicion } from '@/types'

const POSICIONES_VALIDAS: Posicion[] = [
  'Arquero',
  'Defensor Central',
  'Lateral',
  'Volante Central',
  'Volante Ofensivo',
  'Extremo',
  'Delantero',
]

const POSICION_POR_NOMBRE = new Map(POSICIONES_VALIDAS.map((p) => [p.toLowerCase(), p]))

export interface FilaJugadorImportado {
  nombre: string
  posiciones: Posicion[]
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
 * Formato esperado por fila: `Nombre | Apellido | Posición | Documento
 * (opcional)`, separado por tabulaciones (pegado desde Excel/Sheets) o comas
 * (.csv). Ignora filas vacías y junta cada error de fila individualmente en
 * vez de abortar todo el pegado — el staff puede corregir sólo las filas que
 * fallaron sin tener que volver a pegar las que ya estaban bien.
 */
export function parsearImportacionJugadores(texto: string): ResultadoParseoImportacion {
  const validas: FilaJugadorImportado[] = []
  const errores: ErrorFilaImportacion[] = []

  texto.split('\n').forEach((lineaCruda, indice) => {
    const linea = lineaCruda.trim()
    if (!linea) return

    const numeroFila = indice + 1
    const [nombre, apellido, posicionCruda, documento] = dividirColumnas(linea)

    if (!nombre?.trim() || !apellido?.trim()) {
      errores.push({ fila: numeroFila, texto: linea, motivo: 'Falta el nombre o el apellido.' })
      return
    }
    if (!posicionCruda?.trim()) {
      errores.push({ fila: numeroFila, texto: linea, motivo: 'Falta la posición.' })
      return
    }
    const posicion = POSICION_POR_NOMBRE.get(posicionCruda.trim().toLowerCase())
    if (!posicion) {
      errores.push({
        fila: numeroFila,
        texto: linea,
        motivo: `Posición "${posicionCruda.trim()}" no reconocida.`,
      })
      return
    }

    validas.push({
      nombre: `${nombre.trim()} ${apellido.trim()}`,
      posiciones: [posicion],
      documento: documento?.trim() || undefined,
    })
  })

  return { validas, errores }
}
