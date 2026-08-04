import { useState } from 'react'

interface ClubLogoProps {
  logoUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-9 w-9 text-base',
  lg: 'h-14 w-14 text-2xl',
}

/** Escudo del club (Sidebar/TopBar) — si no hay `logo_url` cargado en Admin, cae a un ícono genérico. */
export function ClubLogo({ logoUrl, size = 'md' }: ClubLogoProps) {
  const [error, setError] = useState(false)

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt="Escudo del club"
        className={`${SIZE_CLASSES[size]} shrink-0 rounded-md object-contain`}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div
      className={`${SIZE_CLASSES[size]} flex shrink-0 items-center justify-center rounded-md bg-union-red-50 dark:bg-union-red-500/10`}
      aria-hidden
    >
      🛡️
    </div>
  )
}
