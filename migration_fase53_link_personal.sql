-- =============================================================================
-- Fase 53 — Link personal del jugador: "Mis Evaluaciones" y "Mi Composición Corporal".
--
-- PROBLEMA DE PRIVACIDAD: los links mágicos actuales son por categoría y el jugador
-- elige su nombre de una lista ("¿Quién sos?"): no hay NINGUNA verificación de
-- identidad. Además `dynamic_evaluations` y `antropometrias` son datos de salud de
-- juveniles. Para que cada jugador vea SÓLO lo suyo hace falta un secreto por jugador.
--
-- SOLUCIÓN:
--  1) `athlete_links`: un token (uuid aleatorio) por jugador. La tabla es sólo para el
--     Staff (rol `authenticated`); `anon` NO tiene permisos → un jugador no puede listar
--     los tokens de sus compañeros (en cambio `athletes` sí es legible por `anon` y por
--     eso el token NO se guarda ahí).
--  2) `mi_perfil_atleta(athlete_id, token)`: función SECURITY DEFINER (corre con los
--     permisos del dueño, saltea RLS) que valida el token y devuelve ÚNICAMENTE las filas
--     de ese jugador. Es la única puerta de entrada para el rol `anon`: no se abren
--     políticas de lectura sobre las tablas de datos.
--  3) La función devuelve peso, % masa muscular y % masa adiposa — NO los pliegues.
--
-- Cruce jugador ↔ datos: por nombre normalizado (igual que el resto del módulo de
-- evaluaciones: sin tildes, minúsculas, palabras ordenadas — `player_key`). Un jugador
-- cargado en los archivos sólo con inicial ("Boissi S") no matchea; se resuelve
-- corrigiendo el nombre en la ficha del jugador.
--
-- ⚠️ NO TOCA `migration_fase43_antropometrias_lectura_link.sql` (SELECT de `anon` sobre
-- `antropometrias` para el link de sólo lectura del Staff). Mientras esa política exista,
-- cualquiera con la key pública del proyecto puede leer toda la tabla por la API REST,
-- también un jugador técnico. Si se quiere privacidad estricta de antropometrías, hay
-- que correr el bloque "REVERTIR" de esa migración.
--
-- Idempotente.
-- =============================================================================

create table if not exists public.athlete_links (
  athlete_id uuid primary key references public.athletes (id) on delete cascade,
  token      uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.athlete_links enable row level security;
revoke all on public.athlete_links from anon;
grant select, insert, update, delete on public.athlete_links to authenticated;

drop policy if exists athlete_links_staff_all on public.athlete_links;
create policy athlete_links_staff_all on public.athlete_links
  for all to authenticated using (true) with check (true);

-- Misma normalización que `normalizarNombre()` del front (smartEntityMatcher.ts):
-- minúsculas, sin tildes, sólo [a-z0-9], palabras ordenadas alfabéticamente.
create or replace function public.normalizar_nombre(t text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(string_agg(w, ' ' order by w collate "C"), '')
  from (
    select unnest(
      regexp_split_to_array(
        trim(regexp_replace(
          lower(translate(coalesce(t, ''),
            'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
            'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC')),
          '[^a-z0-9\s]', ' ', 'g')),
        '\s+')
    ) as w
  ) palabras
  where w <> ''
$$;

create or replace function public.mi_perfil_atleta(p_athlete_id uuid, p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_nombre text;
  v_key    text;
begin
  select a.nombre into v_nombre
  from public.athletes a
  join public.athlete_links l on l.athlete_id = a.id
  where a.id = p_athlete_id and l.token = p_token;

  -- Token inválido o jugador inexistente: no se revela nada (ni siquiera si el jugador existe).
  if v_nombre is null then
    return jsonb_build_object('ok', false);
  end if;

  v_key := public.normalizar_nombre(v_nombre);

  return jsonb_build_object(
    'ok', true,
    'nombre', v_nombre,
    'evaluaciones', coalesce((
      select jsonb_agg(jsonb_build_object('test_name', e.test_name, 'fecha', e.fecha, 'metrics', e.metrics, 'test_config', e.test_config) order by e.fecha)
      from public.dynamic_evaluations e
      where e.player_key = v_key
    ), '[]'::jsonb),
    -- CMJ importados con el panel viejo (tabla `performance_evaluations`).
    'legacy', coalesce((
      select jsonb_agg(jsonb_build_object('evaluation_name', p.evaluation_name, 'fecha', p.fecha, 'metrics', p.metrics, 'body_weight_kg', p.body_weight_kg) order by p.fecha)
      from public.performance_evaluations p
      where p.player_key = v_key
    ), '[]'::jsonb),
    'antropometrias', coalesce((
      select jsonb_agg(jsonb_build_object('fecha', m.fecha, 'peso', m.peso, 'masa_adiposa', m.masa_adiposa, 'masa_muscular', m.masa_muscular) order by m.fecha)
      from public.antropometrias m
      where m.player_key = v_key
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.mi_perfil_atleta(uuid, uuid) from public;
grant execute on function public.mi_perfil_atleta(uuid, uuid) to anon, authenticated;
