import type { Athlete, Roster, TeamCategory } from '@/types'

/**
 * Smart Entity Matcher (Fase 38) — cruza las filas de un CSV de evaluaciones
 * externas (ForceDecks, NordBord, etc.) contra la base de datos real del
 * club para resolver la categoría oficial de cada jugador, en vez de confiar
 * en lo que haya traído el CSV (año de nacimiento crudo, o nada).
 *
 * Orden de resolución (Paso 2):
 * 1. Fuzzy match por nombre contra `athletes` → category_id real vía Roster.
 * 2. Si no hay match pero el CSV trae año/fecha de nacimiento → Mapeo AFA (Paso 1).
 * 3. Si no hay ni match ni año → "Desconocida".
 */

function normalizarBase(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Normaliza un nombre para comparar sin importar el orden de palabras
 * ("Pérez, Juan" vs "Juan Pérez" vs "perez juan" — todos calzan). Sin tildes,
 * sin puntuación, minúsculas, palabras ordenadas alfabéticamente.
 */
export function normalizarNombre(nombre: string): string {
  return normalizarBase(nombre)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')
}

/** Año de referencia fijo pedido en el Paso 1 — no `new Date().getFullYear()`, a propósito: el mapeo AFA es una tabla fija para la temporada 2026, no una fórmula que se recalcule sola con el calendario. */
const ANIO_ACTUAL_REFERENCIA = 2026

/**
 * Mapeo de año de nacimiento → categoría AFA (Paso 1, "El Cerebro Temporal").
 * La tabla 2012-2005 es la pedida textualmente. Los extremos (2013 en
 * adelante, más joven que 9na) se extienden con el mismo paso de 1 año hacia
 * las categorías reales que ya existen en este club (Pre 9na, 10ma
 * División — ver `navConfig.ts`/`team_categories`), en vez de dejar a un
 * jugador de 10ma como "Desconocida" sólo porque el enunciado no llegaba
 * hasta ahí.
 */
export function mapearAnioACategoriaAfa(anioNacimiento: number): string {
  if (anioNacimiento >= 2014) return '10ma División'
  if (anioNacimiento === 2013) return 'Pre 9na'
  if (anioNacimiento === 2012) return '9na División'
  if (anioNacimiento === 2011) return '8va División'
  if (anioNacimiento === 2010) return '7ma División'
  if (anioNacimiento === 2009) return '6ta División'
  if (anioNacimiento === 2008) return '5ta División'
  if (anioNacimiento === 2007 || anioNacimiento === 2006) return '4ta División'
  return 'Reserva / Primera' // <= 2005
}

/** Saca el primer año de 4 dígitos plausible de un texto ("2012", "2012-05-12", "12/05/2012" → 2012). `null` si no hay nada usable. */
export function extraerAnioNacimiento(texto: string): number | null {
  const match = texto.trim().match(/(\d{4})/)
  if (!match) return null
  const anio = Number(match[1])
  if (!Number.isFinite(anio) || anio < 1990 || anio > ANIO_ACTUAL_REFERENCIA) return null
  return anio
}

export type FuenteCategoria = 'match-bd' | 'mapeo-afa' | 'desconocida'

export interface CategoriaResuelta {
  /** Texto final para filtrar/mostrar en el dashboard. */
  nombre: string
  fuente: FuenteCategoria
}

/**
 * Resuelve la categoría de UN jugador del CSV (Paso 2, lógica de asignación
 * completa). `rosters`/`categories` son las tablas reales del club
 * (`useAppStore`) — se filtra el roster por `activeSeasonId` para no
 * arrastrar una categoría de una temporada vieja si el jugador cambió de
 * división entre temporadas.
 */
export function resolverCategoriaClub(
  nombreCsv: string,
  anioNacimientoTexto: string | null,
  athletes: Athlete[],
  rosters: Roster[],
  categories: TeamCategory[],
  activeSeasonId: string | null,
): CategoriaResuelta {
  const nombreNormalizado = normalizarNombre(nombreCsv)

  if (nombreNormalizado !== '') {
    const atletaMatch = athletes.find((a) => normalizarNombre(a.nombre) === nombreNormalizado)
    if (atletaMatch) {
      const rosterEntry = rosters.find(
        (r) => r.athlete_id === atletaMatch.id && (!activeSeasonId || r.season_id === activeSeasonId),
      )
      const categoria = rosterEntry ? categories.find((c) => c.id === rosterEntry.category_id) : undefined
      if (categoria) {
        return { nombre: categoria.nombre, fuente: 'match-bd' }
      }
    }
  }

  if (anioNacimientoTexto) {
    const anio = extraerAnioNacimiento(anioNacimientoTexto)
    if (anio !== null) {
      // `nombre` queda LIMPIO (sin sufijo "(estimado)") a propósito: tiene
      // que calzar carácter por carácter con `categories[].nombre` del store
      // global para que el filtro se pueda sincronizar con el selector de
      // categoría del header (Paso 1). `fuente: 'mapeo-afa'` sigue
      // disponible para quien quiera distinguir confirmado vs. estimado.
      return { nombre: mapearAnioACategoriaAfa(anio), fuente: 'mapeo-afa' }
    }
  }

  return { nombre: 'Desconocida', fuente: 'desconocida' }
}
