import { useEffect } from 'react'
import { ComplementaryPlanCard } from './ComplementaryPlanPdfExport'
import type { ComplementaryPlan } from '@/types'

interface BulkComplementaryPdfExportProps {
  plans: ComplementaryPlan[]
  clubNombre: string
  categoriaNombre: string
  onClose: () => void
}

/**
 * "Cartilla Completa" — todos los Planes Complementarios de una categoría en
 * un solo PDF, un plan por hoja (`break-after-page`, mismo criterio que
 * `DetailedWeeklyPdfExport`). Reusa `ComplementaryPlanCard` (el mismo
 * contenido que imprime `ComplementaryPlanPdfExport` para un plan suelto)
 * así la Cartilla no puede desincronizarse de la tarjeta individual.
 */
export function BulkComplementaryPdfExport({
  plans,
  clubNombre,
  categoriaNombre,
  onClose,
}: BulkComplementaryPdfExportProps) {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = '@page { size: A4 landscape; margin: 10mm; }'
    document.head.appendChild(styleEl)

    function handleAfterPrint() {
      onClose()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    window.print()

    return () => {
      styleEl.remove()
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onClose])

  return (
    <div className="hidden print-area print:block">
      {plans.map((plan, i) => (
        <div key={plan.id} className={i < plans.length - 1 ? 'break-after-page' : ''}>
          <ComplementaryPlanCard plan={plan} clubNombre={clubNombre} categoriaNombre={categoriaNombre} />
        </div>
      ))}
    </div>
  )
}
