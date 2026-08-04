import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </Card>
  )
}
