/**
 * Presentación institucional "Modelo de Desarrollo de la Fuerza" (13 láminas
 * 16:9). Es un HTML autónomo servido desde `public/presentacion-fuerza/` y se
 * muestra embebido en un iframe para conservar el Sidebar y la sesión. Las
 * flechas del teclado y la tecla F funcionan una vez que se hace click dentro
 * de la presentación (el iframe necesita el foco).
 */
const URL_PRESENTACION = '/presentacion-fuerza/index.html'

export function PresentacionFuerzaView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">🎞️ Presentación — Modelo de Desarrollo de la Fuerza</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Metodología y organización operativa del gimnasio en divisiones formativas · 13 láminas. Hacé click en la presentación y navegá con las flechas del teclado; <kbd className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">F</kbd> para pantalla completa.
          </p>
        </div>
        <a
          href={URL_PRESENTACION}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:text-slate-200"
        >
          ↗ Abrir en pestaña nueva
        </a>
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-700">
        <iframe title="Presentación: Modelo de Desarrollo de la Fuerza" src={URL_PRESENTACION} className="h-full w-full border-0" allow="fullscreen" allowFullScreen />
      </div>
    </div>
  )
}
