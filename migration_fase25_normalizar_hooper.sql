-- =============================================================================
-- Fase 25 — Normalización de escalas del Índice de Hooper (Wellness).
--
-- Hasta ahora, en `wellness_entries`, `sueno` se guardaba con 5 = óptimo
-- (buena calidad de sueño) pero `dolor_muscular`, `estres` y `fatiga` se
-- guardaban AL REVÉS: 5 = peor síntoma (mucho dolor / mucho estrés / mucha
-- fatiga). El código (`calcularReadiness`, `calcularWellnessScore20`)
-- compensaba esto invirtiendo esos 3 campos (`6 - x`) antes de sumar, así
-- que el Readiness final YA daba un número coherente (20/20 = jugador al
-- 100%) — pero el dato CRUDO era ilegible: un jugador con dolor muscular
-- severo cargaba "5", el mismo número que alguien con excelente calidad de
-- sueño. Eso hacía confuso tanto el slider (arrastrar a la derecha = mejor
-- para sueño, pero = peor para dolor/estrés/fatiga) como el desglose crudo
-- que ahora se muestra en la tarjeta del jugador (Fase 25, punto 2).
--
-- Esta migración da vuelta los 3 campos para que las 4 variables usen la
-- MISMA convención (5 = óptimo, 1 = pésimo) también en la base de datos, y
-- el código deja de invertir nada (ver `calcularReadiness`/
-- `calcularWellnessScore20`, ya actualizadas).
--
-- IMPORTANTE — orden de despliegue: correr este SQL en Supabase A LA VEZ que
-- se despliega el código de Fase 25 (no antes, no mucho después). Si el
-- código nuevo ya está en producción escribiendo con la convención nueva y
-- recién después se corre esta migración, este UPDATE va a dar vuelta
-- también las filas YA correctas, rompiéndolas.
-- =============================================================================

update wellness_entries
set
  dolor_muscular = 6 - dolor_muscular,
  estres = 6 - estres,
  fatiga = 6 - fatiga;
