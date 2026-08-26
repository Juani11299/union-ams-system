-- =============================================================================
-- Fase 26 — fix: "Cannot coerce the result to a single JSON object" al guardar
-- desde el Planificador (y cualquier otra escritura) una vez logueado como
-- Staff (Fase 18, login real con Supabase Auth).
--
-- CAUSA RAÍZ (confirmada por auditoría, no por prueba y error): TODAS las
-- políticas RLS del proyecto, desde `database_schema.sql` en adelante, se
-- crearon como `for all to anon using (true) with check (true)` — es decir,
-- sólo el rol `anon` (peticiones sin sesión) tenía permiso de leer/escribir.
-- Eso nunca fue un problema porque, hasta Fase 18, la app SIEMPRE pegaba
-- contra Supabase sin login (rol `anon`).
--
-- Desde que el Staff inicia sesión real (Fase 18), sus peticiones viajan con
-- el rol de Postgres `authenticated`, no `anon` — y como ninguna política le
-- daba permiso a ese rol, RLS bloquea la fila silenciosamente. Un
-- `.update(...).select().single()` que antes devolvía 1 fila ahora devuelve
-- 0 (bloqueadas por RLS), y PostgREST tira exactamente
-- "Cannot coerce the result to a single JSON object" — que el store atrapa
-- como error genérico y dispara el aviso de "Sin conexión con Supabase".
--
-- Se descartaron las otras dos hipótesis (array+`.single()` mal encadenado,
-- doble `JSON.stringify` en columnas JSONB) por auditoría directa del código:
-- ningún insert/upsert masivo del store encadena `.single()`, y no hay
-- ningún `JSON.stringify` en el camino de escritura hacia Supabase (sólo se
-- usa para el portapapeles de "Copiar Planilla" y drag-and-drop, ninguno de
-- los dos toca la red).
--
-- FIX: agregar, en cada tabla con RLS habilitada, una política gemela que le
-- dé al rol `authenticated` el mismo acceso que ya tenía `anon` — se agrega,
-- no se reemplaza, para no romper los flujos públicos sin login
-- (`/ingreso-rapido`, `/terminal-fuerza`) que siguen pegando como `anon`.
-- Mismo nivel de permisividad ya documentado como "para dev, endurecer antes
-- de producción" desde Fase 4 — no se está bajando la seguridad, se está
-- extendiendo la MISMA política ya existente al rol que faltaba.
-- =============================================================================

create policy "dev_open_access_authenticated" on clubs for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on seasons for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on team_categories for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on athletes for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on rosters for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on session_plans for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on session_executions for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on wellness_entries for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on external_loads for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on daily_tasks for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on gym_external_loads for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on strength_blocks for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on physical_tests for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on strength_templates for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on strength_template_exercises for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on strength_assignments for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on strength_assignment_athletes for all to authenticated using (true) with check (true);
create policy "dev_open_access_authenticated" on complementary_plans for all to authenticated using (true) with check (true);
