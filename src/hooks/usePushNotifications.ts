import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/** Convierte la VAPID public key (base64url) al `Uint8Array` que pide `applicationServerKey`. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

type EstadoPermiso = 'default' | 'granted' | 'denied'

/**
 * Suscripción a Web Push (Fase 31) — pide permiso nativo del navegador,
 * genera la suscripción con la VAPID public key y la guarda en
 * `push_subscriptions` (sólo INSERT, ver `migration_fase31_push.sql`).
 *
 * `athleteId` puede ser `null` (la columna es nullable a propósito) si se
 * usa desde una pantalla que todavía no identificó al jugador.
 */
export function usePushNotifications(athleteId: string | null) {
  const [estado, setEstado] = useState<EstadoPermiso>('default')
  const [suscribiendo, setSuscribiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const soportado = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const configurado = Boolean(VAPID_PUBLIC_KEY)

  useEffect(() => {
    if (!soportado) return
    setEstado(Notification.permission as EstadoPermiso)
  }, [soportado])

  const suscribir = useCallback(async () => {
    if (!soportado || !configurado) return
    setSuscribiendo(true)
    setError(null)
    try {
      const permiso = await Notification.requestPermission()
      setEstado(permiso as EstadoPermiso)
      if (permiso !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
        }))

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .insert({ athlete_id: athleteId, subscription: subscription.toJSON() })

      if (dbError) throw dbError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar los recordatorios.')
    } finally {
      setSuscribiendo(false)
    }
  }, [soportado, configurado, athleteId])

  return {
    /** `true` sólo cuando ya se puede ofrecer el botón: browser compatible + VAPID key configurada. */
    disponible: soportado && configurado,
    estado,
    suscribiendo,
    error,
    suscribir,
  }
}
