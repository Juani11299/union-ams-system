-- =============================================================================
-- Fase 12 — Planificador de Fuerza Avanzado: Biblioteca de Plantillas +
-- integración drag & drop con el Microciclo + asignación individual (roster).
--
-- Diseño: las plantillas (`strength_templates`) son de club (NO se scopean por
-- season_id/category_id como el resto de las entidades de la app) — a
-- propósito, porque el punto entero de una "biblioteca reutilizable" es que
-- una plantilla de "Fuerza Máxima" sirva para 9na Y Primera, en cualquier
-- temporada, sin duplicarla. `strength_template_exercises` cuelga de la
-- plantilla (lista de ejercicios reusable, editada UNA vez).
--
-- Al arrastrar una plantilla sobre un día del microciclo se crea una fila en
-- `strength_assignments` (plantilla + día puntual = `session_plans.id`) y N
-- filas en `strength_assignment_athletes` (a qué jugadores puntuales aplica —
-- todo el plantel activo si es 'General', los elegidos a mano si es
-- 'Vitamina'). Esto es nuevo: `strength_blocks` (Fase 7) nunca tuvo forma de
-- saber "en qué día" ni "a qué jugadores" aplicaba — quedaba como un Kanban
-- único por season/category. Esta fase no reemplaza `strength_blocks`, agrega
-- un nivel de planificación por encima.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- strength_templates (Biblioteca de Plantillas — de club, no de season/category)
-- -----------------------------------------------------------------------------
create table if not exists strength_templates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  tipo text not null check (tipo in ('General', 'Vitamina')),
  nombre text not null,
  descripcion text
);

create index if not exists strength_templates_club_id_idx on strength_templates (club_id);

-- -----------------------------------------------------------------------------
-- strength_template_exercises (ejercicios reusables dentro de una plantilla)
-- -----------------------------------------------------------------------------
create table if not exists strength_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references strength_templates (id) on delete cascade,
  titulo text not null,
  series_reps text not null,
  carga_pct text,
  notas text,
  orden integer not null default 0
);

create index if not exists strength_template_exercises_template_id_idx
  on strength_template_exercises (template_id);

-- -----------------------------------------------------------------------------
-- strength_assignments (pivote: una plantilla aplicada a un día puntual)
-- -----------------------------------------------------------------------------
create table if not exists strength_assignments (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references strength_templates (id) on delete cascade,
  session_plan_id uuid not null references session_plans (id) on delete cascade,
  tipo text not null check (tipo in ('General', 'Vitamina'))
);

create index if not exists strength_assignments_session_plan_id_idx
  on strength_assignments (session_plan_id);

-- -----------------------------------------------------------------------------
-- strength_assignment_athletes (pivote: a qué jugadores puntuales aplica)
-- -----------------------------------------------------------------------------
create table if not exists strength_assignment_athletes (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references strength_assignments (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  unique (assignment_id, athlete_id)
);

create index if not exists strength_assignment_athletes_assignment_id_idx
  on strength_assignment_athletes (assignment_id);
create index if not exists strength_assignment_athletes_athlete_id_idx
  on strength_assignment_athletes (athlete_id);

-- -----------------------------------------------------------------------------
-- Row Level Security — mismo patrón permisivo de desarrollo que el resto del
-- esquema (ver advertencia en database_schema.sql sobre endurecerlo luego).
-- -----------------------------------------------------------------------------
alter table strength_templates enable row level security;
alter table strength_template_exercises enable row level security;
alter table strength_assignments enable row level security;
alter table strength_assignment_athletes enable row level security;

drop policy if exists "dev_open_access" on strength_templates;
drop policy if exists "dev_open_access" on strength_template_exercises;
drop policy if exists "dev_open_access" on strength_assignments;
drop policy if exists "dev_open_access" on strength_assignment_athletes;

create policy "dev_open_access" on strength_templates for all to anon using (true) with check (true);
create policy "dev_open_access" on strength_template_exercises for all to anon using (true) with check (true);
create policy "dev_open_access" on strength_assignments for all to anon using (true) with check (true);
create policy "dev_open_access" on strength_assignment_athletes for all to anon using (true) with check (true);
