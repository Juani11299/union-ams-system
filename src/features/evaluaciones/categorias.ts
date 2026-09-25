/** ¿Dato importable como año ("2010") en vez de categoría? Los CSV de ForceDecks traen CAT = año de nacimiento. */
export const esAnio = (c: string): boolean => /^(19|20)\d{2}$/.test(c.trim())

/**
 * Año de nacimiento → categoría del club (temporada 2026, según los títulos del
 * informe del nutricionista: 4ta 2006-07, 5ta 2008, 6ta 2009, 7ma 2010, 8va 2011,
 * 9na 2012, Pre 9na 2013, 10ma 2014). Se usa sólo cuando el jugador no calza con
 * ninguna antropometría. Hay que actualizarlo al cambiar de temporada.
 */
export const CATEGORIA_POR_ANIO: Record<string, string> = {
  '2005': '4ta', '2006': '4ta', '2007': '4ta', '2008': '5ta', '2009': '6ta', '2010': '7ma', '2011': '8va', '2012': '9na', '2013': 'Pre 9na', '2014': '10ma',
}

export const catDeLabel = (c: string | null): string | null => (c && esAnio(c) ? (CATEGORIA_POR_ANIO[c.trim()] ?? c) : c)
