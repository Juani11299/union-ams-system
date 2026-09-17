-- Fase 41 — la categoría de una Evaluación de Rendimiento ya NO es
-- `category_id` (FK a la tabla real `team_categories`): se toma tal cual
-- viene en la columna "Categoria"/"Category"/"Division" del propio CSV
-- (texto libre), con el mismo criterio que Fase 40 aplicó al nombre del
-- jugador. Así el dashboard de Evaluaciones queda 100% desacoplado del
-- resto del club: no consulta ni atletas ni categorías reales, sólo lo que
-- vino en el archivo.
--
-- `category_label` guarda ese texto (o 'Sin categoría' si el CSV no trae
-- ninguna columna reconocible) — es la clave real de agrupación del filtro
-- "AGRUPAR POR" en el dashboard, poblado únicamente con valores que salen
-- del propio CSV.
--
-- `season_id` NO se toca (sigue siendo el selector local de temporada del
-- panel, Fase 39 — no fue parte de este pedido, y no depende de atletas ni
-- de matching contra nada).
--
-- Debe correr DESPUÉS de migration_fase40_jugador_por_nombre_csv.sql.

alter table performance_evaluations drop constraint if exists performance_evaluations_player_eval_fecha_category_key;
alter table performance_evaluations drop constraint if exists performance_evaluations_category_id_fkey;
drop index if exists performance_evaluations_season_category_idx;
alter table performance_evaluations drop column if exists category_id;

alter table performance_evaluations add column if not exists category_label text not null default 'Sin categoría';
alter table performance_evaluations alter column category_label drop default;

create index if not exists performance_evaluations_category_label_idx on performance_evaluations (category_label);
create index if not exists performance_evaluations_season_idx on performance_evaluations (season_id);

alter table performance_evaluations
  add constraint performance_evaluations_player_eval_fecha_category_key
  unique (player_key, evaluation_name, fecha, category_label);
