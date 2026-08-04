interface MiniBarChartProps {
  valores: number[]
  className?: string
  barClassName?: string
}

export function MiniBarChart({
  valores,
  className = '',
  barClassName = 'bg-emerald-500 dark:bg-emerald-400',
}: MiniBarChartProps) {
  const max = Math.max(...valores, 1)

  return (
    <div className={`flex h-10 items-end gap-1 ${className}`}>
      {valores.map((valor, i) => (
        <div
          key={i}
          className="flex h-full flex-1 flex-col justify-end overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800"
        >
          <div
            className={`w-full rounded-sm ${barClassName}`}
            style={{
              height: `${Math.max((valor / max) * 100, valor > 0 ? 8 : 0)}%`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
