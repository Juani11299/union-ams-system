const PALETA = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
]

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  const primera = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}

function colorDesde(seed: string): string {
  const hash = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETA[hash % PALETA.length]
}

interface AvatarProps {
  nombre: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({ nombre, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorDesde(nombre)} ${SIZE_CLASSES[size]}`}
    >
      {iniciales(nombre)}
    </div>
  )
}
