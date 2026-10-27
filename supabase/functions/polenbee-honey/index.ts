import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// "Your likely honey": from the hive's pollen mix (aggregated pollen analyses), estimate the honey it
// would give. Pollen isn't nectar, so the AI reweights plants by how much nectar they really give.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DAYS = 30;
const MAX_PLANTS = 8;
// Only cache misses call the AI; cap those per (hashed) IP and globally. Tunable via function secrets.
const IP_DAILY_LIMIT = Number(Deno.env.get('POLENBEE_HONEY_IP_DAILY') ?? 40);
const GLOBAL_DAILY_LIMIT = Number(Deno.env.get('POLENBEE_HONEY_GLOBAL_DAILY') ?? 500);

async function sha(text: string, bytes = 12): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].slice(0, bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function clientKey(req: Request): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  return sha(`polenbee:${ip}`);
}

// deno-lint-ignore no-explicit-any
async function takeQuota(admin: any, bucket: string, limit: number): Promise<boolean> {
  const { data, error } = await admin.rpc('polenbee_take_quota', { p_bucket: bucket, p_limit: limit });
  if (error) {
    // Don't lock everyone out because of a counter hiccup.
    console.error('quota error', error);
    return true;
  }
  return data === true;
}

type Language = 'en' | 'es';

const OUTPUT_LANGUAGE: Record<Language, string> = {
  en: 'Escribe nombre, colorNombre, sabor, aroma, cristalizacion, nota y nombreComun en INGLÉS (p. ej. "Heather honey", "Wildflower honey").',
  es: 'Escribe nombre, colorNombre, sabor, aroma, cristalizacion, nota y nombreComun en español (p. ej. "Miel de brezo", "Miel multifloral").',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const HONEY_JSON_SCHEMA = {
  name: 'honey',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      tipo: { type: 'string', enum: ['monofloral', 'multifloral'] },
      nombre: { type: 'string' },
      colorMiel: { type: 'string' },
      colorNombre: { type: 'string' },
      sabor: { type: 'string' },
      aroma: { type: 'string' },
      cristalizacion: { type: 'string' },
      nota: { type: 'string' },
      composicion: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombreCientifico: { type: 'string' },
            nombreComun: { type: 'string' },
            porcentaje: { type: 'integer' },
          },
          required: ['nombreCientifico', 'nombreComun', 'porcentaje'],
          additionalProperties: false,
        },
      },
    },
    required: ['tipo', 'nombre', 'colorMiel', 'colorNombre', 'sabor', 'aroma', 'cristalizacion', 'nota', 'composicion'],
    additionalProperties: false,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { plants: rawPlants, placeName, language: rawLanguage } = await req.json();
    const language: Language = rawLanguage === 'es' ? 'es' : 'en';
    // deno-lint-ignore no-explicit-any
    const plants = (Array.isArray(rawPlants) ? rawPlants : [])
      .filter((p: any) => typeof p?.nombreCientifico === 'string' && typeof p?.share === 'number')
      .slice(0, MAX_PLANTS)
      // deno-lint-ignore no-explicit-any
      .map((p: any) => ({
        nombreCientifico: String(p.nombreCientifico).slice(0, 80),
        nombreComun: String(p.nombreComun ?? '').slice(0, 80),
        // Rounded to 5 % so small changes in the history reuse the cached answer.
        share: Math.max(0, Math.min(100, Math.round(p.share / 5) * 5)),
      }));
    if (!plants.length) {
      return jsonResponse({ success: false, reason: 'invalid_input' }, 400);
    }

    const signature = plants
      .map((p: { nombreCientifico: string; share: number }) => `${p.nombreCientifico.toLowerCase()}=${p.share}`)
      .sort()
      .join('|');
    const key = await sha(`${language}|${signature}`, 16);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const freshSince = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await admin
      .from('polenbee_honey')
      .select('data')
      .eq('key', key)
      .gte('created_at', freshSince)
      .maybeSingle();
    if (cached?.data) return jsonResponse({ success: true, honey: cached.data, cached: true });

    if (!(await takeQuota(admin, `honey:ip:${await clientKey(req)}`, IP_DAILY_LIMIT))) {
      return jsonResponse({ success: false, reason: 'rate_limited' }, 429);
    }
    if (!(await takeQuota(admin, 'honey:global', GLOBAL_DAILY_LIMIT))) {
      console.error('global daily honey cap reached');
      return jsonResponse({ success: false, reason: 'busy' }, 503);
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return jsonResponse({ success: false, reason: 'missing_api_key' }, 500);
    }

    const plantList = plants
      .map((p: { nombreCientifico: string; nombreComun: string; share: number }) => `- ${p.nombreCientifico}${p.nombreComun ? ` (${p.nombreComun})` : ''}: ${p.share} % del polen`)
      .join('\n');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Cached per pollen mix, so the better model costs little.
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Eres apicultor y experto en melisopalinología. Te doy la mezcla de polen que recogen las abejas de un colmenar ' +
              '(estimada a partir de fotos de las cargas de polen). Estima la miel que daría ese colmenar. ' +
              'Ten en cuenta que el polen no equivale al néctar: hay plantas que dan mucho polen y poco o ningún néctar ' +
              '(p. ej. amapola, jara, maíz, gramíneas) y otras con mucho néctar y poco polen (p. ej. castaño sobrerrepresentado en polen, ' +
              'lavanda o romero infrarrepresentados). Reparte el aporte de néctar en composicion (porcentajes enteros que sumen 100, ' +
              'solo plantas que aporten néctar, de más a menos, copiando nombreCientifico exactamente). ' +
              'tipo: monofloral si una planta aportaría claramente la mayor parte del néctar (≈45 % o más), si no multifloral. ' +
              'nombre: el nombre de la miel según su origen floral (p. ej. "Miel de romero", "Miel multifloral de primavera"), nunca el nombre del lugar. colorMiel: color realista de esa miel líquida en el tarro, formato #RRGGBB ' +
              '(desde casi blanco, ámbar claro, ámbar, hasta muy oscuro); colorNombre en minúsculas. ' +
              'sabor, aroma y cristalizacion: frases muy cortas (3–8 palabras). ' +
              'nota: una frase útil para el apicultor sobre esta miel o cómo confirmar el origen. ' +
              OUTPUT_LANGUAGE[language],
          },
          {
            role: 'user',
            content: `Región (solo como contexto, no la pongas en el nombre de la miel): ${placeName || 'desconocida'}.\nMezcla de polen del colmenar:\n${plantList}`,
          },
        ],
        response_format: { type: 'json_schema', json_schema: HONEY_JSON_SCHEMA },
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI error', aiResponse.status, await aiResponse.text());
      return jsonResponse({ success: false, reason: 'ai_error' }, 502);
    }

    const aiJson = await aiResponse.json();
    const honey = { ...JSON.parse(aiJson.choices[0].message.content), language };

    await admin.from('polenbee_honey').upsert({ key, data: honey, created_at: new Date().toISOString() });

    return jsonResponse({ success: true, honey, cached: false });
  } catch (error) {
    console.error('polenbee-honey error', error);
    return jsonResponse({ success: false, reason: 'server_error' }, 500);
  }
});
