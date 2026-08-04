-- =============================================================================
-- Fase 7 — migración de `strength_blocks` y `physical_tests` (con `rsi_modificado`
-- agregado en Fase 8). Ya corrida en el proyecto real de Supabase del usuario.
--
-- IMPORTANTE (Fase 8.1): a partir de esta fase, el frontend SÍ depende de que
-- esto esté corrido — tanto el Kanban de Fuerza como las evaluaciones CMJ/RSI
-- modificado ya usan Supabase (`useAppStore.submitPhysicalTest` /
-- `createStrengthBlock` / `moveStrengthBlock` / `deleteStrengthBlock`), no
-- estado local. Si se corre este proyecto contra un Supabase sin esta
-- migración, ambos módulos van a fallar al guardar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- strength_blocks (bloques del Kanban de Planificación de Fuerza)
-- -----------------------------------------------------------------------------
create table if not exists strength_blocks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  columna text not null check (columna in ('Activación', 'Fuerza Máxima', 'Potencia', 'Accesorios')),
  titulo text not null,
  series_reps text not null,
  carga_pct text,
  notas text,
  orden integer not null default 0
);

create index if not exists strength_blocks_season_category_idx on strength_blocks (season_id, category_id);

alter table strength_blocks enable row level security;
drop policy if exists "dev_open_access" on strength_blocks;
create policy "dev_open_access" on strength_blocks for all to anon using (true) with check (true);

-- -----------------------------------------------------------------------------
-- physical_tests (evaluaciones físicas manuales — por ahora, CMJ)
-- -----------------------------------------------------------------------------
create table if not exists physical_tests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  fecha date not null,
  cmj_cm numeric not null,
  rsi_modificado numeric,
  notas text
);

-- `create table if not exists` es un no-op si la tabla ya existía de una corrida
-- anterior de este mismo archivo (por ejemplo, antes de que `rsi_modificado` se
-- agregara en Fase 8) — en ese caso la columna nueva NUNCA se crea. Este ALTER
-- es idempotente y cubre exactamente ese caso; correrlo de nuevo no rompe nada
-- si la columna ya existe.
alter table physical_tests add column if not exists rsi_modificado numeric;

create index if not exists physical_tests_athlete_id_idx on physical_tests (athlete_id);
create index if not exists physical_tests_season_category_idx on physical_tests (season_id, category_id);

alter table physical_tests enable row level security;
drop policy if exists "dev_open_access" on physical_tests;
create policy "dev_open_access" on physical_tests for all to anon using (true) with check (true);
