import { useMemo, useState } from 'react'
import { Card } from '@/components/Card'

/**
 * Torre de Control de Temporada (Fase 33, ver
 * docs/Propuesta_Integracion_NSCA.md sección 2) — visualización Volumen vs.
 * Intensidad a lo largo de un macrociclo, en SVG nativo (sin librería de
 * gráficos, a pedido). Datos editables a mano por ahora: este módulo todavía
 * no está conectado a un store — es el panel de coordinación visual que
 * pide la auditoría, no una fuente de verdad de carga real (esa sigue
 * siendo `calcularCargaInterna`/Tonelaje en `workload/calculations.ts`).
 */
interface SemanaMesociclo {
  semana: number
  fase: string
  volumen: number // Volume Load relativo (0-100)
  intensidad: number // %1RM promedio del período
}

const MESOCICLO_DEMO: SemanaMesociclo[] = [
  { semana: 1, fase: 'Preparatorio Gral.', volumen: 60, intensidad: 55 },
  { semana: 2, fase: 'Preparatorio Gral.', volumen: 75, intensidad: 60 },
  { semana: 3, fase: 'Preparatorio Gral.', volumen: 90, intensidad: 65 },
  { semana: 4, fase: 'Descarga', volumen: 40, intensidad: 55 },
  { semana: 5, fase: 'Preparatorio Esp.', volumen: 70, intensidad: 75 },
  { semana: 6, fase: 'Preparatorio Esp.', volumen: 80, intensidad: 80 },
  { semana: 7, fase: 'Preparatorio Esp.', volumen: 85, intensidad: 85 },
  { semana: 8, fase: 'Descarga', volumen: 45, intensidad: 65 },
  { semana: 9, fase: 'Competitivo', volumen: 55, intensidad: 90 },
  { semana: 10, fase: 'Competitivo', volumen: 50, intensidad: 92 },
  { semana: 11, fase: 'Competitivo', volumen: 45, intensidad: 93 },
  { semana: 12, fase: 'Competitivo (pico)', volumen: 30, intensidad: 90 },
]

const ANCHO = 760
const ALTO = 260
const PADDING = { top: 16, right: 16, bottom: 36, left: 16 }
const ALTO_UTIL = ALTO - PADDING.top - PADDING.bottom

function puntosPoligono(datos: SemanaMesociclo[], campo: 'volumen' | 'intensidad'): string {
  const anchoUtil = ANCHO - PADDING.left - PADDING.right
  const paso = anchoUtil / (datos.length - 1)
  return datos
    .map((d, i) => {
      const x = PADDING.left + i * paso
      const y = PADDING.top + ALTO_UTIL - (d[campo] / 100) * ALTO_UTIL
      return `${x},${y}`
    })
    .join(' ')
}

export function MacrocycleView() {
  const [datos, setDatos] = useState<SemanaMesociclo[]>(MESOCICLO_DEMO)

  const puntosVolumen = useMemo(() => puntosPoligono(datos, 'volumen'), [datos])
  const puntosIntensidad = useMemo(() => puntosPoligono(datos, 'intensidad'), [datos])
  const anchoUtil = ANCHO - PADDING.left - PADDING.right
  const paso = anchoUtil / (datos.length - 1)

  function actualizarSemana(idx: number, campo: 'volumen' | 'intensidad', valor: number) {
    setDatos((prev) => prev.map((d, i) => (i === idx ? { ...d, [campo]: Math.max(0, Math.min(100, valor)) } : d)))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">TORRE DE CONTROL DE TEMPORADA</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Volumen vs. Intensidad a lo largo del macrociclo — jerarquía de periodización, Cap. 21 NSCA (Haff).
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-sky-500" /> Volumen (Volume Load relativo)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-union-red-600" /> Intensidad (%1RM promedio)
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="min-w-[640px]" role="img" aria-label="Volumen vs. Intensidad por semana del macrociclo">
            {[0, 25, 50, 75, 100].map((marca) => {
              const y = PADDING.top + ALTO_UTIL - (marca / 100) * ALTO_UTIL
              return (
                <g key={marca}>
                  <line
                    x1={PADDING.left}
                    x2={ANCHO - PADDING.right}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <text x={2} y={y + 3} fontSize={9} className="fill-slate-400">
                    {marca}
                  </text>
                </g>
              )
            })}

            {datos.map((d, i) => {
              const x = PADDING.left + i * paso
              return (
                <text
                  key={d.semana}
                  x={x}
                  y={ALTO - 8}
                  fontSize={9}
                  textAnchor="middle"
                  className="fill-slate-400"
                >
                  S{d.semana}
                </text>
              )
            })}

            <polyline points={puntosVolumen} fill="none" strokeWidth={2.5} className="stroke-sky-500" />
            <polyline points={puntosIntensidad} fill="none" strokeWidth={2.5} className="stroke-union-red-600" />

            {datos.map((d, i) => {
              const x = PADDING.left + i * paso
              const yVol = PADDING.top + ALTO_UTIL - (d.volumen / 100) * ALTO_UTIL
              const yInt = PADDING.top + ALTO_UTIL - (d.intensidad / 100) * ALTO_UTIL
              return (
                <g key={d.semana}>
                  <circle cx={x} cy={yVol} r={3} className="fill-sky-500" />
                  <circle cx={x} cy={yInt} r={3} className="fill-union-red-600" />
                </g>
              )
            })}
          </svg>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Editar mesociclo</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                <th className="py-2 pr-3 font-medium">Semana</th>
                <th className="py-2 pr-3 font-medium">Fase</th>
                <th className="py-2 pr-3 font-medium">Volumen</th>
                <th className="py-2 pr-3 font-medium">Intensidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {datos.map((d, idx) => (
                <tr key={d.semana}>
                  <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300">S{d.semana}</td>
                  <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300">{d.fase}</td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={d.volumen}
                      onChange={(e) => actualizarSemana(idx, 'volumen', Number(e.target.value))}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={d.intensidad}
                      onChange={(e) => actualizarSemana(idx, 'intensidad', Number(e.target.value))}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
