import { useMemo, useState } from 'react'
import { CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import type { AtletaModelo, MetricaDef, ModeloPerfil } from './datos'

const COLOR = { ambos: '#10b981', ninguno: '#ef4444', mixto: '#f59e0b' }

const etiqueta = (d: MetricaDef) => `${d.fuenteLabel} · ${d.label}${d.unidad ? ` [${d.unidad}]` : ''}${d.masEsMejor ? '' : ' ↓ mejor'}`
const num = (v: number, d: number) => v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })
const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length
const mediana = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Vista Grupal del Perfil 360°: dispersión con cuadrantes que cruza dos
 * métricas de pruebas DISTINTAS (ej. X = fuerza excéntrica NordBord, Y = altura
 * CMJ). Las líneas de corte son la media o mediana del grupo filtrado y el
 * color respeta el sentido de cada métrica (en las de "menos es mejor" lo bueno
 * es estar por debajo de la línea).
 */
export function CuadranteGrupal({ modelo, atletas, onAbrir }: { modelo: ModeloPerfil; atletas: AtletaModelo[]; onAbrir: (key: string) => void }) {
  const cat = modelo.catalogo
  const defX = cat.find((d) => d.rol === 'nb_fuerza') ?? cat[0]
  const defY = cat.find((d) => d.rol === 'salto') ?? cat.find((d) => d.id !== defX?.id && d.fuente !== defX?.fuente) ?? cat[1] ?? cat[0]
  const [xId, setXId] = useState(defX?.id ?? '')
  const [yId, setYId] = useState(defY?.id ?? '')
  const [corte, setCorte] = useState<'media' | 'mediana'>('media')

  const dx = cat.find((d) => d.id === xId) ?? defX
  const dy = cat.find((d) => d.id === yId) ?? defY

  const datos = useMemo(() => {
    if (!dx || !dy) return null
    const pts = atletas.filter((a) => a.valores[dx.id] !== undefined && a.valores[dy.id] !== undefined).map((a) => ({ x: a.valores[dx.id], y: a.valores[dy.id], a }))
    if (pts.length < 2) return { pts, refX: NaN, refY: NaN }
    const f = corte === 'media' ? media : mediana
    return { pts, refX: f(pts.map((p) => p.x)), refY: f(pts.map((p) => p.y)) }
  }, [atletas, dx, dy, corte])

  if (!dx || !dy) return <Card className="py-12 text-center text-sm text-slate-500">Se necesitan al menos dos métricas para armar los cuadrantes.</Card>

  const buenoX = (x: number) => (datos ? (dx.masEsMejor ? x >= datos.refX : x <= datos.refX) : false)
  const buenoY = (y: number) => (datos ? (dy.masEsMejor ? y >= datos.refY : y <= datos.refY) : false)
  const clasif = (p: { x: number; y: number }) => {
    const bx = buenoX(p.x)
    const by = buenoY(p.y)
    return bx && by ? 'ambos' : !bx && !by ? 'ninguno' : bx ? 'soloX' : 'soloY'
  }
  const colorDe = (p: { x: number; y: number }) => {
    const c = clasif(p)
    return c === 'ambos' ? COLOR.ambos : c === 'ninguno' ? COLOR.ninguno : COLOR.mixto
  }

  const grupos = {
    ambos: datos?.pts.filter((p) => clasif(p) === 'ambos') ?? [],
    soloX: datos?.pts.filter((p) => clasif(p) === 'soloX') ?? [],
    soloY: datos?.pts.filter((p) => clasif(p) === 'soloY') ?? [],
    ninguno: datos?.pts.filter((p) => clasif(p) === 'ninguno') ?? [],
  }
  const nombreEje = (d: MetricaDef) => d.label

  const selMetrica = (valor: string, set: (v: string) => void, titulo: string) => (
    <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs">
      <span className="font-medium text-slate-600 dark:text-slate-300">{titulo}</span>
      <select className={inputClass} value={valor} onChange={(e) => set(e.target.value)}>
        {[...new Set(cat.map((d) => d.fuenteLabel))].map((f) => (
          <optgroup key={f} label={f}>
            {cat.filter((d) => d.fuenteLabel === f).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
                {d.unidad ? ` [${d.unidad}]` : ''}
                {d.masEsMejor ? '' : ' ↓ mejor'}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )

  const cuadrante = (titulo: string, color: string, lista: typeof grupos.ambos, desc: string) => (
    <Card key={titulo} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          {titulo} · {lista.length}
        </h4>
      </div>
      <p className="text-[11px] text-slate-400">{desc}</p>
      <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
        {lista.map((p) => (
          <button key={p.a.key} type="button" onClick={() => onAbrir(p.a.key)} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-union-red-50 hover:text-union-red-700 dark:bg-slate-800 dark:text-slate-300">
            {p.a.nombre}
          </button>
        ))}
        {lista.length === 0 && <span className="text-[11px] text-slate-400">—</span>}
      </div>
    </Card>
  )

  const { refX, refY } = datos ?? { refX: NaN, refY: NaN }
  // Ejes con 6 % de aire para que los puntos no se peguen al borde y las áreas de cuadrante tengan límites explícitos.
  const lim = (() => {
    const xs = datos?.pts.map((p) => p.x) ?? [0, 1]
    const ys = datos?.pts.map((p) => p.y) ?? [0, 1]
    const ext = (v: number[]): [number, number] => {
      const mn = Math.min(...v)
      const mx = Math.max(...v)
      const pad = (mx - mn || Math.abs(mx) || 1) * 0.06
      return [mn - pad, mx + pad]
    }
    const [xMin, xMax] = ext(xs)
    const [yMin, yMax] = ext(ys)
    return { xMin, xMax, yMin, yMax }
  })()
  const hayRef = datos !== null && Number.isFinite(refX) && Number.isFinite(refY)

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-end gap-3">
        {selMetrica(xId || dx.id, setXId, 'Eje X')}
        {selMetrica(yId || dy.id, setYId, 'Eje Y')}
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Líneas de corte</span>
          <select className={inputClass} value={corte} onChange={(e) => setCorte(e.target.value as 'media' | 'mediana')}>
            <option value="media">Media del grupo</option>
            <option value="mediana">Mediana del grupo</option>
          </select>
        </label>
      </Card>

      {!datos || datos.pts.length < 2 ? (
        <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Hay {datos?.pts.length ?? 0} atleta(s) con ambas métricas. Elegí dos pruebas que compartan jugadores (el cruce es por nombre) para ver los cuadrantes.
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {etiqueta(dx)} <span className="text-slate-400">vs.</span> {etiqueta(dy)}
              </h3>
              <p className="text-[11px] text-slate-400">
                {datos.pts.length} atletas con ambas pruebas. Verde: bueno en las dos · Rojo: débil en las dos · Ámbar: bueno en una sola. Click en un punto para abrir su perfil.
              </p>
            </div>
            <div className="h-[520px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 24, left: 8, bottom: 28 }}>
                  <CartesianGrid stroke="#e2e8f0" />
                  {hayRef && (
                    <>
                      {/* verde = cuadrante favorable en las dos métricas · rojo = desfavorable en las dos */}
                      <ReferenceArea x1={dx.masEsMejor ? refX : lim.xMin} x2={dx.masEsMejor ? lim.xMax : refX} y1={dy.masEsMejor ? refY : lim.yMin} y2={dy.masEsMejor ? lim.yMax : refY} fill="rgba(16,185,129,.09)" stroke="none" />
                      <ReferenceArea x1={dx.masEsMejor ? lim.xMin : refX} x2={dx.masEsMejor ? refX : lim.xMax} y1={dy.masEsMejor ? lim.yMin : refY} y2={dy.masEsMejor ? refY : lim.yMax} fill="rgba(239,68,68,.09)" stroke="none" />
                      <ReferenceLine x={refX} stroke="#475569" strokeDasharray="5 4" label={{ value: `${corte === 'media' ? 'Media' : 'Mediana'} ${num(refX, dx.d)}`, position: 'insideTopRight', fill: '#475569', fontSize: 10.5, fontWeight: 700 }} />
                      <ReferenceLine y={refY} stroke="#475569" strokeDasharray="5 4" label={{ value: `${corte === 'media' ? 'Media' : 'Mediana'} ${num(refY, dy.d)}`, position: 'insideBottomRight', fill: '#475569', fontSize: 10.5, fontWeight: 700 }} />
                    </>
                  )}
                  <XAxis type="number" dataKey="x" domain={[lim.xMin, lim.xMax]} allowDataOverflow tickCount={7} tickFormatter={(v: number) => num(v, dx.d)} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: `${dx.fuenteLabel} · ${nombreEje(dx)}${dx.unidad ? ` (${dx.unidad})` : ''}`, position: 'insideBottom', offset: -16, fill: '#475569', fontSize: 11.5 }} />
                  <YAxis type="number" dataKey="y" domain={[lim.yMin, lim.yMax]} allowDataOverflow tickCount={7} tickFormatter={(v: number) => num(v, dy.d)} tick={{ fontSize: 11, fill: '#475569' }} width={60} label={{ value: `${dy.fuenteLabel} · ${nombreEje(dy)}${dy.unidad ? ` (${dy.unidad})` : ''}`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11.5 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload as { x: number; y: number; a: AtletaModelo }
                      return (
                        <div style={{ background: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5 }}>
                          <div style={{ color: '#fff', fontWeight: 700 }}>
                            {p.a.nombre} · {p.a.categoria}
                          </div>
                          <div>
                            {dx.label}: {num(p.x, dx.d)} {dx.unidad}
                          </div>
                          <div>
                            {dy.label}: {num(p.y, dy.d)} {dy.unidad}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={datos.pts} isAnimationActive={false} cursor="pointer" onClick={(_d, i) => onAbrir(datos.pts[i].a.key)}>
                    {datos.pts.map((p) => (
                      <Cell key={p.a.key} fill={colorDe(p)} stroke="#fff" strokeWidth={1.5} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cuadrante('Bueno en ambas', COLOR.ambos, grupos.ambos, `${dx.label} y ${dy.label} en el lado favorable.`)}
            {cuadrante(`Sólo ${dx.label}`, COLOR.mixto, grupos.soloX, `Favorable en ${dx.label}, por debajo en ${dy.label}.`)}
            {cuadrante(`Sólo ${dy.label}`, COLOR.mixto, grupos.soloY, `Favorable en ${dy.label}, por debajo en ${dx.label}.`)}
            {cuadrante('Débil en ambas', COLOR.ninguno, grupos.ninguno, 'Prioridad de intervención: ambas pruebas en el lado desfavorable.')}
          </div>
        </>
      )}
    </div>
  )
}
