/**
 * Fase 38/40/41 — el módulo de Evaluaciones de Rendimiento identifica
 * jugador y categoría por los datos crudos del CSV (`playerKey`,
 * `categoryLabel`), sin matchear contra `athletes`/`rosters`/categorías
 * reales del club. `normalizarNombre` es la única pieza que sigue en pie:
 * la usa `ImportCsvPanel.tsx` para construir `playerKey` a partir del
 * nombre tal cual vino en el CSV.
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
