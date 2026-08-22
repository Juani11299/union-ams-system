-- =============================================================================
-- Fase Complementarios — "Planes Complementarios" (mesociclos de fuerza para
-- gimnasios externos al club, ver docs/Propuesta_Integracion_NSCA.md sección 2
-- sobre periodización). A diferencia de `strength_templates` (Fase 12, un solo
-- día de gimnasio del club), acá un plan cubre VARIAS semanas de progresión —
-- se imprime como tarjeta y el jugador se la lleva a su gimnasio de barrio.
--
-- Scopeado sólo por `category_id` (no por season_id), mismo criterio que
-- `strength_templates`: es una biblioteca reutilizable, no un dato de una
-- semana puntual del microciclo.
--
-- `plan_data` guarda un único JSONB con la forma:
--   { "exercises": [
--       { "id": "...", "exercise": "Sentadilla", "notes": "...",
--         "progressions": { "week1": "3x10", "week2": "3x12", "week3": "4x10" } }
--   ] }
-- Igual criterio que `gym_sheet_data` (Fase 16): es contenido de "hoja
-- impresa" que el profe edita como un todo, no datos que otras vistas
-- necesiten consultar fila por fila.
-- =============================================================================

create table if not exists complementary_plans (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references team_categories (id) on delete cascade,
  title text not null,
  duration_weeks integer not null default 4,
  plan_data jsonb not null default '{"exercises": []}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists complementary_plans_category_id_idx on complementary_plans (category_id);

-- -----------------------------------------------------------------------------
-- Row Level Security — mismo patrón permisivo de desarrollo que el resto del
-- esquema (ver advertencia en database_schema.sql sobre endurecerlo luego).
-- -----------------------------------------------------------------------------
alter table complementary_plans enable row level security;

drop policy if exists "dev_open_access" on complementary_plans;

create policy "dev_open_access" on complementary_plans for all to anon using (true) with check (true);
