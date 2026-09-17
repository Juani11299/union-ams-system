-- Fase 40 — el jugador de una Evaluación de Rendimiento ya NO se matchea
-- contra el plantel real (athletes/rosters) — pedido explícito. El nombre
-- se toma TAL CUAL viene en la columna "Jugador"/"Nombre" del CSV, sin
-- exigir que ese jugador ya exista en el sistema. Esto permite sumar
-- evaluaciones de un mismo jugador entre CSVs de tests DISTINTOS (ej. subís
-- "CMJ.csv" y después "Curl Nordico.csv") con sólo compartir el nombre —
-- ya no dependen de un `athlete_id` en común.
--
-- `player_name` guarda el nombre tal cual vino en el CSV (para mostrar);
-- `player_key` guarda una versión normalizada (sin tildes, minúsculas,
-- espacios colapsados — mismo criterio que `normalizarNombre()` en
-- `smartEntityMatcher.ts`) que es la clave REAL de identidad: así "Juan
-- Pérez", "juan perez" y "JUAN PÉREZ" en tres CSVs distintos se reconocen
-- como la misma persona.
--
-- Debe correr DESPUÉS de migration_fase38_evaluaciones_rendimiento.sql
-- (y de fase39, si ya la corriste) — si `performance_evaluations` todavía
-- no existe, corré primero esa.

alter table performance_evaluations drop constraint if exists performance_evaluations_athlete_id_fkey;
alter table performance_evaluations drop constraint if exists performance_evaluations_athlete_eval_fecha_key;
drop index if exists performance_evaluations_athlete_id_idx;
alter table performance_evaluations drop column if exists athlete_id;

alter table performance_evaluations add column if not exists player_name text;
alter table performance_evaluations add column if not exists player_key text;

-- No hace falta backfill de filas viejas: si llegaste hasta acá sin datos
-- reales todavía (fase 38/39 recién creadas), esta tabla está vacía.
alter table performance_evaluations alter column player_name set not null;
alter table performance_evaluations alter column player_key set not null;

create index if not exists performance_evaluations_player_key_idx on performance_evaluations (player_key);

alter table performance_evaluations
  add constraint performance_evaluations_player_eval_fecha_category_key
  unique (player_key, evaluation_name, fecha, category_id);
