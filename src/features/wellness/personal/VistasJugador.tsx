import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts'
import { Card } from '@/components/Card'
import { cargarMiPerfil, type ResultadoPerfil } from './api'
import { construirTarjetas, resumirComposicion, type TonoFeedback } from './feedback'

export type VistaJugador = 'carga' | 'evaluaciones' | 'composicion'

const TONO: Record<TonoFeedback, { caja: string; titulo: string; barra: string }> = {
  verde: { caja: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10', titulo: 'text-emerald-800 dark:text-emerald-300', barra: '#10b981' },
  amarillo: { caja: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10', titulo: 'text-amber-800 dark:text-amber-300', barra: '#f59e0b' },
  rojo: { caja: 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10', titulo: 'text-rose-800 dark:text-rose-300', barra: '#ef4444' },
  gris: { caja: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60', titulo: 'text-slate-700 dark:text-slate-200', barra: '#64748b' },
}

const fmt = (v: number | null, d = 1) => (v === null ? '—' : v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }))
const fechaCorta = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`
const signo = (v: number, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmt(Math.abs(v), d)}`

/** Barra de navegación inferior (mobile-first) del link del jugador: Carga diaria · Mis evaluaciones · Mi composición. */
export function BarraNavegacionJugador({ vista, onVista }: { vista: VistaJugador; onVista: (v: VistaJugador) => void }) {
  const items: Array<{ id: VistaJugador; icono: string; label: string }> = [
    { id: 'carga', icono: '📝', label: 'Carga diaria' },
    { id: 'evaluaciones', icono: '⚡', label: 'Mis evaluaciones' },
    { id: 'composicion', icono: '📏', label: 'Mi composición' },
  ]
  return (
    <>
      <div className="h-20" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-md">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onVista(i.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-semibold transition-colors ${vista === i.id ? 'text-union-red-600 dark:text-union-red-400' : 'text-slate-500 dark:text-slate-400'}`}
              aria-current={vista === i.id ? 'page' : undefined}
            >
              <span className="text-xl" aria-hidden>{i.icono}</span>
              {i.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}

function Bloqueado() {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-4xl" aria-hidden>🔒</span>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Esta sección es personal</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tus evaluaciones y tu composición corporal sólo se ven desde tu <b>link personal</b> (el que te pasa tu profe con tu nombre). Si entraste con el link del grupo, pedíselo.
      </p>
    </Card>
  )
}

/** Carga el perfil una sola vez por jugador (las dos pestañas personales comparten el resultado). */
function usePerfil(athleteId: string, token: string | null) {
  const [res, setRes] = useState<ResultadoPerfil | null>(null)
  useEffect(() => {
    let vivo = true
    if (!token) return
    cargarMiPerfil(athleteId, token).then((r) => vivo && setRes(r))
    return () => {
      vivo = false
    }
  }, [athleteId, token])
  return token ? res : ({ estado: 'link-invalido' } as ResultadoPerfil)
}

function Estado({ res, children }: { res: ResultadoPerfil | null; children: (p: Extract<ResultadoPerfil, { estado: 'ok' }>['perfil']) => React.ReactNode }) {
  if (!res) return <Card className="py-12 text-center text-sm text-slate-400">Cargando tus datos…</Card>
  if (res.estado === 'link-invalido') return <Bloqueado />
  if (res.estado === 'error') return <Card className="py-10 text-center text-sm text-rose-600 dark:text-rose-400">⚠️ {res.mensaje}</Card>
  return <>{children(res.perfil)}</>
}

export function MisEvaluaciones({ athleteId, token }: { athleteId: string; token: string | null }) {
  const res = usePerfil(athleteId, token)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">⚡ Mis evaluaciones</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Tus últimos tests de rendimiento y cómo vas evolucionando.</p>
      </div>
      <Estado res={res}>{(perfil) => <ListaTarjetas perfil={perfil} />}</Estado>
    </div>
  )
}

function ListaTarjetas({ perfil }: { perfil: Extract<ResultadoPerfil, { estado: 'ok' }>['perfil'] }) {
  const tarjetas = useMemo(() => {
    const ult = [...perfil.antropometrias].sort((a, b) => b.fecha.localeCompare(a.fecha)).find((a) => a.peso !== null)
    const peso = ult && Number.isFinite(Number(ult.peso)) ? Number(ult.peso) : null
    return construirTarjetas(perfil.evaluaciones, perfil.legacy, peso)
  }, [perfil])
  if (tarjetas.length === 0) return <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Todavía no tenés evaluaciones cargadas. Cuando te hagan un test, aparece acá.</Card>
  return (
    <>
      {tarjetas.map((t) => {
        const c = TONO[t.tono]
        return (
          <Card key={t.test} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.test}</p>
                <p className="text-[11px] text-slate-400">Último test: {t.fecha.split('-').reverse().join('/')}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {fmt(t.principal.valor, t.principal.unidad === 'N' ? 0 : t.principal.unidad === 'cm' ? 1 : 2)}
                  <span className="ml-1 text-sm font-semibold text-slate-400">{t.principal.unidad}</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.principal.label}</p>
                {t.principal.deltaVsPrevia !== null && <p className={`text-[11px] font-semibold ${t.principal.deltaVsPrevia >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{signo(t.principal.deltaVsPrevia, t.principal.unidad === 'N' ? 0 : 1)} {t.principal.unidad} vs. tu test anterior</p>}
              </div>
            </div>
            <div className={`rounded-xl border p-3 ${c.caja}`}>
              <p className={`text-sm font-bold ${c.titulo}`}>{t.titulo}</p>
              <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{t.mensaje}</p>
            </div>
            {t.secundarios.length > 0 && (
              <dl className="grid grid-cols-2 gap-2 text-xs">
                {t.secundarios.map((s) => (
                  <div key={s.label} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-slate-500 dark:text-slate-400">{s.label}</dt>
                    <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.valor}</dd>
                  </div>
                ))}
              </dl>
            )}
            {t.serie.length > 1 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tu evolución</p>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={t.serie.map((x) => ({ f: fechaCorta(x.fecha), v: x.valor }))} margin={{ top: 14, right: 4, left: 4, bottom: 0 }}>
                      <XAxis dataKey="f" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 'dataMax']} />
                      <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                        {t.serie.map((x, i) => <Cell key={x.fecha} fill={i === t.serie.length - 1 ? c.barra : '#cbd5e1'} />)}
                        <LabelList dataKey="v" position="top" formatter={(v: unknown) => fmt(Number(v), t.principal.unidad === 'N' ? 0 : 1)} style={{ fontSize: 10, fill: '#475569' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}

export function MiComposicion({ athleteId, token }: { athleteId: string; token: string | null }) {
  const res = usePerfil(athleteId, token)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">📏 Mi composición corporal</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Tu última medición y cómo cambió respecto de la anterior.</p>
      </div>
      <Estado res={res}>
        {(perfil) => {
          const r = resumirComposicion(perfil.antropometrias)
          if (!r) return <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Todavía no tenés mediciones cargadas.</Card>
          const c = TONO[r.tono]
          const dato = (label: string, valor: string, delta: number | null, unidad: string, bueno: 'sube' | 'baja' | 'neutro') => (
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
              <p className="whitespace-nowrap text-xl font-extrabold text-slate-900 dark:text-slate-100">{valor}</p>
              {delta !== null && <p className={`text-[11px] font-semibold ${bueno === 'neutro' || Math.abs(delta) < 0.05 ? 'text-slate-500' : (delta > 0) === (bueno === 'sube') ? 'text-emerald-600' : 'text-amber-600'}`}>{signo(delta)} {unidad} vs. anterior</p>}
            </div>
          )
          return (
            <>
              <Card className="flex flex-col gap-3">
                <p className="text-[11px] text-slate-400">Medición del {r.fecha.split('-').reverse().join('/')}{r.fechaPrevia ? ` · anterior: ${r.fechaPrevia.split('-').reverse().join('/')}` : ''}</p>
                <div className="grid grid-cols-3 gap-2">
                  {dato('Peso', r.peso !== null ? `${fmt(r.peso)} kg` : '—', r.dPeso, 'kg', 'neutro')}
                  {dato('Masa muscular', r.musculoPct !== null ? `${fmt(r.musculoPct)} %` : '—', r.dMusculo, '%', 'sube')}
                  {dato('Masa adiposa', r.grasaPct !== null ? `${fmt(r.grasaPct)} %` : '—', r.dGrasa, '%', 'baja')}
                </div>
              </Card>
              <div className={`rounded-xl border p-4 ${c.caja}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recomendación formativa</p>
                <p className={`mt-0.5 text-base font-bold ${c.titulo}`}>{r.titulo}</p>
                <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{r.mensaje}</p>
                <p className="mt-2 text-[11px] text-slate-400">Orientación automática a partir de tus cambios de peso y composición; no reemplaza lo que te indique la nutricionista del club.</p>
              </div>
            </>
          )
        }}
      </Estado>
    </div>
  )
}

export { Bloqueado }
