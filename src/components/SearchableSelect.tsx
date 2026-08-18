import { useEffect, useRef, useState } from 'react'

export interface SearchableSelectOption {
  id: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
  emptyLabel?: string
  className?: string
}

/** Compara ignorando mayúsculas/tildes (ej. "Ivan" encuentra a "Iván"). */
function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Combobox mobile-first (Fase 21) — reemplaza el `<select>` nativo en los
 * formularios públicos de Wellness/RPE: con planteles grandes, desplazar un
 * `<select>` largo con el pulgar es mucho más lento que escribir 2-3 letras y
 * filtrar. El dropdown es `absolute` para no empujar el resto del layout, y
 * los ítems usan área de toque grande (`py-3`) pensando en mobile.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar…',
  emptyLabel = 'Sin resultados',
  className = '',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  const seleccionado = options.find((o) => o.id === value) ?? null

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickFuera)
    return () => document.removeEventListener('mousedown', onClickFuera)
  }, [])

  const queryNormalizada = normalizar(query)
  const filtradas = queryNormalizada
    ? options.filter((o) => normalizar(o.label).includes(queryNormalizada))
    : options

  return (
    <div ref={contenedorRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-controls="searchable-select-listbox"
        autoComplete="off"
        value={abierto ? query : (seleccionado?.label ?? '')}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!abierto) setAbierto(true)
        }}
        onFocus={() => {
          setAbierto(true)
          setQuery('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur()
        }}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-base font-semibold text-slate-800 focus:border-union-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {abierto && (
        <div
          id="searchable-select-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {filtradas.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">{emptyLabel}</p>
          ) : (
            filtradas.map((o) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => {
                  onChange(o.id)
                  setAbierto(false)
                  setQuery('')
                }}
                className="block w-full rounded-lg px-3 py-3 text-left text-base font-medium text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {o.label}
                {o.sublabel && <span className="ml-1.5 text-xs font-normal text-slate-400">{o.sublabel}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
