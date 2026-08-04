-- =============================================================================
-- Fase 10.1 — agrega "Enfoque" (título corto y específico de la tarea, ej.
-- "Ataque", "COD", "Empujes") a `daily_tasks`. Es lo primero que se lee en la
-- vista semanal del PLANIFICADOR.
--
-- Idempotente (ALTER TABLE ... ADD COLUMN IF NOT EXISTS), mismo patrón usado
-- en toda la sesión. Se agrega nullable primero, se rellena cualquier fila
-- existente sin enfoque con el objetivo como fallback, y recién ahí se marca
-- NOT NULL — así es seguro correrlo tanto si `daily_tasks` está vacía (caso
-- esperado) como si ya tiene filas cargadas.
-- =============================================================================

alter table daily_tasks add column if not exists enfoque text;

update daily_tasks set enfoque = objetivo where enfoque is null;

alter table daily_tasks alter column enfoque set not null;
