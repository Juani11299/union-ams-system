const COLORES_BUENO_A_MALO = [
  'bg-emerald-500 border-emerald-500 text-white',
  'bg-lime-500 border-lime-500 text-white',
  'bg-amber-500 border-amber-500 text-white',
  'bg-orange-500 border-orange-500 text-white',
  'bg-rose-500 border-rose-500 text-white',
]

interface RatingPickerProps {
  label: string
  value: number
  onChange: (value: number) => void
  emojis: string[]
  /** Si es true, 1 = mejor (verde) ... 5 = peor (rojo). Si es false, 1 = peor ... 5 = mejor. */
  invert?: boolean
}

export function RatingPicker({ label, value, onChange, emojis, invert = false }: RatingPickerProps) {
  const colores = invert ? COLORES_BUENO_A_MALO : [...COLORES_BUENO_A_MALO].reverse()

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const activo = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xl transition-all active:scale-95 ${
                activo
                  ? colores[n - 1]
                  : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800'
              }`}
              aria-pressed={activo}
              aria-label={`${label}: ${n} de 5`}
            >
              <span>{emojis[n - 1]}</span>
              <span className="text-xs font-semibold">{n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
