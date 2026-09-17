-- Fase 38 — Refactor radical de "Evaluaciones de Rendimiento": reemplaza el
-- dashboard anterior (Fase 33.2, `useEvaluationsDashboardStore` — un único
-- CSV efímero en IndexedDB, sin historial ni persistencia real) por una
-- tabla de verdad en Supabase con métricas en JSONB, porque distintas
-- baterías de test (CMJ, Sprint 30m, Fuerza Isométrica, Asimetrías, etc.)
-- traen columnas completamente distintas — no tiene sentido una columna SQL
-- fija por métrica.
--
-- NO toca la tabla vieja `physical_tests` (CMJ manual, Fase 7) — sigue
-- viva para `CmjTab.tsx`/ACWR, es un caso de uso distinto (carga rápida de
-- un solo valor en el día a día, no importación de baterías completas de
-- test con muchas columnas).
--
-- `evaluation_name` es el "tipo" de evaluación (ej. "CMJ Enero 2026",
-- "Sprint 30m — Pretemporada") — el Análisis Grupal compara la fecha más
-- reciente contra la anterior DENTRO del mismo `evaluation_name` +
-- categoría, nunca entre evaluaciones de tipos distintos.
--
-- `athlete_id` es NOT NULL a propósito: una fila que no pudo matchear a un
-- atleta real del plantel (Smart Entity Matcher, `normalizarNombre`) no se
-- inserta — no tiene sentido persistir una evaluación "huérfana" que después
-- ningún reporte por jugador va a poder mostrar.

create table if not exists performance_evaluations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id) on delete cascade,
  category_id uuid not null references team_categories (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  evaluation_name text not null,
  fecha date not null,
  -- { "CMJ_Height": 35.2, "Fuerza_Max_Izq": 210, "Fuerza_Max_Der": 195, ... }
  -- — todas las columnas numéricas del CSV excepto peso corporal, que se
  -- separa a su propia columna por lo seguido que se usa (métricas
  -- relativas al peso).
  metrics jsonb not null default '{}'::jsonb,
  body_weight_kg numeric,
  created_at timestamptz not null default now()
);

create index if not exists performance_evaluations_athlete_id_idx on performance_evaluations (athlete_id);
create index if not exists performance_evaluations_season_category_idx on performance_evaluations (season_id, category_id);
create index if not exists performance_evaluations_evaluation_name_idx on performance_evaluations (evaluation_name);

alter table performance_evaluations enable row level security;

create policy "dev_open_access" on performance_evaluations
  for all to anon using (true) with check (true);

create policy "dev_open_access_authenticated" on performance_evaluations
  for all to authenticated using (true) with check (true);
