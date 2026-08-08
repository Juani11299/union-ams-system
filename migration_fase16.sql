-- =============================================================================
-- Fase 16 — Creador de Planillas Estéticas de Fuerza (formato europeo, editable
-- en vivo + exportable a PDF). Se persiste como un único JSONB en `session_plans`
-- (título, objetivos y el arreglo de bloques con sus ejercicios) en vez de
-- tablas normalizadas nuevas: es contenido de "hoja impresa" que el profe edita
-- como un todo, no datos que otras vistas necesiten consultar fila por fila.
--
-- Usa ALTER TABLE ... ADD COLUMN IF NOT EXISTS (no CREATE TABLE), misma lección
-- de Fases 8.1/9.1/9.2 — seguro de correr las veces que haga falta.
-- =============================================================================

alter table session_plans add column if not exists gym_sheet_data jsonb;
