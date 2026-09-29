import type { HitoAuditoria, ResultadoAuditoria } from './tipos'

const ICONO: Record<HitoAuditoria['estado'], string> = { ok: '✓', fail: '✗', na: '•' }
const COLOR: Record<HitoAuditoria['estado'], string> = { ok: '#10b981', fail: '#ef4444', na: '#94a3b8' }

/** Panel de auditoría (Paso 4): badge de validez, checklist técnico fase por fase y sustento bibliográfico. */
export function TestProtocolInsightPanel({ resultado }: { resultado: ResultadoAuditoria }) {
  const { valida, hitos, notaMetodologica, citas } = resultado

  const badge = valida === null
    ? { bg: '#f1f5f9', tx: '#475569', bd: '#e2e8f0', txt: '● SIN DATOS SUFICIENTES PARA UN VEREDICTO' }
    : valida
      ? { bg: '#ecfdf5', tx: '#047857', bd: '#a7f3d0', txt: '🟢 TEST VÁLIDO' }
      : { bg: '#fef2f2', tx: '#b91c1c', bd: '#fecaca', txt: '🔴 TEST CON COMPENSACIONES / NO VÁLIDO' }

  return (
    <div className="card">
      <h3>Auditoría de Protocolo</h3>
      <p className="hint">{notaMetodologica}</p>

      <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, letterSpacing: 0.2, background: badge.bg, color: badge.tx, border: `1px solid ${badge.bd}`, marginBottom: 14 }}>
        {badge.txt}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hitos.map((h) => (
          <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#fff', background: COLOR[h.estado] }}>{ICONO[h.estado]}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                {h.fase} — {h.label}
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>{h.detalle}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Real: <b style={{ color: '#334155' }}>{h.valorReal}</b> · Esperado: {h.criterioEsperado}
              </div>
            </div>
          </div>
        ))}
      </div>

      {citas.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748b', marginBottom: 6 }}>Sustento bibliográfico</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {citas.map((c) => (
              <li key={c} style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
