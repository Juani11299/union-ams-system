// Edge Function (Fase 34.3) — Análisis Táctico por Visión: recibe UN
// fotograma (base64) capturado del reproductor de video y le pide a Claude
// (Anthropic Messages API, con soporte de imágenes) una lectura táctica de
// esa escena puntual. Corre en Deno/Supabase — igual que `generate-workout`
// (Fase 17.5) — para que el ANTHROPIC_API_KEY nunca llegue al bundle de
// Vite. Reusa el MISMO secret que esa función: si ya lo configuraste para
// el Planificador IA, no hace falta cargarlo de nuevo acá.
//
// Limitación real, no maquillada: Claude analiza UN fotograma ESTÁTICO, no
// el video en movimiento — no hay tracking de jugadores ni pelota entre
// frames, así que no puede determinar con certeza un tipo de evento (ej.
// "gol" no se distingue de una jugada cortada en una sola imagen). Por eso
// esta función sólo devuelve fase/zona/lectura/alerta — el tipo de evento
// lo sigue eligiendo el profe a mano en `LiveTaggingView`, que muestra este
// análisis como SUGERENCIA a revisar, nunca crea un tag solo.
//
// Invocar localmente:
//   1. `supabase start`
//   2. `supabase secrets set --env-file supabase/.env.local ANTHROPIC_API_KEY=sk-ant-...`
//      (mismo secret que usa `generate-workout` — si ya lo configuraste ahí, no hace falta repetirlo)
//   3. curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analizar-frame-ia' \
//        --header 'Authorization: Bearer <anon-key>' \
//        --header 'Content-Type: application/json' \
//        --data '{"imageBase64":"...","mimeType":"image/jpeg","timestampSegundos":42}'

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-latest";
const ANTHROPIC_VERSION = "2023-06-01";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mismos valores que `FaseJuego`/`BandaCancha`/`CarrilCancha` del frontend
// (`src/types/videoAnalysis.ts`) — hardcodeados acá porque las Edge
// Functions corren en Deno, aisladas del resto del bundle de Vite/TS.
const FASES_VALIDAS = ["ataque_organizado", "defensa", "transicion_ofensiva", "transicion_defensiva", "abp"];
const BANDAS_VALIDAS = [
  "iniciacion_propia",
  "creacion_propia",
  "finalizacion_propia",
  "finalizacion_rival",
  "creacion_rival",
  "iniciacion_rival",
];
const CARRILES_VALIDOS = ["izquierdo", "central", "derecho"];

interface AnalizarFrameRequest {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png";
  timestampSegundos: number;
}

const SYSTEM_PROMPT = `Sos un analista táctico de fútbol de élite ayudando a un cuerpo técnico a etiquetar video de partidos y entrenamientos.

Se te muestra UN SOLO FOTOGRAMA estático del video, no el video en movimiento. Esto es una limitación real: no podés ver hacia dónde se mueve la pelota o los jugadores, sólo la disposición instantánea de esa imagen. Si la foto no muestra una jugada de fútbol clara, o no se distingue lo suficiente (mala calidad, cámara muy lejos, etc.), decilo explícitamente en la descripción y usá una confianza baja (0.1 a 0.3) — nunca inventes una lectura táctica segura de una imagen que no la sostiene.

Devolvé tu análisis usando la herramienta "analizar_jugada_tactica":
- fase: la fase de juego que mejor describe el fotograma, ELEGIDA ESTRICTAMENTE de la lista dada — no inventes otras etiquetas.
- zonaBanda / zonaCarril: la zona de la cancha (matriz de 6 bandas x 3 carriles) donde ocurre la acción principal, ELEGIDAS ESTRICTAMENTE de las listas dadas.
- descripcion: 1 o 2 frases de lectura analítica de lo que se ve (posicionamiento, líneas, presión, superioridad numérica).
- alertaTactica: una virtud o error puntual detectado en la imagen, o "Sin alertas destacables" si no hay nada relevante.
- confianza: número de 0 a 1, honesto sobre cuánto se puede confiar en esta lectura viniendo de un solo fotograma sin contexto de movimiento.`;

const ANALISIS_TOOL = {
  name: "analizar_jugada_tactica",
  description: "Devuelve la lectura táctica estructurada de un fotograma de video de fútbol.",
  input_schema: {
    type: "object",
    properties: {
      fase: { type: "string", enum: FASES_VALIDAS, description: "Fase de juego detectada en el fotograma" },
      zonaBanda: { type: "string", enum: BANDAS_VALIDAS, description: "Banda longitudinal de la matriz 6x3" },
      zonaCarril: { type: "string", enum: CARRILES_VALIDOS, description: "Carril de la matriz 6x3" },
      descripcion: { type: "string", description: "Lectura analítica breve de la escena (1-2 frases)" },
      alertaTactica: { type: "string", description: "Virtud o error táctico puntual detectado" },
      confianza: { type: "number", description: "0 a 1 — qué tan confiable es esta lectura desde un solo fotograma" },
    },
    required: ["fase", "zonaBanda", "zonaCarril", "descripcion", "alertaTactica", "confianza"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error(
        "Falta configurar el secret ANTHROPIC_API_KEY en el proyecto de Supabase (Project Settings → Edge Functions → Secrets).",
      );
    }

    const { imageBase64, mimeType, timestampSegundos } = (await req.json()) as Partial<AnalizarFrameRequest>;

    if (!imageBase64?.trim()) {
      return new Response(JSON.stringify({ error: "Falta el fotograma (imageBase64) a analizar." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const media_type = mimeType === "image/png" ? "image/png" : "image/jpeg";

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type, data: imageBase64 } },
              {
                type: "text",
                text: `Fotograma capturado en el segundo ${timestampSegundos ?? "?"} del video. Analizalo con la herramienta.`,
              },
            ],
          },
        ],
        tools: [ANALISIS_TOOL],
        tool_choice: { type: "tool", name: ANALISIS_TOOL.name },
      }),
    });

    if (!anthropicRes.ok) {
      const detalle = await anthropicRes.text();
      // Anthropic no distingue "sin saldo" con un tipo propio — llega como
      // rate_limit_error igual que un límite de frecuencia, así que ese
      // mensaje ya cubre ambos casos del lado del profe.
      let mensaje = `Anthropic API respondió ${anthropicRes.status}.`;
      try {
        const cuerpo = JSON.parse(detalle);
        const tipo = cuerpo?.error?.type;
        if (tipo === "authentication_error") mensaje = "La API key de Anthropic no es válida — revisá el secret ANTHROPIC_API_KEY.";
        else if (tipo === "permission_error") mensaje = "La API key de Anthropic no tiene permiso para este modelo.";
        else if (tipo === "rate_limit_error") mensaje = "Se alcanzó el límite de uso de la API de Anthropic (rate limit o saldo agotado) — probá de nuevo en un momento.";
        else if (tipo === "overloaded_error") mensaje = "Los servidores de Anthropic están sobrecargados — probá de nuevo en un momento.";
        else if (cuerpo?.error?.message) mensaje = cuerpo.error.message;
      } catch {
        // detalle no era JSON — se usa el mensaje genérico de arriba.
      }
      throw new Error(mensaje);
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content as Array<{ type: string; input?: unknown }> | undefined)?.find(
      (block) => block.type === "tool_use",
    );
    if (!toolUse) {
      throw new Error("Claude no devolvió la herramienta esperada — no se pudo extraer el análisis.");
    }

    return new Response(JSON.stringify(toolUse.input), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[analizar-frame-ia] error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido analizando el fotograma.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
