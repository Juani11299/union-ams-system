-- =============================================================================
-- Fase 54 — Evaluaciones de Rendimiento visibles desde el link mágico del PF.
--
-- El link mágico por categoría (`/planificador?category=<id>&locked=true`) y el de
-- sólo lectura global ya dejan NAVEGAR a /evaluaciones (Fase 49), pero la base
-- respondía "permission denied for table dynamic_evaluations": esa tabla (Fase 44)
-- es sólo para el rol `authenticated` y quien abre el link no tiene sesión (rol
-- `anon`). Misma decisión y mismo mecanismo que `migration_fase43` con las
-- antropometrías.
--
-- Sólo se abre SELECT. `anon` sigue SIN poder insertar, actualizar ni borrar
-- (lo garantiza la base: no hay política de escritura para `anon`).
--
-- ⚠️ Alcance real: cualquiera que tenga la key `anon` del proyecto (va embebida en
-- el bundle público) puede leer la tabla por la API REST, no sólo quien tenga el
-- link — también un jugador técnico. Son datos de rendimiento/salud de juveniles.
-- Para volver a cerrarla basta correr el bloque REVERTIR.
-- (`performance_evaluations` ya es abierta a `anon` desde la Fase 38.)
--
-- Idempotente.
-- =============================================================================

grant select on public.dynamic_evaluations to anon;

drop policy if exists dynamic_evaluations_link_lectura_select on public.dynamic_evaluations;
create policy dynamic_evaluations_link_lectura_select on public.dynamic_evaluations
  for select to anon using (true);

-- ── REVERTIR (volver a "sólo Staff") ─────────────────────────────────────────
-- drop policy if exists dynamic_evaluations_link_lectura_select on public.dynamic_evaluations;
-- revoke all on public.dynamic_evaluations from anon;
