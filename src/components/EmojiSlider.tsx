interface EmojiSliderProps {
  icono: string
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** Emoji "cara" que representa el valor actual (distinto del ícono fijo de la categoría). */
  emoji: (value: number) => string
  descripcion: (value: number) => string
  color: (value: number) => string
  minLabel?: string
  maxLabel?: string
}

const sliderThumbClass =
  'h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md'

/**
 * Slider grande con cara emoji + color dinámico (Fase 24, estilo "Training
 * Feel") — reemplaza los botones numéricos tradicionales en los formularios
 * públicos de Wellness/RPE. El thumb es grande (h-8/w-8) a propósito: pensado
 * para el pulgar en mobile, no para mouse.
 */
export function EmojiSlider({
  icono,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  emoji,
  descripcion,
  color,
  minLabel,
  maxLabel,
}: EmojiSliderProps) {
  const colorActual = color(value)
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span aria-hidden>{icono}</span> {label}
      </span>
      <span className="text-4xl" aria-hidden>
        {emoji(value)}
      </span>
      <span className="text-2xl font-bold" style={{ color: colorActual }}>
        {value}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{descripcion(value)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={sliderThumbClass}
        style={{
          background: `linear-gradient(to right, ${colorActual} 0%, ${colorActual} ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
        }}
      />
      {(minLabel || maxLabel) && (
        <div className="flex w-full justify-between text-[11px] text-slate-400">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}
