-- =============================================================================
-- Fase 6 — migración incremental (correr sólo si ya aplicaste database_schema.sql
-- de una fase anterior). Un proyecto NUEVO puede ignorar este archivo: ya está
-- todo incluido en database_schema.sql.
--
-- Contenido:
--   1) Renombra los valores de `session_plans.tipo` para que coincidan con el
--      selector pedido en Fase 6 ('Campo', 'Gimnasio', 'Partido', 'Recuperación').
--   2) Crea la tabla `external_loads` (módulo de Carga Externa / GPS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Renombrar tipos de sesión existentes + endurecer el check constraint
-- -----------------------------------------------------------------------------
update session_plans set tipo = 'Campo' where tipo in ('Cancha', 'Mixta');
update session_plans set tipo = 'Gimnasio' where tipo = 'Fuerza';

alter table session_plans drop constraint if exists session_plans_tipo_check;
alter table session_plans
  add constraint session_plans_tipo_check
  check (tipo in ('Campo', 'Gimnasio', 'Partido', 'Recuperación'));

-- -----------------------------------------------------------------------------
-- 2) external_loads (carga externa / GPS por sesión)
-- -----------------------------------------------------------------------------
create table if not exists external_loads (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references session_plans (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  fecha date not null,
  total_distance numeric not null,
  high_speed_running numeric not null,
  player_load numeric not null,
  sprints integer,
  max_velocity numeric,
  fuente text not null default 'GPS' check (fuente in ('GPS', 'Manual', 'CSV Import')),
  unique (plan_id, athlete_id)
);

create index if not exists external_loads_athlete_id_idx on external_loads (athlete_id);
create index if not exists external_loads_season_category_idx on external_loads (season_id, category_id);

alter table external_loads enable row level security;

drop policy if exists "dev_open_access" on external_loads;
create policy "dev_open_access" on external_loads for all to anon using (true) with check (true);
