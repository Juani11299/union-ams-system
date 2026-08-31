-- =============================================================================
-- Fase 34.2 ("Nivel Champions") — agrega Zona de la Cancha a los tags de
-- video ya existentes (`video_tags`, ver migration_fase34_video_analysis.sql).
-- `zona_banda`/`zona_carril` son NULLABLES a propósito: los tags cargados
-- antes de esta fase, o los que el profe deja sin ubicar, quedan con
-- `null` en vez de forzar una zona inventada — ver `ZonaCancha` en
-- `src/types/videoAnalysis.ts` (matriz 6x3: 6 bandas longitudinales ×
-- 3 carriles).
--
-- IMPORTANTE — orden de migraciones: correr ESTE archivo DESPUÉS de
-- `migration_fase34_video_analysis.sql` (que crea la tabla `video_tags`
-- en sí). `add column if not exists` hace que sea seguro de re-correr si
-- por error se ejecuta dos veces.
-- =============================================================================

alter table video_tags add column if not exists zona_banda text;
alter table video_tags add column if not exists zona_carril text;
