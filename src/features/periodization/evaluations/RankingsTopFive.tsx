import { Card } from '@/components/Card'
import type { ItemRanking, FilaComparativa } from './calculations'

function ListaRanking<T>({
  titulo,
  icono,
  items,
  render,
  vacioTexto,
}: {
  titulo: string
  icono: string
  items: T[]
  render: (item: T) => { nombre: string; valor: string; tono: 'verde' | 'rojo' | 'neutro' }
  vacioTexto: string
}) {
  const CLASE_TONO = {
    verde: 'text-emerald-600 dark:text-emerald-400',
    rojo: 'text-union-red-600 dark:text-union-red-400',
    neutro: 'text-slate-700 dark:text-slate-300',
  } as const

  return (
    <Card className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {icono} {titulo}
      </h3>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">{vacioTexto}</p>
      ) : (
        items.map((item, i) => {
          const { nombre, valor, tono } = render(item)
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">#{i + 1}</span>
                {nombre}
              </span>
              <span className={`font-semibold ${CLASE_TONO[tono]}`}>{valor}</span>
            </div>
          )
        })
      )}
    </Card>
  )
}

/**
 * Panel de 4 rankings Top 5 (Fase 38, pedidos textualmente): mejores/
 * peores valores relativos al peso corporal, y mayor mejora/desmejora en
 * % de evolución contra la evaluación anterior.
 */
export function RankingsTopFive({
  mejoresRelativos,
  peoresRelativos,
  mayorMejora,
  mayorDesmejora,
  hayColumnaPeso,
}: {
  mejoresRelativos: ItemRanking[]
  peoresRelativos: ItemRanking[]
  mayorMejora: FilaComparativa[]
  mayorDesmejora: FilaComparativa[]
  hayColumnaPeso: boolean
}) {
  const sinPesoTexto = hayColumnaPeso
    ? 'Sin datos de peso corporal para esta evaluación.'
    : 'El CSV no trajo una columna de peso corporal — no se puede relativizar.'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ListaRanking
        titulo="Mejores valores relativos (÷ peso corporal)"
        icono="🏆"
        items={mejoresRelativos}
        vacioTexto={sinPesoTexto}
        render={(item: ItemRanking) => ({ nombre: item.nombre, valor: item.valor.toFixed(3), tono: 'verde' })}
      />
      <ListaRanking
        titulo="Peores valores relativos (÷ peso corporal)"
        icono="⚠️"
        items={peoresRelativos}
        vacioTexto={sinPesoTexto}
        render={(item: ItemRanking) => ({ nombre: item.nombre, valor: item.valor.toFixed(3), tono: 'rojo' })}
      />
      <ListaRanking
        titulo="Mayor % de mejora"
        icono="📈"
        items={mayorMejora}
        vacioTexto="Hace falta una evaluación anterior del mismo tipo para calcular evolución."
        render={(item: FilaComparativa) => {
          const v = item.variacionPct ?? 0
          return { nombre: item.nombre, valor: `${v > 0 ? '+' : ''}${v.toFixed(1)}%`, tono: v >= 0 ? 'verde' : 'rojo' }
        }}
      />
      <ListaRanking
        titulo="Mayor % de desmejora (alarmas)"
        icono="🚨"
        items={mayorDesmejora}
        vacioTexto="Hace falta una evaluación anterior del mismo tipo para calcular evolución."
        render={(item: FilaComparativa) => {
          const v = item.variacionPct ?? 0
          return { nombre: item.nombre, valor: `${v > 0 ? '+' : ''}${v.toFixed(1)}%`, tono: v < 0 ? 'rojo' : 'verde' }
        }}
      />
    </div>
  )
}
