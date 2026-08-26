import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { ClubLogo } from '@/components/ClubLogo'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function TopBar() {
  const club = useAppStore((s) => s.club)
  const seasons = useAppStore((s) => s.seasons)
  const categories = useAppStore((s) => s.categories)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const setActiveSeason = useAppStore((s) => s.setActiveSeason)
  const setActiveCategory = useAppStore((s) => s.setActiveCategory)
  const signOut = useAuthStore((s) => s.signOut)
  const isOnline = useNetworkStatus()

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-900/95">
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          📡 Modo Offline — Visualizando datos locales
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between md:hidden">
          <ClubLogo logoUrl={club?.logo_url} size="sm" />
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Cerrar sesión"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            🚪
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeSeasonId ?? ''}
            onChange={(e) => setActiveSeason(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                Temporada {season.year}
                {season.is_active ? ' (actual)' : ''}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {categoryLocked && (
              <span
                className="pl-2 pr-1 text-sm"
                title="Categoría bloqueada por link — abrí el link general para poder cambiarla"
                aria-hidden
              >
                🔒
              </span>
            )}
            {categories.map((category) => {
              const activa = category.id === activeCategoryId
              return (
                <button
                  key={category.id}
                  type="button"
                  disabled={categoryLocked}
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    activa
                      ? 'bg-white text-union-red-700 shadow-sm dark:bg-slate-700 dark:text-union-red-400'
                      : 'text-slate-500 dark:text-slate-400'
                  } ${categoryLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {category.nombre}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
