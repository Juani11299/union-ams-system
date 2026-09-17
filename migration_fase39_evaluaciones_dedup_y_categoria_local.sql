-- Fase 39 — dos ajustes al módulo de Evaluaciones de Rendimiento (Fase 38):
--
-- 1. Anti-duplicados: si el profe sube el mismo CSV dos veces (o dos CSVs
--    que se superponen — mismo jugador, misma evaluación, misma fecha), no
--    tiene que crear una fila nueva — tiene que ACTUALIZAR la existente.
--    La identidad real de una evaluación es (jugador, tipo de evaluación,
--    fecha) — a propósito SIN category_id: un jugador es el mismo dato
--    puntual sin importar bajo qué categoría se lo haya importado esa vez.
--
-- 2. El filtro de categoría del dashboard pasó a ser 100% local (estado del
--    componente, no `activeCategoryId` global) — no necesita cambio de
--    esquema, sólo se documenta acá porque es la razón de este archivo.

alter table performance_evaluations
  add constraint performance_evaluations_athlete_eval_fecha_key
  unique (athlete_id, evaluation_name, fecha);
