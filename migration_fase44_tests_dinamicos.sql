-- =============================================================================
-- Fase 46 — NordBord y Tests Dinámicos en Supabase (antes: IndexedDB del
-- navegador, "silos" por equipo).
--
-- UNA sola tabla flexible para todas las pruebas que no tienen columnas fijas:
-- el dashboard de NordBord (test_name = 'NordBord') y cada test que el staff
-- crea desde el Hub de Evaluaciones ("Velocidad 30m", etc.). Cada fila es UN
-- jugador en UNA fecha; las métricas viajan en crudo dentro de `metrics`
-- (JSONB), así un test nuevo no necesita migración de esquema.
--
-- Seguridad: son datos de rendimiento de juveniles → tabla cerrada al público.
-- Sólo el Staff logueado (rol Postgres `authenticated`) lee y escribe; el rol
-- `anon` no tiene permisos de tabla ni política (un visitante del link de sólo
-- lectura NO ve estos tests).
--
-- Idempotente: se puede correr más de una vez en el SQL Editor.
-- =============================================================================

create table if not exists public.dynamic_evaluations (
  id             uuid primary key default gen_random_uuid(),
  -- 'NordBord' o el nombre que el staff le puso al test ("Velocidad 30m").
  test_name      text        not null,
  -- Nombre tal cual vino en el archivo, sólo para mostrar.
  player_name    text        not null,
  -- Nombre normalizado (sin tildes/mayúsculas/orden) para matchear al mismo
  -- jugador entre pruebas y contra las antropometrías.
  player_key     text        not null,
  category_label text        not null default 'Sin categoría',
  fecha          date        not null,
  -- Pares clave→valor en crudo del CSV/Excel, ej. {"L Max Force (N)": 340, "Max Imbalance (%)": 5.2}.
  -- Las claves que empiezan con "_" son metadatos de la fila (ej. "_device").
  metrics        jsonb       not null default '{}'::jsonb,
  -- Configuración del test (se repite igual en todas las filas del mismo test):
  -- { "icono": "🧪", "archivo": "sprint.csv", "key_metrics": ["Sprint 30m [s]"],
  --   "less_is_better": ["Sprint 30m [s]"], "unidades": {"Sprint 30m [s]": "s"} }
  test_config    jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint dynamic_evaluations_metrics_es_objeto check (jsonb_typeof(metrics) = 'object'),
  constraint dynamic_evaluations_config_es_objeto check (jsonb_typeof(test_config) = 'object'),
  -- Habilita `upsert(..., { onConflict: 'test_name,player_key,fecha' })`: volver a
  -- subir el Excel corregido actualiza en vez de duplicar.
  constraint dynamic_evaluations_test_player_fecha_key
    unique (test_name, player_key, fecha)
);

create index if not exists dynamic_evaluations_test_name_idx on public.dynamic_evaluations (test_name);
create index if not exists dynamic_evaluations_player_key_idx on public.dynamic_evaluations (player_key);
create index if not exists dynamic_evaluations_fecha_idx on public.dynamic_evaluations (fecha);

create or replace function public.dynamic_evaluations_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dynamic_evaluations_updated_at on public.dynamic_evaluations;
create trigger dynamic_evaluations_updated_at
  before update on public.dynamic_evaluations
  for each row execute function public.dynamic_evaluations_set_updated_at();

-- ── Seguridad ────────────────────────────────────────────────────────────────
alter table public.dynamic_evaluations enable row level security;

-- Defensa en profundidad: además de no tener política, `anon` pierde los
-- privilegios de tabla que Supabase otorga por defecto en `public`.
revoke all on public.dynamic_evaluations from anon;
grant select, insert, update, delete on public.dynamic_evaluations to authenticated;

drop policy if exists dynamic_evaluations_staff_select on public.dynamic_evaluations;
drop policy if exists dynamic_evaluations_staff_insert on public.dynamic_evaluations;
drop policy if exists dynamic_evaluations_staff_update on public.dynamic_evaluations;
drop policy if exists dynamic_evaluations_staff_delete on public.dynamic_evaluations;

create policy dynamic_evaluations_staff_select on public.dynamic_evaluations
  for select to authenticated using (true);

create policy dynamic_evaluations_staff_insert on public.dynamic_evaluations
  for insert to authenticated with check (true);

create policy dynamic_evaluations_staff_update on public.dynamic_evaluations
  for update to authenticated using (true) with check (true);

create policy dynamic_evaluations_staff_delete on public.dynamic_evaluations
  for delete to authenticated using (true);
