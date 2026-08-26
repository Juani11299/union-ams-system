// Edge Function (Fase 31) — recorre `push_subscriptions` y le manda a cada
// una el recordatorio diario de Wellness/RPE vía Web Push. Pensada para
// dispararse sola todos los días por `pg_cron` (ver las instrucciones SQL al
// pie de este archivo) — no la llama nunca el frontend.
//
// Invocar localmente:
//   1. `supabase start`
//   2. `supabase secrets set --env-file supabase/functions/send-reminders/.env.local \
//        VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:vos@union.com`
//      (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen inyectadas solas
//      por el runtime de Edge Functions, no hace falta setearlas.)
//   3. curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-reminders' \
//        --header 'Authorization: Bearer <service-role-key>'
//
// =============================================================================
// SQL para programar el cron diario a las 8:00 AM (hora Argentina, UTC-3) —
// correr esto en el SQL Editor de Supabase UNA SOLA VEZ, en el proyecto real
// (requiere las extensiones `pg_cron` y `pg_net`, activables desde
// Database → Extensions en el dashboard):
//
//   select cron.schedule(
//     'send-daily-wellness-reminders',
//     '0 11 * * *',  -- 08:00 ART = 11:00 UTC (Postgres/pg_cron corre en UTC)
//     $$
//     select net.http_post(
//       url := 'https://<TU-PROYECTO>.supabase.co/functions/v1/send-reminders',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer <TU-SERVICE-ROLE-KEY>'
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );
//
// Para desprogramarlo más adelante: select cron.unschedule('send-daily-wellness-reminders');
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushSubscriptionRow {
  id: string;
  subscription: webpush.PushSubscription;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@union.com";
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("Faltan configurar los secrets VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en el proyecto.");
    }
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Inyectadas solas por el runtime de Edge Functions — la service_role key
    // ignora RLS por completo, necesario acá porque esta función recorre
    // suscripciones de TODOS los jugadores, no las de un usuario puntual.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .returns<PushSubscriptionRow[]>();

    if (error) throw error;

    const payload = JSON.stringify({
      title: "Unión AMS",
      body: "¡Buen día! Recordá completar tu Wellness.",
      url: "/ingreso-rapido",
    });

    let enviados = 0;
    const idsAEliminar: string[] = [];

    for (const row of subs ?? []) {
      try {
        await webpush.sendNotification(row.subscription, payload);
        enviados++;
      } catch (err) {
        // 404/410 = la suscripción expiró o el jugador desinstaló/bloqueó las
        // notificaciones — se limpia de la tabla en vez de seguir
        // intentándole para siempre en cada corrida futura del cron.
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) idsAEliminar.push(row.id);
        console.error(`[send-reminders] fallo enviando a la suscripción ${row.id}:`, err);
      }
    }

    if (idsAEliminar.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", idsAEliminar);
    }

    return new Response(
      JSON.stringify({ total: subs?.length ?? 0, enviados, eliminadas: idsAEliminar.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-reminders] error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido enviando recordatorios.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
