import { useMemo, useState } from 'react'
import { fdate } from '@/features/nordbord/calculations'
import type { DatasetU, RegistroU } from '../universal/tipos'
import { auditarRegistro } from './curveProtocolAuditor'
import { ForceTimeCurveChart } from './ForceTimeCurveChart'
import { TestProtocolInsightPanel } from './TestProtocolInsightPanel'

interface Props {
  ds: DatasetU
  registro: RegistroU
  onClose: () => void
}

/**
 * Modal de curva Fuerza-Tiempo (Fase 48): abre desde la ficha del atleta con la
 * evaluación seleccionada, pero permite recorrer cualquier fecha de ese mismo
 * test que tenga el jugador. Se monta fuera de `.nb-root` así que reusa sus
 * mismas clases (`card`, `hint`, `pill`) pegándose al mismo lenguaje visual.
 */
export function CurveAnalysisModal({ ds, registro, onClose }: Props) {
  const [fechaSel, setFechaSel] = useState(registro.iso)
  const opciones = registro.ath.tests
  const actual = opciones.find((t) => t.iso === fechaSel) ?? registro
  const resultado = useMemo(() => auditarRegistro(actual, ds), [actual, ds])

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="nb-root my-8 w-full max-w-5xl rounded-2xl p-5 shadow-2xl" style={{ background: 'var(--card, #fff)' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              🔬 Curva Fuerza-Tiempo — {registro.ath.nombre}
            </h2>
            <p className="hint" style={{ margin: '2px 0 0' }}>
              {ds.config.nombre} · {fdate(actual.fecha)}
              {resultado.testKind === 'generico' || resultado.testKind === 'imtp' ? '' : ` · auditoría contra protocolo científico estandarizado`}
            </p>
          </div>
          <div className="no-print flex items-center gap-2">
            {opciones.length > 1 && (
              <select value={fechaSel} onChange={(e) => setFechaSel(e.target.value)} style={{ padding: '6px 10px' }}>
                {opciones.map((t) => (
                  <option key={t.iso} value={t.iso}>{fdate(t.fecha)}</option>
                ))}
              </select>
            )}
            <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar" style={{ fontSize: 18, lineHeight: 1 }}>
              ✕
            </button>
          </div>
        </div>

        {resultado.curva.length === 0 ? (
          <div className="card empty">{resultado.notaMetodologica}</div>
        ) : (
          <div className="grid g-32" style={{ alignItems: 'start' }}>
            <div className="card">
              <h3>Curva Fuerza-Tiempo (reconstruida)</h3>
              <p className="hint">Tocá o pasá el cursor sobre un nodo para ver el criterio biomecánico y la métrica real.</p>
              <ForceTimeCurveChart resultado={resultado} />
            </div>
            <TestProtocolInsightPanel resultado={resultado} />
          </div>
        )}
      </div>
    </div>
  )
}
