-- =============================================================================
-- Fase 31 — Web Push Notifications: recordatorios diarios de Wellness/RPE.
--
-- `push_subscriptions` guarda el objeto `PushSubscription` tal como lo
-- devuelve `pushManager.subscribe()` del navegador (endpoint + claves p256dh/
-- auth) — se persiste crudo en JSONB porque es exactamente lo que después
-- necesita `web-push` (Edge Function `send-reminders`) para mandar la
-- notificación, sin re-mapear campos.
--
-- `athlete_id` es NULLABLE a propósito: el jugador se suscribe desde el
-- Magic Link (`/ingreso-rapido`, sin login — Fase 18 sólo protege las rutas
-- de Staff), así que la suscripción puede llegar antes de que el jugador
-- termine de elegir su nombre en la pantalla de selección, o simplemente sin
-- poder identificarlo si el flujo cambia a futuro.
-- =============================================================================

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- Sólo INSERT para `anon` (el jugador nunca necesita leer/editar/borrar
-- suscripciones ajenas desde el browser) — a propósito más angosto que el
-- `dev_open_access ... for all` del resto de las tablas: acá sí importa no
-- dejar la tabla abierta a lectura pública, aunque el resto del esquema use
-- ese patrón permisivo por ser un proyecto de un solo club en desarrollo.
--
-- Nota de diseño (evita repetir el bug de Fase 26): el frontend NO encadena
-- `.select()` después de este `.insert()` — así no hace falta una política
-- de SELECT para `anon` para que la respuesta no rompa con
-- "Cannot coerce the result to a single JSON object".
create policy "anon_insert_push_subscription" on push_subscriptions
  for insert to anon
  with check (true);

-- El Staff logueado (Fase 18, rol `authenticated`) puede leer la tabla —
-- útil a futuro para un panel de "cuántos jugadores tienen recordatorios
-- activos" en Admin. El envío real (Edge Function `send-reminders`) corre
-- con la service_role key, que ignora RLS por completo — no depende de esta
-- política para funcionar.
create policy "authenticated_select_push_subscription" on push_subscriptions
  for select to authenticated
  using (true);
