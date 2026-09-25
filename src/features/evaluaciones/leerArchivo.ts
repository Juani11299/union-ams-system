import Papa from 'papaparse'
import type { Matriz, Celda } from '@/features/antropometrias/parser'

/**
 * Lee un CSV o Excel como matriz cruda. Los CSV exportados desde Excel en
 * español a veces vienen en Windows-1252: se prueba UTF-8 estricto y, si no es
 * válido, se reintenta como Windows-1252 (si no, se rompen las tildes de los
 * encabezados). `xlsx` se carga recién acá para no engordar el bundle inicial.
 */
export async function leerArchivoTabular(file: File): Promise<Matriz> {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    const XLSX = await import('xlsx')
    const libro = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    for (const nombre of libro.SheetNames) {
      const matriz = XLSX.utils.sheet_to_json<Celda[]>(libro.Sheets[nombre], { header: 1, raw: true, defval: '' })
      if (matriz.length > 1) return matriz
    }
    return []
  }
  const buffer = await file.arrayBuffer()
  let texto: string
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '')
  } catch {
    texto = new TextDecoder('windows-1252').decode(buffer)
  }
  return Papa.parse<string[]>(texto, { skipEmptyLines: true }).data
}
