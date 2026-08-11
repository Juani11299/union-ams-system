import { useToastStore, type ToastType } from '@/store/useToastStore'

const ESTILOS: Record<ToastType, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
  error:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400',
  info: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400',
}

const ICONOS: Record<ToastType, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    // z-[80]: por encima de TODOS los modales de la app (el más alto hoy es
    // z-[70] — la Terminal de Fuerza, Fase 17, cuyo fondo es opaco a
    // pantalla completa, no semitransparente como el resto: si el toast
    // quedara por debajo, un error de guardado quedaría 100% invisible
    // mientras el modal está abierto, justo cuando más hace falta mostrarlo).
    <div className="fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex w-full max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${ESTILOS[toast.type]}`}
        >
          <span>{ICONOS[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Cerrar notificación"
            className="text-current opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
