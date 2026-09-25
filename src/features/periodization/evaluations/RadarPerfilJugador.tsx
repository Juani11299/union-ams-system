import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/Card'
import type { EjeRadar } from './calculations'

const UNION_ROJO = '#ed1c24'

/**
 * Radar del jugador + Score Global (Fase 38) — un eje por cada métrica que
 * el jugador tiene registrada, normalizada 0-100 (ver `calcularRadarJugador`
 * en `calculations.ts`: interpolación Min-Max contra el histórico de la
 * categoría, para poder graficar cm de salto y kg de fuerza en el mismo
 * polígono). El Score es el promedio de esos ejes normalizados.
 */
export function RadarPerfilJugador({ radar, scoreGlobal }: { radar: EjeRadar[]; scoreGlobal: number }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">🕸️ Perfil del Atleta</h3>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Score Global</span>
          <span className="text-2xl font-black text-union-red-600 dark:text-union-red-400">{scoreGlobal}</span>
        </div>
      </div>

      {radar.length < 3 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          Hacen falta al menos 3 métricas distintas con datos históricos de la categoría para dibujar un radar.
        </p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metrica" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Tooltip
                formatter={(_value, _name, item) => {
                  const punto = item?.payload as EjeRadar | undefined
                  return [punto ? `${punto.valorReal} (${punto.valorNormalizado}/100)` : '—', 'Valor']
                }}
              />
              <Radar name="Perfil" dataKey="valorNormalizado" stroke={UNION_ROJO} fill={UNION_ROJO} fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
