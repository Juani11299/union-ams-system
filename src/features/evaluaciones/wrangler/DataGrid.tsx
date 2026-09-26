import { useEffect, useRef, useState } from 'react'
import { claveCelda } from './auditoria'
import type { ColumnaInfo, FilaGrid, ResultadoAuditoria } from './auditoria'

interface Props {
  columnas: ColumnaInfo[]
  filas: FilaGrid[]
  auditoria: ResultadoAuditoria
  seleccion: Set<number>
  onSeleccion: (s: Set<number>) => void
  onEditar: (filaId: number, col: string, valor: string) => void
  /** Filas por página. */
  porPagina?: number
}

const COLOR = {
  amarillo: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-500/40',
  rojo: 'bg-rose-200 text-rose-900 ring-1 ring-inset ring-rose-400 dark:bg-rose-500/30 dark:text-rose-100 dark:ring-rose-500/50',
}

/**
 * DataGrid interactivo del Data Wrangler: tabla paginada con selección de
 * filas, edición de celdas (doble click / Enter) y resaltado de sospechosas
 * (amarillo: nulo o cero · rojo: outlier ±3 DE). Pasar el mouse sobre una
 * celda marcada muestra el motivo.
 */
export function DataGrid({ columnas, filas, auditoria, seleccion, onSeleccion, onEditar, porPagina = 40 }: Props) {
  const [pagina, setPagina] = useState(0)
  const [editando, setEditando] = useState<{ fila: number; col: string } | null>(null)
  const [borrador, setBorrador] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const paginas = Math.max(1, Math.ceil(filas.length / porPagina))
  const pag = Math.min(pagina, paginas - 1)
  const visibles = filas.slice(pag * porPagina, (pag + 1) * porPagina)
  const todasVisiblesSel = visibles.length > 0 && visibles.every((f) => seleccion.has(f.id))

  useEffect(() => {
    if (editando) inputRef.current?.select()
  }, [editando])

  function empezar(fila: number, col: string, valor: string) {
    setEditando({ fila, col })
    setBorrador(valor)
  }
  function confirmar() {
    if (!editando) return
    onEditar(editando.fila, editando.col, borrador)
    setEditando(null)
  }
  function alternar(id: number) {
    const s = new Set(seleccion)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    onSeleccion(s)
  }
  function alternarPagina() {
    const s = new Set(seleccion)
    if (todasVisiblesSel) visibles.forEach((f) => s.delete(f.id))
    else visibles.forEach((f) => s.add(f.id))
    onSeleccion(s)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-[62vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 w-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
                <input type="checkbox" checked={todasVisiblesSel} onChange={alternarPagina} aria-label="Seleccionar la página" />
              </th>
              <th className="sticky top-0 z-20 w-12 border-b border-slate-200 bg-slate-50 px-2 py-2 text-right text-[10px] font-semibold uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-800">#</th>
              {columnas.map((c) => (
                <th key={c.nombre} className="sticky top-0 z-20 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" title={c.numerica && c.media !== null ? `Media ${c.media.toFixed(3)} · DE ${(c.sd ?? 0).toFixed(3)} · n=${c.n}` : undefined}>
                  {c.nombre}
                  {c.numerica && <span className="ml-1 font-normal normal-case text-slate-400">{c.media !== null ? `μ ${c.media.toFixed(1)}` : ''}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f, i) => {
              const roja = auditoria.filasRojo.has(f.id)
              const amarilla = auditoria.filasAmarillo.has(f.id)
              const sel = seleccion.has(f.id)
              return (
                <tr key={f.id} className={sel ? 'bg-union-red-50/70 dark:bg-union-red-500/10' : ''}>
                  <td className={`sticky left-0 z-10 border-b border-r border-slate-100 px-2 py-1 dark:border-slate-800 ${sel ? 'bg-union-red-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>
                    <input type="checkbox" checked={sel} onChange={() => alternar(f.id)} aria-label={`Seleccionar fila ${f.id + 1}`} />
                  </td>
                  <td className={`border-b border-slate-100 px-2 py-1 text-right tabular-nums dark:border-slate-800 ${roja ? 'font-bold text-rose-600' : amarilla ? 'font-bold text-amber-600' : 'text-slate-400'}`}>{pag * porPagina + i + 1}</td>
                  {columnas.map((c) => {
                    const valor = f.celdas[c.nombre] ?? ''
                    const sosp = auditoria.sospechas.get(claveCelda(f.id, c.nombre))
                    const enEdicion = editando?.fila === f.id && editando.col === c.nombre
                    return (
                      <td
                        key={c.nombre}
                        title={sosp?.detalle}
                        onDoubleClick={() => empezar(f.id, c.nombre, valor)}
                        className={`max-w-[220px] cursor-cell truncate whitespace-nowrap border-b border-slate-100 px-2 py-1 dark:border-slate-800 ${c.numerica ? 'text-right tabular-nums' : ''} ${sosp ? COLOR[sosp.severidad] : ''}`}
                      >
                        {enEdicion ? (
                          <input
                            ref={inputRef}
                            className="w-full min-w-[80px] rounded border border-union-red-400 bg-white px-1 py-0.5 text-xs text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100"
                            value={borrador}
                            onChange={(e) => setBorrador(e.target.value)}
                            onBlur={confirmar}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmar()
                              if (e.key === 'Escape') setEditando(null)
                            }}
                          />
                        ) : valor === '' && sosp ? (
                          <span className="italic opacity-70">vacío</span>
                        ) : (
                          valor
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={columnas.length + 2} className="py-10 text-center text-sm text-slate-400">
                  No hay filas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {filas.length} fila(s) · página {pag + 1} de {paginas} · doble click en una celda para editarla
        </span>
        <div className="flex gap-1">
          <button type="button" disabled={pag === 0} onClick={() => setPagina(pag - 1)} className="rounded-lg border border-slate-300 px-3 py-1 font-medium disabled:opacity-40 dark:border-slate-700">
            ← Anterior
          </button>
          <button type="button" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)} className="rounded-lg border border-slate-300 px-3 py-1 font-medium disabled:opacity-40 dark:border-slate-700">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  )
}
