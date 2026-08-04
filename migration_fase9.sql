-- =============================================================================
-- Fase 9 — agrega el comentario de dolor opcional al wellness diario.
--
-- Usa ALTER TABLE ... ADD COLUMN IF NOT EXISTS (no CREATE TABLE IF NOT EXISTS)
-- a propósito: la lección de Fase 8.1 fue que un CREATE TABLE IF NOT EXISTS es
-- un no-op si la tabla ya existe, así que nunca agrega columnas nuevas. Este
-- archivo es seguro de correr las veces que haga falta.
-- =============================================================================

alter table wellness_entries add column if not exists comentarios_dolor text;
