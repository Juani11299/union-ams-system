-- Fase 36 — "Microciclo Nº" opcional por semana (Planificador).
-- Un número chico, uno por (temporada, categoría, semana), sólo para que el
-- profe sepa en qué microciclo de la temporada está — no tiene relación con
-- las etiquetas MD/MD+1/MD-2 de cada sesión (eso ahora se llama "Sesión" en
-- la interfaz, no "Microciclo").
--
-- `semana_inicio` es siempre el LUNES de la semana (mismo criterio que
-- `inicioDeSemana()` en src/utils/fecha.ts) — así una sola fila cubre toda
-- la semana mostrada en el Planificador, sin importar qué día se esté
-- viendo dentro de ella.

create table if not exists weekly_microcycles (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  category_id uuid not null references team_categories(id) on delete cascade,
  semana_inicio date not null,
  numero integer not null,
  unique (season_id, category_id, semana_inicio)
);

alter table weekly_microcycles enable row level security;

-- Mismo criterio "dev_open_access" que el resto de las tablas de este
-- proyecto (ver migration_fase26_rls_authenticated.sql) — RLS permisiva,
-- no es control de acceso real, sólo mantiene la tabla utilizable con la
-- key anon mientras no haya roles reales.
create policy "dev_open_access" on weekly_microcycles
  for all to anon using (true) with check (true);

create policy "dev_open_access_authenticated" on weekly_microcycles
  for all to authenticated using (true) with check (true);
