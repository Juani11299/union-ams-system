import type { ReactNode } from 'react'
import type { Tono } from '@/features/workload/workloadInsights'

/** Estilos por tono, consistentes con el resto de la app (bordes sutiles, fondos suaves, soporte dark). */
export const TONO: Record<Tono, { card: string; badge: string; icono: string }> = {
  verde: { card: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', icono: 'text-emerald-600 dark:text-emerald-400' },
  amarillo: { card: 'border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', icono: 'text-amber-600 dark:text-amber-400' },
  rojo: { card: 'border-rose-300 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-500/5', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300', icono: 'text-rose-600 dark:text-rose-400' },
  azul: { card: 'border-sky-200 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/5', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300', icono: 'text-sky-600 dark:text-sky-400' },
  gris: { card: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40', badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', icono: 'text-slate-500 dark:text-slate-400' },
}

export function TarjetaAccion({ icono, titulo, estado, tono, children }: { icono: ReactNode; titulo: string; estado: string; tono: Tono; children: ReactNode }) {
  const t = TONO[tono]
  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-4 ${t.card}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <span className={t.icono}>{icono}</span>
        {titulo}
      </div>
      <span className={`w-fit rounded-full px-3 py-1 text-sm font-bold leading-snug ${t.badge}`}>{estado}</span>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{children}</p>
    </div>
  )
}

export function EncabezadoPanel({ icono, titulo, subtitulo }: { icono: ReactNode; titulo: string; subtitulo: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-union-charcoal text-white">{icono}</span>
      <div>
        <h3 className="text-sm font-bold text-union-charcoal dark:text-slate-100">{titulo}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitulo}</p>
      </div>
    </div>
  )
}

export function BloqueTexto({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-union-red-700 dark:text-union-red-400">
        {icono}
        {titulo}
      </div>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>
    </div>
  )
}
