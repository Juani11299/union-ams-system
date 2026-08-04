-- =============================================================================
-- Fase 9.2 — separa "Volumen" (lo carga el profe) de "Percepción" (RPE, lo
-- carga el jugador). Agrega a `session_plans` el RPE esperado (pre-sesión) y
-- el tiempo total de trabajo real (post-sesión), usados para calcular el sRPE
-- real de cada jugador dinámicamente en el dashboard.
--
-- Usa ALTER TABLE ... ADD COLUMN IF NOT EXISTS (no CREATE TABLE), misma
-- lección de Fase 8.1/9.1 — seguro de correr las veces que haga falta.
-- =============================================================================

alter table session_plans add column if not exists rpe_esperado numeric;
alter table session_plans add column if not exists duracion_real_min numeric;
