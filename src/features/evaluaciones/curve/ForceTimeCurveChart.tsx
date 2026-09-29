import { useState } from 'react'
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import { TipBox } from '@/features/nordbord/ui'
import type { HitoAuditoria, PuntoCurva, ResultadoAuditoria } from './tipos'

const COLOR_ESTADO: Record<HitoAuditoria['estado'], string> = { ok: '#10b981', fail: '#ef4444', na: '#94a3b8' }
const TXT_ESTADO: Record<HitoAuditoria['estado'], string> = { ok: 'Aceptable', fail: 'Violación de protocolo', na: 'No auditable con este archivo' }

const fmtT = (t: number): string => `${(t * 1000).toFixed(0)} ms`
const fmtF = (f: number, unidad: string): string => `${f.toFixed(unidad === 'N/kg' ? 2 : 0)} ${unidad}`

interface NodoProps {
  cx?: number
  cy?: number
  payload?: HitoAuditoria
}

/** Nodo circular verde/rojo/gris con reborde blanco (Paso 3 del pedido); toca o pasa el cursor para el detalle. */
function Nodo({ cx, cy, payload, onPick }: NodoProps & { onPick: (h: HitoAuditoria, x: number, y: number) => void }) {
  if (cx === undefined || cy === undefined || !payload) return null
  const color = COLOR_ESTADO[payload.estado]
  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onPick(payload, cx, cy)}
      onClick={(e) => {
        e.stopPropagation()
        onPick(payload, cx, cy)
      }}
    >
      <circle cx={cx} cy={cy} r={11} fill="transparent" />
      <circle cx={cx} cy={cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />
    </g>
  )
}

/** Curva Fuerza-Tiempo (Paso 3): fases sombreadas, Total/Izquierda/Derecha, línea de BW y nodos de auditoría con tooltip. */
export function ForceTimeCurveChart({ resultado }: { resultado: ResultadoAuditoria }) {
  const [activo, setActivo] = useState<{ h: HitoAuditoria; x: number; y: number } | null>(null)
  const { curva, fases, hitos, bilateral, unidadFuerza, refBW } = resultado

  if (curva.length === 0) return null

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setActivo(null)}>
      <div style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 18, right: 20, left: 4, bottom: 4 }} onClick={() => setActivo(null)}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t: number) => fmtT(t)} tick={{ fontSize: 10.5, fill: '#64748b' }} label={{ value: 'Tiempo', position: 'insideBottom', offset: -2, fontSize: 10.5, fill: '#94a3b8' }} />
            <YAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 10.5, fill: '#64748b' }} width={50} tickFormatter={(v: number) => v.toFixed(unidadFuerza === 'N/kg' ? 1 : 0)} label={{ value: unidadFuerza, angle: -90, position: 'insideLeft', fontSize: 10.5, fill: '#94a3b8' }} />
            {fases.map((f) => (
              <ReferenceArea key={f.id} x1={f.t0} x2={f.t1} fill={f.color} fillOpacity={0.55} stroke="none" ifOverflow="extendDomain" label={{ value: f.label, position: 'insideTop', fontSize: 9, fill: '#64748b', fontWeight: 600 }} />
            ))}
            {refBW !== null && <ReferenceLine y={refBW} stroke="#94a3b8" strokeDasharray="5 4" label={{ value: 'BW', position: 'right', fill: '#64748b', fontSize: 10.5, fontWeight: 700 }} />}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const p = payload[0]?.payload as PuntoCurva | undefined
                if (!p) return null
                const lines = [`Fuerza total: ${fmtF(p.total ?? 0, unidadFuerza)}`]
                if (bilateral) {
                  if (p.izq !== null) lines.push(`Pierna izquierda: ${fmtF(p.izq, unidadFuerza)}`)
                  if (p.der !== null) lines.push(`Pierna derecha: ${fmtF(p.der, unidadFuerza)}`)
                }
                return <TipBox title={fmtT(Number(label))} lines={lines} />
              }}
            />
            <Legend verticalAlign="top" align="right" iconType="line" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
            <Line data={curva} dataKey="total" name="Fuerza Total" stroke="#0f172a" strokeWidth={2.75} dot={false} isAnimationActive={false} />
            {bilateral && <Line data={curva} dataKey="izq" name="Pierna Izquierda" stroke="#2563eb" strokeWidth={1.75} dot={false} isAnimationActive={false} />}
            {bilateral && <Line data={curva} dataKey="der" name="Pierna Derecha" stroke="#f97316" strokeWidth={1.75} dot={false} isAnimationActive={false} />}
            <Scatter data={hitos} dataKey="f" isAnimationActive={false} shape={(p: NodoProps) => <Nodo {...p} onPick={(h, x, y) => setActivo({ h, x, y })} />} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {activo && (
        <div style={{ position: 'absolute', left: Math.min(Math.max(activo.x - 130, 4), 9999), top: Math.max(activo.y - 108, 0), zIndex: 5, pointerEvents: 'none' }}>
          <div style={{ display: 'inline-block', marginBottom: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 800, color: '#fff', background: COLOR_ESTADO[activo.h.estado] }}>
            {activo.h.estado === 'ok' ? '● ' : activo.h.estado === 'fail' ? '■ ' : '▲ '}
            {TXT_ESTADO[activo.h.estado]}
          </div>
          <TipBox
            title={activo.h.label}
            lines={[
              `Métrica: ${activo.h.metrica}`,
              `Real: ${activo.h.valorReal} — Esperado: ${activo.h.criterioEsperado}`,
              activo.h.detalle,
              activo.h.cita,
            ]}
          />
        </div>
      )}
    </div>
  )
}
