-- =============================================================================
-- Fase 21 — Upsert diario de Wellness/RPE + Searchable Select en los
-- formularios públicos.
--
-- Hasta ahora `wellness_entries` y `session_executions` sólo se escribían con
-- `insert()`: si un jugador reenviaba el formulario el mismo día (typeo,
-- "mejor pongo de nuevo"), quedaban DOS filas para el mismo día y las
-- funciones de cálculo (calcularSRpeSemana, calcularCargaEjecutadaReal,
-- calcularAcwr, etc.) las sumaban como si fueran dos sesiones distintas,
-- inflando la carga real del jugador. La regla de negocio correcta es "el
-- último envío del día gana" (keep the latest), no "sumar todo lo que llega".
--
-- PASO 1 — Limpieza de duplicados existentes: si algún jugador ya reenvió el
-- formulario el mismo día antes de esta fase, hay que borrar el/los
-- duplicados ANTES de poder crear la unique constraint (si no, el ADD
-- CONSTRAINT falla). Ninguna de las dos tablas tiene columna `created_at`
-- (a diferencia de `gym_external_loads`), así que no hay forma de saber con
-- certeza cuál fila es cronológicamente "la última" — como desempate estable
-- se conserva la de mayor `id`. Es una aproximación arbitraria (el UUID no
-- correlaciona con el orden de inserción), pero sólo importa para el puñado
-- de duplicados históricos que pudieran existir; de acá en adelante el
-- upsert del frontend garantiza el orden real.
--
-- PASO 2 — Unique constraint (athlete_id, fecha) en ambas tablas.
--
-- PASO 3 (ya en el frontend, `useAppStore.ts`) — `submitWellness` y
-- `submitSessionLoad` pasan de `.insert()` a
-- `.upsert(row, { onConflict: 'athlete_id,fecha' })`, mismo patrón que ya
-- usa `gym_external_loads` (Fase 17). OJO: correr este SQL en Supabase ANTES
-- de desplegar el código nuevo — sin la constraint, el `.upsert()` con
-- `onConflict` falla (Postgres exige que el conflict target matchee una
-- constraint existente, incluso si no hay ningún conflicto real todavía).
-- =============================================================================

-- --- wellness_entries ---------------------------------------------------------
delete from wellness_entries a using wellness_entries b
where a.athlete_id = b.athlete_id
  and a.fecha = b.fecha
  and a.id < b.id;

alter table wellness_entries
  drop constraint if exists wellness_entries_athlete_id_fecha_key;
alter table wellness_entries
  add constraint wellness_entries_athlete_id_fecha_key unique (athlete_id, fecha);

-- --- session_executions --------------------------------------------------------
delete from session_executions a using session_executions b
where a.athlete_id = b.athlete_id
  and a.fecha = b.fecha
  and a.id < b.id;

alter table session_executions
  drop constraint if exists session_executions_athlete_id_fecha_key;
alter table session_executions
  add constraint session_executions_athlete_id_fecha_key unique (athlete_id, fecha);
