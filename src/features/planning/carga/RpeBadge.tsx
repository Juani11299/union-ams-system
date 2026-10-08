/**
 * Semáforo clínico de percepción del esfuerzo (Borg CR-10) para el RPE de la
 * última sesión: 1–3 leve/regenerativo · 4–6 moderado/óptimo · 7–8 duro/intenso ·
 * 9–10 muy duro/máximo. Con RPE 9–10 y además DOMS intenso o ACWR > 1,5 el badge
 * pulsa como advertencia.
 */
export interface NivelRpe {
  id: 'reposo' | 'leve' | 'moderado' | 'duro' | 'maximo'
  emoji: string
  etiqueta: string
  clases: string
  punto: string
}

export function nivelRpe(rpe: number): NivelRpe {
  if (rpe <= 0) return { id: 'reposo', emoji: '⚪', etiqueta: 'Reposo', clases: 'from-slate-100 to-slate-50 text-slate-600 ring-slate-200 dark:from-slate-800 dark:to-slate-800/60 dark:text-slate-300 dark:ring-slate-700', punto: 'bg-slate-400' }
  if (rpe <= 3) return { id: 'leve', emoji: '🟢', etiqueta: 'Esfuerzo Leve / Regenerativo', clases: 'from-emerald-100 to-emerald-50 text-emerald-800 ring-emerald-200 dark:from-emerald-500/20 dark:to-emerald-500/5 dark:text-emerald-300 dark:ring-emerald-500/30', punto: 'bg-emerald-500' }
  if (rpe <= 6) return { id: 'moderado', emoji: '🟡', etiqueta: 'Esfuerzo Moderado / Óptimo', clases: 'from-amber-100 to-amber-50 text-amber-800 ring-amber-200 dark:from-amber-500/20 dark:to-amber-500/5 dark:text-amber-300 dark:ring-amber-500/30', punto: 'bg-amber-500' }
  if (rpe <= 8) return { id: 'duro', emoji: '🟠', etiqueta: 'Esfuerzo Duro / Intenso', clases: 'from-orange-100 to-orange-50 text-orange-800 ring-orange-200 dark:from-orange-500/20 dark:to-orange-500/5 dark:text-orange-300 dark:ring-orange-500/30', punto: 'bg-orange-500' }
  return { id: 'maximo', emoji: '🔴', etiqueta: 'Esfuerzo Muy Duro / Máximo', clases: 'from-union-red-100 to-union-red-50 text-union-red-700 ring-union-red-400/50 dark:from-union-red-500/25 dark:to-union-red-500/5 dark:text-union-red-400 dark:ring-union-red-500/40', punto: 'bg-union-red-600' }
}

/** `compacto`: sin etiqueta de texto (para tablas densas); el significado queda en el tooltip y en el color. */
export function RpeBadge({ rpe, advertencia, compacto = false }: { rpe: number; advertencia?: string | null; compacto?: boolean }) {
  const n = nivelRpe(rpe)
  return (
    <span
      title={`${n.etiqueta} (Borg CR-10: ${rpe}/10)${advertencia ? ` — ⚠️ ${advertencia}` : ''}`}
      className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${n.clases} ${advertencia ? 'animate-pulse ring-2' : ''}`}
    >
      <span className="text-sm font-extrabold tabular-nums">{rpe}</span>
      {/* micro-indicador: posición en la escala CR-10 */}
      <span className="flex gap-px" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-2.5 w-0.5 rounded-sm ${i < rpe ? n.punto : 'bg-slate-300/60 dark:bg-slate-600/60'}`} />
        ))}
      </span>
      {compacto ? (
        <span>{n.emoji}</span>
      ) : (
        <>
          <span className="hidden whitespace-nowrap xl:inline">{n.emoji} {n.etiqueta}</span>
          <span className="xl:hidden">{n.emoji}</span>
        </>
      )}
      {advertencia && <span aria-hidden>⚠️</span>}
    </span>
  )
}
