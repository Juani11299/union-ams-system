import { useAppStore } from '@/store/useAppStore'

export function TopBar() {
  const club = useAppStore((s) => s.club)
  const seasons = useAppStore((s) => s.seasons)
  const categories = useAppStore((s) => s.categories)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const setActiveSeason = useAppStore((s) => s.setActiveSeason)
  const setActiveCategory = useAppStore((s) => s.setActiveCategory)

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8 dark:border-slate-800 dark:bg-slate-900/95">
      <span className="text-sm font-semibold text-slate-700 md:hidden dark:text-slate-200">
        {club?.nombre ?? 'C.A. Unión'}
      </span>

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

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {categories.map((category) => {
            const activa = category.id === activeCategoryId
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activa
                    ? 'bg-white text-union-red-700 shadow-sm dark:bg-slate-700 dark:text-union-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {category.nombre}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
