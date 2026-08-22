import { useState } from 'react'
import { generarSesionPorVector, VECTORES_OPCIONES, type VectorObjetivo } from './waveMethodologyEngine'
import type { GymSheetData } from '@/types'

interface WaveMethodologyModalProps {
  tituloSesion: string
  /** `true` si la planilla ya tiene algún ejercicio cargado — dispara el aviso de reemplazo. */
  tieneContenidoPrevio: boolean
  onGenerado: (data: GymSheetData) => void
  onClose: () => void
}

/**
 * Modal del Generador Metodológico por Olas y Vectores (Fase 37, Paso 1) —
 * el profe elige el vector de movimiento dominante de la sesión y el motor
 * (`waveMethodologyEngine.ts`) arma los 3 bloques completos. "Construir
 * Matriz" reemplaza por completo la planilla actual del editor — el aviso
 * de abajo es el "reemplazo seguro" pedido en el Paso 3 (nunca se sobrescribe
 * en silencio si ya había ejercicios cargados a mano).
 */
export function WaveMethodologyModal({
  tituloSesion,
  tieneContenidoPrevio,
  onGenerado,
  onClose,
}: WaveMethodologyModalProps) {
  const [vector, setVector] = useState<VectorObjetivo>('vertical')

  function handleConstruir() {
    onGenerado(generarSesionPorVector(vector, tituloSesion))
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6 print:hidden">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          🌊 Generador Metodológico por Olas y Vectores
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Arma una sesión de 3 bloques biomecánicamente coherentes — Fuerza Velocidad (Neural) → Fuerza Máxima
          (Estructural) → Auxiliares/Vitamina — según el vector de movimiento dominante.
        </p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Vector Objetivo de la Sesión</span>
          <select
            value={vector}
            onChange={(e) => setVector(e.target.value as VectorObjetivo)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {VECTORES_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {tieneContenidoPrevio && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            ⚠️ Esta planilla ya tiene ejercicios cargados. "Construir Matriz" los reemplaza por completo — no se
            fusionan. Guardá o copiá la planilla actual antes si querés conservarla.
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConstruir}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-violet-700"
          >
            Construir Matriz
          </button>
        </div>
      </div>
    </div>
  )
}
