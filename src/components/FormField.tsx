import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

interface FieldProps {
  label: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
}

export function Field({ label, error, required, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  )
}
