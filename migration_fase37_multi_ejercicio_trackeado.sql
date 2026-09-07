-- Fase 37 — permite marcar MÁS DE UN ejercicio 🎯 por planilla de Gimnasio
-- (antes, `GymSheetEditor.marcarTrackeado` forzaba que sólo hubiera uno en
-- toda la planilla). La Terminal de Fuerza ahora pide el Top Set de cada
-- ejercicio marcado, así que un mismo jugador puede tener más de un
-- registro por sesión de gimnasio — uno por ejercicio.
--
-- Esto exige ampliar la unique constraint: antes era (athlete_id,
-- session_id) — "un jugador, un registro por sesión"; ahora es (athlete_id,
-- session_id, exercise_name) — "un jugador, un registro por sesión POR
-- EJERCICIO". El nombre de la constraint vieja es el autogenerado por
-- Postgres en migration_fase17.sql (create table ... unique(athlete_id,
-- session_id), sin nombre explícito).

alter table gym_external_loads
  drop constraint if exists gym_external_loads_athlete_id_session_id_key;

alter table gym_external_loads
  add constraint gym_external_loads_athlete_session_exercise_key
  unique (athlete_id, session_id, exercise_name);
