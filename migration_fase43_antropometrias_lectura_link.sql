-- =============================================================================
-- Fase 43 — Antropometrías visibles desde el link de SÓLO LECTURA (`?locked=true`).
--
-- Decisión explícita del club: quien abre el link global de sólo lectura (sin
-- sesión de Staff → rol Postgres `anon`) también puede VER las antropometrías.
-- Antes (`migration_fase42_antropometrias.sql`) `anon` no tenía acceso y el
-- link mostraba "permission denied for table antropometrias".
--
-- Sólo se abre SELECT. `anon` sigue SIN poder insertar, actualizar ni borrar:
-- eso lo garantiza la base (no hay política de escritura para `anon`), no sólo
-- la UI. Importar / borrar sigue siendo exclusivo del Staff autenticado.
--
-- ⚠️ Alcance real: esta política deja leer la tabla a cualquiera que tenga la
-- key `anon` del proyecto (va embebida en el bundle público de la app), no
-- sólo a quien tenga el link. Es la misma exposición que ya tienen el resto de
-- las tablas del club. Son datos de salud de juveniles: para volver a cerrarla
-- basta correr el bloque REVERTIR de abajo.
--
-- Idempotente.
-- =============================================================================

grant select on public.antropometrias to anon;

drop policy if exists antropometrias_link_lectura_select on public.antropometrias;
create policy antropometrias_link_lectura_select on public.antropometrias
  for select to anon using (true);

-- ── REVERTIR (volver a "sólo Staff") ─────────────────────────────────────────
-- drop policy if exists antropometrias_link_lectura_select on public.antropometrias;
-- revoke all on public.antropometrias from anon;
