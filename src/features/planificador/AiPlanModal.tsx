import { useState } from 'react'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { construirPayloadIA, generatePlanWithAI } from './aiPlanGenerator'
import type { GymSheetData } from '@/types'

interface AiPlanModalProps {
  categoryId: string
  categoriaNombre: string
  onGenerado: (data: GymSheetData) => void
  onClose: () => void
}

/**
 * Modal del Motor de Generación de Rutinas IA (Fase 17) — el profe escribe en
 * texto libre lo que necesita (ej. "Armame un plan para MD+1 compensatorio
 * enfocando en zona media parado y vector vertical"). `construirPayloadIA`
 * arma el contexto (categoría + system prompt metodológico + pedido) y
 * `generatePlanWithAI` (hoy mock, mañana la API real) devuelve una
 * `GymSheetData` lista para pisar el lienzo del editor.
 */
export function AiPlanModal({ categoryId, categoriaNombre, onGenerado, onClose }: AiPlanModalProps) {
  const showToast = useToastStore((s) => s.showToast)
  const [pedido, setPedido] = useState('')
  const [generando, setGenerando] = useState(false)

  async function handleGenerar() {
    if (!pedido.trim()) {
      showToast('error', 'Escribí qué querés que arme el plan antes de generar.')
      return
    }
    setGenerando(true)
    try {
      const payload = construirPayloadIA(categoryId, categoriaNombre, pedido)
      const data = await generatePlanWithAI(payload)
      onGenerado(data)
      showToast('success', '¡Plan generado! Revisalo y guardá los cambios.')
      onClose()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'El Cerebro SOMA no pudo generar el plan. Probá de nuevo.'))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !generando && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">🪄 Generar plan con IA</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={generando}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {categoriaNombre} — el plan va a respetar la metodología del club (LTAD, microciclo e isometría de
          Natera).
        </p>

        {generando ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-union-red-600 dark:border-slate-700" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              El Cerebro SOMA está planificando…
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              rows={4}
              autoFocus
              placeholder='Ej: "Armame un plan para MD+1 compensatorio enfocando en zona media parado y vector vertical"'
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-union-red-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerar}
                className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700"
              >
                🪄 Generar plan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
