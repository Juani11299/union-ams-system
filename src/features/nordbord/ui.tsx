import type { ReactNode } from 'react'
import { ASYM_A, ASYM_R, C, LVL_ICO, LVL_TXT } from './constants'
import { asymColor, fmt } from './format'
import type { Lvl, MetricDef } from './types'

/** Formato "valor + unidad" de una métrica. */
export const fmtM = (v: number | null | undefined, m: { d: number; u: string }): string =>
  fmt(v, m.d) + (m.u === '%' ? ' %' : ` ${m.u}`)

export { ASYM_A, ASYM_R }

export function Pill({ lvl, children }: { lvl: Lvl | 'n'; children: ReactNode }) {
  return <span className={`pill ${lvl}`}>{children}</span>
}

export function LvlPill({ lvl }: { lvl: Lvl }) {
  return (
    <Pill lvl={lvl}>
      {LVL_ICO[lvl]} {LVL_TXT[lvl]}
    </Pill>
  )
}

/** Caja de tooltip oscura, igual a la del HTML original. */
export function TipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div style={{ background: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5, maxWidth: 320 }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{title}</div>
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  )
}

export function Svg({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      {children}
    </svg>
  )
}

export const ICON = {
  users: (
    <Svg>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </Svg>
  ),
  avg: (
    <Svg>
      <path d="M3 12h18M3 6h18M3 18h12" />
    </Svg>
  ),
  top: (
    <Svg>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3" />
    </Svg>
  ),
  cv: (
    <Svg>
      <path d="M3 20l5-8 4 4 5-9 4 6" />
    </Svg>
  ),
  flag: (
    <Svg>
      <path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5" />
    </Svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 12, height: 12 }}>
      <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6z" />
    </svg>
  ),
}

export function Crest({ style }: { style?: React.CSSProperties }) {
  return (
    <svg className="crest" viewBox="0 0 46 52" style={style} aria-hidden="true">
      <path d="M23 1 L44 7 V26 C44 39 34 47 23 51 C12 47 2 39 2 26 V7 Z" fill="#d7182a" stroke="#fff" strokeWidth="1.5" />
      <path d="M23 5 L40 10 V26 C40 36 32 43 23 47 Z" fill="#fff" />
      <text x="23" y="33" textAnchor="middle" fontFamily="Inter,Arial" fontWeight="800" fontSize="19" fill="#0b0f19" stroke="#fff" strokeWidth=".5">
        U
      </text>
    </svg>
  )
}

export { asymColor, C }
export type { MetricDef }
