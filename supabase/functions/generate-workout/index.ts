// Edge Function (Fase 17.5) — "Cerebro SOMA" real: recibe el pedido en texto
// libre del profe + el system prompt metodológico (`src/utils/ai-methodology.ts`,
// que el frontend manda tal cual) y le pide a Claude que genere la planilla.
// Corre en Deno/Supabase, nunca en el browser, así el ANTHROPIC_API_KEY nunca
// se expone en el bundle de Vite.
//
// Invocar localmente:
//   1. `supabase start`
//   2. `supabase secrets set --env-file supabase/.env.local ANTHROPIC_API_KEY=sk-ant-...`
//      (o exportarla antes de `supabase functions serve`)
//   3. curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-workout' \
//        --header 'Authorization: Bearer <anon-key>' \
//        --header 'Content-Type: application/json' \
//        --data '{"categoryId":"...","categoriaNombre":"5ta División","systemPrompt":"...","userPrompt":"Armame un plan para MD-4 fuerza máxima"}'

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-latest";
const ANTHROPIC_VERSION = "2023-06-01";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateWorkoutRequest {
  categoryId: string;
  categoriaNombre: string;
  systemPrompt: string;
  userPrompt: string;
}

interface AnthropicEjercicio {
  nombre: string;
  series: string;
  repeticiones: string;
  cargaKg: string;
  descanso: string;
  notas: string;
}

interface AnthropicBloque {
  titulo: string;
  ejercicios: AnthropicEjercicio[];
}

interface AnthropicGymSheetInput {
  titulo: string;
  objetivos: string;
  bloques: AnthropicBloque[];
}

/**
 * Tool que fuerza a Claude a devolver ESTRICTAMENTE la forma de `GymSheetData`
 * (sin los `id`, que se completan acá abajo). La técnica recomendada por
 * Anthropic para output estructurado es "forced tool use" vía `tool_choice`
 * — mucho más confiable que pedir "respondé sólo con JSON" en el prompt y
 * esperar que Claude no lo envuelva en texto o en un bloque ```json.
 */
const GYM_SHEET_TOOL = {
  name: "generar_planilla_gimnasio",
  description:
    "Devuelve la planilla de gimnasio generada, respetando estrictamente la matriz LTAD, la nomenclatura de microciclo y la isometría de Natera del system prompt.",
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Título de la planilla" },
      objetivos: { type: "string", description: "Objetivos de la sesión" },
      bloques: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string", description: 'Ej. "Activación", "Bloque Principal", "Accesorios"' },
            ejercicios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  series: { type: "string" },
                  repeticiones: { type: "string" },
                  cargaKg: { type: "string", description: 'Kg, %RM o "Peso corporal" según la categoría' },
                  descanso: { type: "string" },
                  notas: {
                    type: "string",
                    description: "Tipo de isometría (Overcoming/Yielding) y racional breve",
                  },
                },
                required: ["nombre", "series", "repeticiones", "cargaKg", "descanso", "notas"],
              },
            },
          },
          required: ["titulo", "ejercicios"],
        },
      },
    },
    required: ["titulo", "objetivos", "bloques"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("Falta configurar el secret ANTHROPIC_API_KEY en el proyecto de Supabase.");
    }

    const { categoryId, categoriaNombre, systemPrompt, userPrompt } =
      (await req.json()) as Partial<GenerateWorkoutRequest>;

    if (!systemPrompt?.trim() || !userPrompt?.trim()) {
      return new Response(JSON.stringify({ error: "systemPrompt y userPrompt son obligatorios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Categoría: ${categoriaNombre ?? "sin especificar"} (id: ${categoryId ?? "?"}).\n\nPedido del profe: ${userPrompt}`,
          },
        ],
        tools: [GYM_SHEET_TOOL],
        tool_choice: { type: "tool", name: GYM_SHEET_TOOL.name },
      }),
    });

    if (!anthropicRes.ok) {
      const detalle = await anthropicRes.text();
      throw new Error(`Anthropic API respondió ${anthropicRes.status}: ${detalle}`);
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content as Array<{ type: string; input?: unknown }> | undefined)?.find(
      (block) => block.type === "tool_use",
    );
    if (!toolUse) {
      throw new Error("Claude no devolvió la herramienta esperada — no se pudo extraer la planilla.");
    }

    const plan = toolUse.input as AnthropicGymSheetInput;

    // Se completan acá los `id` (bookkeeping interno del editor React, no
    // algo que tenga sentido pedirle al modelo) para que la respuesta
    // matchee EXACTO la interfaz `GymSheetData` del frontend.
    const gymSheetData = {
      titulo: plan.titulo,
      objetivos: plan.objetivos,
      bloques: plan.bloques.map((bloque) => ({
        id: crypto.randomUUID(),
        titulo: bloque.titulo,
        ejercicios: bloque.ejercicios.map((ejercicio) => ({
          id: crypto.randomUUID(),
          ...ejercicio,
        })),
      })),
    };

    return new Response(JSON.stringify(gymSheetData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-workout] error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido generando el plan.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
