-- =============================================================================
-- Fase 11 — Integración de flujos tácticos, competitivos y médicos.
--
-- a) daily_tasks: `tacboard_data` (JSONB, editor táctico 2D) + columnas de
--    objetivo GPS (Físico de Campo). Todas nullable — sólo se completan al usar
--    el modal de detalle correspondiente, no en el alta de la tarea.
-- b) session_executions: índice único parcial (athlete_id, plan_id) para poder
--    hacer upsert desde "Día de Partido" (Registro de Minutos) sin duplicar fila
--    por jugador — mismo patrón que `external_loads (plan_id, athlete_id)`. Es
--    parcial (where plan_id is not null) porque el RPE cargado sin sesión
--    planificada (plan_id null, ya permitido desde Fase 6) puede seguir teniendo
--    varias filas sueltas para un mismo atleta.
-- c) athletes: se reutiliza `estado_salud` (ya existente desde Fase 4, con
--    `observaciones_medicas` ya como campo de notas) para el concepto de
--    "Estado Médico" que pide esta fase, en vez de crear una columna paralela
--    con el mismo propósito — se migran sus 3 valores a la terminología nueva.
-- =============================================================================

-- a) TacBoard + objetivos GPS en daily_tasks
alter table daily_tasks add column if not exists tacboard_data jsonb;
alter table daily_tasks add column if not exists distancia_objetivo numeric;
alter table daily_tasks add column if not exists hsr_objetivo numeric;
alter table daily_tasks add column if not exists aceleraciones_objetivo integer;
alter table daily_tasks add column if not exists desaceleraciones_objetivo integer;

-- b) upsert target para "Registro de Minutos" del Match Day
create unique index if not exists session_executions_athlete_plan_unique
  on session_executions (athlete_id, plan_id)
  where plan_id is not null;

-- c) Estado Médico — reusa athletes.estado_salud con nueva terminología
update athletes set estado_salud = 'Activo' where estado_salud = 'apto';
update athletes set estado_salud = 'Rehabilitación' where estado_salud = 'restringido';
update athletes set estado_salud = 'Baja Médica' where estado_salud = 'lesionado';

alter table athletes drop constraint if exists athletes_estado_salud_check;
alter table athletes add constraint athletes_estado_salud_check
  check (estado_salud in ('Activo', 'Rehabilitación', 'Baja Médica'));

alter table athletes alter column estado_salud set default 'Activo';
