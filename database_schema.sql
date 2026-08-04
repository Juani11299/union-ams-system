-- =============================================================================
-- Control de Carga y Preparación Física — esquema institucional (Fase 4)
-- Club > Seasons > TeamCategories > Rosters (pivote) > Athletes
-- Ejecutar en el SQL Editor de Supabase (o vía `supabase db push`).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- clubs
-- -----------------------------------------------------------------------------
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  logo_url text
);

-- -----------------------------------------------------------------------------
-- seasons
-- -----------------------------------------------------------------------------
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  year integer not null,
  is_active boolean not null default false,
  unique (club_id, year)
);

create index if not exists seasons_club_id_idx on seasons (club_id);

-- -----------------------------------------------------------------------------
-- team_categories
-- -----------------------------------------------------------------------------
create table if not exists team_categories (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  nombre text not null
);

create index if not exists team_categories_club_id_idx on team_categories (club_id);

-- -----------------------------------------------------------------------------
-- athletes
-- -----------------------------------------------------------------------------
create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_nacimiento date not null,
  posiciones text[] not null default '{}',
  estado_salud text not null default 'Activo' check (estado_salud in ('Activo', 'Rehabilitación', 'Baja Médica')),
  observaciones_medicas text,
  foto_url text
);

-- -----------------------------------------------------------------------------
-- rosters (tabla pivote: qué atleta jugó en qué categoría, en qué temporada)
-- -----------------------------------------------------------------------------
create table if not exists rosters (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  unique (season_id, category_id, athlete_id)
);

create index if not exists rosters_season_category_idx on rosters (season_id, category_id);
create index if not exists rosters_athlete_id_idx on rosters (athlete_id);

-- -----------------------------------------------------------------------------
-- session_plans (microciclo del profe: MD-4 .. MD+1)
-- -----------------------------------------------------------------------------
create table if not exists session_plans (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  titulo text not null,
  fecha date not null,
  match_day text not null check (match_day in ('MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1')),
  tipo text not null check (tipo in ('Campo', 'Gimnasio', 'Partido', 'Recuperación')),
  duracion_estimada_min integer not null,
  carga_objetivo numeric not null,
  descripcion text,
  rpe_esperado numeric,
  duracion_real_min numeric
);

create index if not exists session_plans_season_category_idx on session_plans (season_id, category_id);

-- -----------------------------------------------------------------------------
-- session_executions (sRPE reportado por el jugador)
-- -----------------------------------------------------------------------------
create table if not exists session_executions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references session_plans (id) on delete set null,
  athlete_id uuid not null references athletes (id) on delete cascade,
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  fecha date not null,
  rpe smallint not null check (rpe between 0 and 10),
  duracion_min integer not null check (duracion_min >= 0),
  carga_interna_calculada numeric not null,
  comentario text
);

create index if not exists session_executions_athlete_id_idx on session_executions (athlete_id);
create index if not exists session_executions_season_category_idx on session_executions (season_id, category_id);

-- -----------------------------------------------------------------------------
-- wellness_entries (cuestionario diario de bienestar)
-- -----------------------------------------------------------------------------
create table if not exists wellness_entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  fecha date not null,
  sueno smallint not null check (sueno between 1 and 5),
  dolor_muscular smallint not null check (dolor_muscular between 1 and 5),
  estres smallint not null check (estres between 1 and 5),
  fatiga smallint not null check (fatiga between 1 and 5),
  comentarios_dolor text
);

create index if not exists wellness_entries_athlete_id_idx on wellness_entries (athlete_id);
create index if not exists wellness_entries_season_category_idx on wellness_entries (season_id, category_id);

-- -----------------------------------------------------------------------------
-- external_loads (carga externa / GPS por sesión — Fase 6)
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

-- =============================================================================
-- Row Level Security
--
-- ADVERTENCIA: estas políticas son PERMISIVAS A PROPÓSITO para desarrollo —
-- permiten lectura y escritura anónima total. Antes de ir a producción hay que
-- reemplazarlas por políticas basadas en auth.uid() / rol del usuario
-- (ej. sólo el profe de un club puede escribir sobre sus propias categorías).
-- =============================================================================

alter table clubs enable row level security;
alter table seasons enable row level security;
alter table team_categories enable row level security;
alter table athletes enable row level security;
alter table rosters enable row level security;
alter table session_plans enable row level security;
alter table session_executions enable row level security;
alter table wellness_entries enable row level security;
alter table external_loads enable row level security;

create policy "dev_open_access" on clubs for all to anon using (true) with check (true);
create policy "dev_open_access" on seasons for all to anon using (true) with check (true);
create policy "dev_open_access" on team_categories for all to anon using (true) with check (true);
create policy "dev_open_access" on athletes for all to anon using (true) with check (true);
create policy "dev_open_access" on rosters for all to anon using (true) with check (true);
create policy "dev_open_access" on session_plans for all to anon using (true) with check (true);
create policy "dev_open_access" on session_executions for all to anon using (true) with check (true);
create policy "dev_open_access" on wellness_entries for all to anon using (true) with check (true);
create policy "dev_open_access" on external_loads for all to anon using (true) with check (true);
