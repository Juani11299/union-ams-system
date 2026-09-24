-- =============================================================================
-- Fase 44 — Antropometrías en Supabase (antes: IndexedDB local, "silos").
--
-- Son datos de salud de juveniles (composición corporal): a diferencia del
-- resto de las tablas del proyecto (política histórica `dev_open_access` para
-- `anon`), ESTA tabla queda cerrada al público. Sólo el Staff logueado (rol
-- Postgres `authenticated`, Supabase Auth — Fase 18) puede leer/escribir.
-- El rol `anon` no tiene ni permisos de tabla ni política: un visitante sin
-- sesión (incluido el modo `locked=true` de Fase 32/33) recibe 0 filas / error.
--
-- Idempotente: se puede correr más de una vez en el SQL Editor.
-- =============================================================================

create table if not exists public.antropometrias (
  id                 uuid primary key default gen_random_uuid(),
  player_name        text        not null,
  -- Nombre normalizado (sin tildes/mayúsculas/orden) para matchear al mismo
  -- jugador entre archivos distintos del nutricionista.
  player_key         text        not null,
  category_label     text        not null default 'Sin categoría',
  fecha              date        not null,
  peso               numeric,
  masa_adiposa       numeric,
  masa_muscular      numeric,
  sumatoria_pliegues numeric,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Habilita `upsert(..., { onConflict: 'player_key,fecha,category_label' })`:
  -- re-importar el archivo corregido actualiza en vez de duplicar.
  constraint antropometrias_player_fecha_categoria_key
    unique (player_key, fecha, category_label)
);

create index if not exists antropometrias_player_key_idx on public.antropometrias (player_key);
create index if not exists antropometrias_fecha_idx on public.antropometrias (fecha);

-- Mantiene updated_at en cada upsert que pisa una fila existente.
create or replace function public.antropometrias_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists antropometrias_updated_at on public.antropometrias;
create trigger antropometrias_updated_at
  before update on public.antropometrias
  for each row execute function public.antropometrias_set_updated_at();

-- ── Seguridad ────────────────────────────────────────────────────────────────
alter table public.antropometrias enable row level security;

-- Defensa en profundidad: además de no tener política, `anon` pierde los
-- privilegios de tabla que Supabase otorga por defecto en `public`.
revoke all on public.antropometrias from anon;
grant select, insert, update, delete on public.antropometrias to authenticated;

drop policy if exists antropometrias_staff_select on public.antropometrias;
drop policy if exists antropometrias_staff_insert on public.antropometrias;
drop policy if exists antropometrias_staff_update on public.antropometrias;
drop policy if exists antropometrias_staff_delete on public.antropometrias;

create policy antropometrias_staff_select on public.antropometrias
  for select to authenticated using (true);

create policy antropometrias_staff_insert on public.antropometrias
  for insert to authenticated with check (true);

create policy antropometrias_staff_update on public.antropometrias
  for update to authenticated using (true) with check (true);

create policy antropometrias_staff_delete on public.antropometrias
  for delete to authenticated using (true);
