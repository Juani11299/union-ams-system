-- =============================================================================
-- Fase 34 — Módulo de Análisis de Video y Tagging Inteligente (estilo AURE
-- Sports): dos tablas nuevas, `video_matches` (un partido/entrenamiento
-- filmado, con su link de video — VEO u otro) y `video_tags` (los eventos
-- marcados dentro de ese video, con el segundo exacto).
--
-- Nota de integración VEO (confirmado en producción, Fase 34.1): VEO
-- rechaza ser embebido en un iframe (X-Frame-Options/CSP) y no ofrece un
-- embed público con control programático de reproducción sin credenciales
-- de socio de la VEO API (OAuth, ver developer.veo.co.uk) — `video_url`
-- guarda el link tal cual lo pega el profe (VEO u otro); para links de VEO,
-- `VideoPlayerModule.tsx` no intenta un iframe (se probó y VEO lo bloquea),
-- usa un "Cronómetro Manual" sincronizado a mano mientras VEO se mira en
-- otra pestaña. El control total (velocidad, salto exacto) sólo aplica a
-- video servido directo (mp4/HLS propio). Ver comentario en `VideoPlayerModule.tsx`.
-- =============================================================================

create table if not exists video_matches (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references team_categories (id) on delete cascade,
  season_id uuid not null references seasons (id) on delete cascade,
  title text not null,
  video_url text not null,
  fecha date not null,
  created_at timestamptz not null default now()
);

create index if not exists video_matches_category_season_idx on video_matches (category_id, season_id);

create table if not exists video_tags (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references video_matches (id) on delete cascade,
  athlete_id uuid references athletes (id) on delete set null,
  tipo text not null,
  fase text not null,
  timestamp_segundos numeric not null check (timestamp_segundos >= 0),
  nota text,
  created_at timestamptz not null default now()
);

create index if not exists video_tags_match_id_idx on video_tags (match_id);
create index if not exists video_tags_athlete_id_idx on video_tags (athlete_id);

-- -----------------------------------------------------------------------------
-- Row Level Security — mismo patrón permisivo de desarrollo del resto del
-- esquema, con la política gemela para `authenticated` desde el arranque
-- (ver `migration_fase26_rls_authenticated.sql` — evita repetir ese bug acá).
-- -----------------------------------------------------------------------------
alter table video_matches enable row level security;
alter table video_tags enable row level security;

drop policy if exists "dev_open_access" on video_matches;
drop policy if exists "dev_open_access_authenticated" on video_matches;
create policy "dev_open_access" on video_matches for all to anon using (true) with check (true);
create policy "dev_open_access_authenticated" on video_matches for all to authenticated using (true) with check (true);

drop policy if exists "dev_open_access" on video_tags;
drop policy if exists "dev_open_access_authenticated" on video_tags;
create policy "dev_open_access" on video_tags for all to anon using (true) with check (true);
create policy "dev_open_access_authenticated" on video_tags for all to authenticated using (true) with check (true);
