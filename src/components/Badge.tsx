type BadgeTone = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
}

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}

export function Badge({ children, tone = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export type { BadgeTone }
