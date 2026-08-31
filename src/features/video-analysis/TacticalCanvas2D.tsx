import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type Herramienta = 'mover' | 'flecha' | 'zona' | 'cono'
type Equipo = 'propio' | 'rival' | 'balon'

interface Token {
  id: string
  equipo: Equipo
  x: number
  y: number
  numero?: number
}

interface Flecha {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Zona {
  id: string
  x: number
  y: number
  w: number
  h: number
}

interface Cono {
  id: string
  x: number
  y: number
}

const ANCHO = 700
const ALTO = 450
const COLOR_PROPIO = '#ed1c24'
const COLOR_RIVAL = '#1f2937'
const COLOR_BALON = '#f8fafc'

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Pizarra 2D y Conversión Táctica (Fase 34, Paso 4 — inspirado en "Video to
 * 2D IA" de AURE, pero sin IA: acá el profe recrea la jugada a mano viendo
 * el video al lado). SVG puro (sin librería de canvas nueva, mismo criterio
 * de "cero dependencias extra" del resto de la plataforma) — cancha,
 * jugadores propio/rival arrastrables, flechas de trayectoria, zonas
 * sombreadas y conos. Exporta a PNG serializando el SVG a través de un
 * `<canvas>` intermedio.
 */
export function TacticalCanvas2D() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [flechas, setFlechas] = useState<Flecha[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [conos, setConos] = useState<Cono[]>([])
  const [herramienta, setHerramienta] = useState<Herramienta>('mover')
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [trazoActual, setTrazoActual] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  function coordenadasSvg(e: ReactPointerEvent): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * ANCHO
    const y = ((e.clientY - rect.top) / rect.height) * ALTO
    return { x, y }
  }

  function agregarToken(equipo: Equipo) {
    const numerosUsados = tokens.filter((t) => t.equipo === equipo).length
    setTokens((prev) => [
      ...prev,
      {
        id: nuevoId(),
        equipo,
        x: equipo === 'balon' ? ANCHO / 2 : 80 + numerosUsados * 40,
        y: equipo === 'rival' ? 80 : ALTO / 2,
        numero: equipo === 'balon' ? undefined : numerosUsados + 1,
      },
    ])
  }

  function handlePointerDownToken(id: string) {
    if (herramienta === 'mover') setArrastrando(id)
  }

  function handlePointerMove(e: ReactPointerEvent) {
    const { x, y } = coordenadasSvg(e)
    if (herramienta === 'mover' && arrastrando) {
      setTokens((prev) => prev.map((t) => (t.id === arrastrando ? { ...t, x, y } : t)))
      return
    }
    if (trazoActual) {
      setTrazoActual({ ...trazoActual, x2: x, y2: y })
    }
  }

  function handlePointerUp() {
    if (herramienta === 'mover') {
      setArrastrando(null)
      return
    }
    if (trazoActual) {
      if (herramienta === 'flecha') {
        setFlechas((prev) => [...prev, { id: nuevoId(), ...trazoActual }])
      } else if (herramienta === 'zona') {
        const x = Math.min(trazoActual.x1, trazoActual.x2)
        const y = Math.min(trazoActual.y1, trazoActual.y2)
        const w = Math.abs(trazoActual.x2 - trazoActual.x1)
        const h = Math.abs(trazoActual.y2 - trazoActual.y1)
        if (w > 4 && h > 4) setZonas((prev) => [...prev, { id: nuevoId(), x, y, w, h }])
      }
      setTrazoActual(null)
    }
  }

  function handlePointerDownCancha(e: ReactPointerEvent) {
    const { x, y } = coordenadasSvg(e)
    if (herramienta === 'cono') {
      setConos((prev) => [...prev, { id: nuevoId(), x, y }])
      return
    }
    if (herramienta === 'flecha' || herramienta === 'zona') {
      setTrazoActual({ x1: x, y1: y, x2: x, y2: y })
    }
  }

  function limpiarTodo() {
    setTokens([])
    setFlechas([])
    setZonas([])
    setConos([])
  }

  function exportarPng() {
    const svg = svgRef.current
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)))
    const img = new Image()
    img.onload = () => {
      const escala = 2
      const canvas = document.createElement('canvas')
      canvas.width = ANCHO * escala
      canvas.height = ALTO * escala
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(escala, escala)
      ctx.drawImage(img, 0, 0)
      const enlace = document.createElement('a')
      enlace.download = `pizarra-tactica-${Date.now()}.png`
      enlace.href = canvas.toDataURL('image/png')
      enlace.click()
    }
    img.src = `data:image/svg+xml;base64,${svgBase64}`
  }

  const HERRAMIENTAS: { id: Herramienta; icono: string; label: string }[] = [
    { id: 'mover', icono: '✋', label: 'Mover' },
    { id: 'flecha', icono: '➡️', label: 'Flecha' },
    { id: 'zona', icono: '🟥', label: 'Zona' },
    { id: 'cono', icono: '🔶', label: 'Cono' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {HERRAMIENTAS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHerramienta(h.id)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                herramienta === h.id
                  ? 'bg-union-red-600 text-white'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span>{h.icono}</span>
              {h.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => agregarToken('propio')}
            className="rounded-lg bg-union-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700"
          >
            + Propio
          </button>
          <button
            type="button"
            onClick={() => agregarToken('rival')}
            className="rounded-lg bg-union-charcoal px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            + Rival
          </button>
          <button
            type="button"
            onClick={() => agregarToken('balon')}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            + Balón
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={limpiarTodo}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            🗑️ Limpiar
          </button>
          <button
            type="button"
            onClick={exportarPng}
            className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700"
          >
            📸 Exportar PNG
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full touch-none rounded-xl border border-slate-200 shadow-sm dark:border-slate-700"
        style={{ background: '#1e7a3d', cursor: herramienta === 'mover' ? 'default' : 'crosshair' }}
        onPointerDown={handlePointerDownCancha}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Líneas de cancha */}
        <rect x={20} y={20} width={ANCHO - 40} height={ALTO - 40} fill="none" stroke="#f8fafc" strokeWidth={2} opacity={0.85} />
        <line x1={ANCHO / 2} y1={20} x2={ANCHO / 2} y2={ALTO - 20} stroke="#f8fafc" strokeWidth={2} opacity={0.85} />
        <circle cx={ANCHO / 2} cy={ALTO / 2} r={55} fill="none" stroke="#f8fafc" strokeWidth={2} opacity={0.85} />
        <rect x={20} y={ALTO / 2 - 80} width={90} height={160} fill="none" stroke="#f8fafc" strokeWidth={2} opacity={0.85} />
        <rect x={ANCHO - 110} y={ALTO / 2 - 80} width={90} height={160} fill="none" stroke="#f8fafc" strokeWidth={2} opacity={0.85} />

        {/* Zonas sombreadas */}
        {zonas.map((z) => (
          <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} fill="#facc15" opacity={0.28} stroke="#facc15" strokeWidth={1.5} />
        ))}

        {/* Trazo en curso (flecha o zona) */}
        {trazoActual && herramienta === 'flecha' && (
          <line x1={trazoActual.x1} y1={trazoActual.y1} x2={trazoActual.x2} y2={trazoActual.y2} stroke="#ffffff" strokeWidth={3} strokeDasharray="6 4" />
        )}
        {trazoActual && herramienta === 'zona' && (
          <rect
            x={Math.min(trazoActual.x1, trazoActual.x2)}
            y={Math.min(trazoActual.y1, trazoActual.y2)}
            width={Math.abs(trazoActual.x2 - trazoActual.x1)}
            height={Math.abs(trazoActual.y2 - trazoActual.y1)}
            fill="#facc15"
            opacity={0.2}
            stroke="#facc15"
            strokeDasharray="4 3"
          />
        )}

        {/* Flechas de trayectoria */}
        <defs>
          <marker id="puntaFlecha" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#ffffff" />
          </marker>
        </defs>
        {flechas.map((f) => (
          <line key={f.id} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke="#ffffff" strokeWidth={3} markerEnd="url(#puntaFlecha)" />
        ))}

        {/* Conos */}
        {conos.map((c) => (
          <polygon key={c.id} points={`${c.x},${c.y - 9} ${c.x - 8},${c.y + 7} ${c.x + 8},${c.y + 7}`} fill="#f97316" stroke="#7c2d12" strokeWidth={1} />
        ))}

        {/* Jugadores y balón */}
        {tokens.map((t) => (
          <g
            key={t.id}
            transform={`translate(${t.x}, ${t.y})`}
            onPointerDown={() => handlePointerDownToken(t.id)}
            style={{ cursor: herramienta === 'mover' ? 'grab' : 'default' }}
          >
            <circle
              r={t.equipo === 'balon' ? 8 : 14}
              fill={t.equipo === 'propio' ? COLOR_PROPIO : t.equipo === 'rival' ? COLOR_RIVAL : COLOR_BALON}
              stroke="#ffffff"
              strokeWidth={2}
            />
            {t.numero !== undefined && (
              <text textAnchor="middle" dy={4} fontSize={12} fontWeight={700} fill="#ffffff">
                {t.numero}
              </text>
            )}
          </g>
        ))}
      </svg>

      <p className="text-[11px] text-slate-400">
        "Mover" arrastra jugadores y balón. "Flecha"/"Zona" se dibujan haciendo click y arrastrando sobre la cancha.
        "Cono" se coloca con un click.
      </p>
    </div>
  )
}
