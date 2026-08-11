-- =============================================================================
-- Fase 17 — Terminal de Fuerza: los jugadores registran ellos mismos, en una
-- pantalla táctil sin sidebar, las series/kilos del ejercicio troncal que el
-- profe marcó con 🎯 en la Planilla de Fuerza (Fase 16).
--
-- `sets_data` guarda el array crudo de series ([{ reps, weight_kg }, ...]) en
-- vez de una tabla normalizada de series — mismo criterio que `gym_sheet_data`
-- (Fase 16): es el detalle de UN registro puntual que se lee/escribe siempre
-- entero, nunca se necesita filtrar "la serie 2 de todos los jugadores".
-- `total_tonnage` se persiste ya calculado (no derivado en cada query) porque
-- es lo que se lee todo el tiempo desde la Terminal de Fuerza (check verde) y
-- desde el historial del atleta — evitar recalcular sum(reps*kg) del JSONB en
-- cada lectura.
--
-- unique (athlete_id, session_id): sólo un ejercicio se trackea por sesión
-- (Fase 16 fuerza un único `isTracked: true` en toda la planilla), así que un
-- jugador tiene a lo sumo un registro por sesión de gimnasio — la Terminal
-- hace upsert sobre esta constraint para permitir que el jugador corrija su
-- propia carga si vuelve a tocar su nombre antes de irse.
-- =============================================================================

create table if not exists gym_external_loads (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  session_id uuid not null references session_plans (id) on delete cascade,
  exercise_name text not null,
  sets_data jsonb not null,
  total_tonnage numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (athlete_id, session_id)
);

create index if not exists gym_external_loads_athlete_id_idx on gym_external_loads (athlete_id);
create index if not exists gym_external_loads_session_id_idx on gym_external_loads (session_id);

-- -----------------------------------------------------------------------------
-- Row Level Security — mismo patrón permisivo de desarrollo que el resto del
-- esquema (ver advertencia en database_schema.sql sobre endurecerlo luego).
-- -----------------------------------------------------------------------------
alter table gym_external_loads enable row level security;

drop policy if exists "dev_open_access" on gym_external_loads;

create policy "dev_open_access" on gym_external_loads for all to anon using (true) with check (true);
