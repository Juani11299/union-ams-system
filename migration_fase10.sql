-- =============================================================================
-- Fase 10 — "PLANIFICADOR" maestro. Fusiona Microciclo + Fuerza en un solo
-- módulo con divulgación progresiva: Microciclo -> Día (session_plans, ya
-- existe) -> Tareas Generales (daily_tasks, tabla nueva) -> Detalle
-- (strength_blocks para Gimnasio, ya existe — no se toca en esta fase).
-- =============================================================================

create table if not exists daily_tasks (
  id uuid primary key default gen_random_uuid(),
  session_plan_id uuid not null references session_plans (id) on delete cascade,
  tipo text not null check (tipo in ('Físico de Campo', 'Técnico-Táctico', 'Gimnasio')),
  objetivo text not null,
  duracion_min numeric not null,
  rpe_esperado numeric not null check (rpe_esperado between 1 and 10),
  -- Densidad (relación trabajo:pausa) y carga cognitiva (complejidad decisional):
  -- dos variables de control de carga a nivel general de la tarea, más allá de
  -- RPE/duración — ver src/types/dailyTask.ts para la justificación completa.
  densidad text,
  carga_cognitiva text check (carga_cognitiva in ('Baja', 'Media', 'Alta')),
  orden integer not null default 0
);

create index if not exists daily_tasks_session_plan_id_idx on daily_tasks (session_plan_id);

alter table daily_tasks enable row level security;
drop policy if exists "dev_open_access" on daily_tasks;
create policy "dev_open_access" on daily_tasks for all to anon using (true) with check (true);
