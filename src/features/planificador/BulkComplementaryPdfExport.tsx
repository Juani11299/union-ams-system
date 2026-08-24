import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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
 *
 * `createPortal(..., document.body)` a propósito: este componente se monta
 * mientras `ComplementaryPlansPanel` (su modal, `position: fixed; inset: 0`)
 * sigue en el árbol. El truco global de `.print-area` (`src/index.css`) la
 * saca del flujo con `position: absolute`, y su "containing block" pasa a
 * ser el ancestro posicionado más cercano — que sin el portal sería ese
 * modal `fixed`. Un ancestro `position: fixed` está atado al viewport, y en
 * impresión el viewport es UNA hoja: todo lo que dependa de esa caja como
 * referencia se recorta a esa única página, aunque haya más `.print-area`
 * hijos con `break-after-page` pidiendo página nueva. Montar directo en
 * `<body>` (el "containing block" por defecto, sin `position`) evita ese
 * límite y deja que el documento crezca a tantas páginas como planes haya.
 */
export function BulkComplementaryPdfExport({
  plans,
  clubNombre,
  categoriaNombre,
  onClose,
}: BulkComplementaryPdfExportProps) {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = `
      @page { size: A4 landscape; margin: 10mm; }
      @media print {
        body, html, #root { height: auto !important; overflow: visible !important; }
      }
    `
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

  return createPortal(
    <div className="hidden print-area print:block">
      {plans.map((plan, i) => (
        <div key={plan.id} className={i < plans.length - 1 ? 'break-after-page' : ''}>
          <ComplementaryPlanCard plan={plan} clubNombre={clubNombre} categoriaNombre={categoriaNombre} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
