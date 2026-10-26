import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// "Your area" summary: which plants bees can be foraging around a place in a given month,
// their expected pollen colours, and how bloom activity changes over the year.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RADIUS_KM = 15;
const CACHE_DAYS = 14;
// Below this many flowering-annotated observations a year, the curve uses all plant observations instead.
const MIN_FLOWERING_FOR_CURVE = 150;

type Language = 'en' | 'es';

const OUTPUT_LANGUAGE: Record<Language, string> = {
  en: 'Escribe nombreComun, colorNombre, floracion, nota y resumen en INGLÉS (nombres comunes ingleses, meses como "March – May").',
  es: 'Escribe nombreComun, colorNombre, floracion, nota y resumen en español.',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'PolenBee/2.0' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Candidate = { scientificName: string; commonName: string | null; observations: number; flowering: boolean };

async function getCandidates(lat: number, lon: number, month: number, language: Language): Promise<Candidate[]> {
  const base =
    `https://api.inaturalist.org/v1/observations/species_counts?lat=${lat}&lng=${lon}` +
    `&radius=${RADIUS_KM}&iconic_taxa=Plantae&month=${month}&verifiable=true&locale=${language}&per_page=40`;
  const [flowering, all] = await Promise.all([fetchJson(`${base}&term_id=12&term_value_id=13`), fetchJson(base)]);

  const byName = new Map<string, Candidate>();
  // deno-lint-ignore no-explicit-any
  const add = (results: any[] | undefined, isFlowering: boolean) => {
    for (const r of results ?? []) {
      const name = r?.taxon?.name;
      if (!name || r.taxon.rank !== 'species') continue;
      const prev = byName.get(name);
      byName.set(name, {
        scientificName: name,
        commonName: r.taxon.preferred_common_name ?? prev?.commonName ?? null,
        observations: Math.max(prev?.observations ?? 0, r.count ?? 0),
        flowering: isFlowering || (prev?.flowering ?? false),
      });
    }
  };
  add(flowering?.results, true);
  add(all?.results, false);

  return [...byName.values()]
    .sort((a, b) => Number(b.flowering) - Number(a.flowering) || b.observations - a.observations)
    .slice(0, 40);
}

/** Observations per month (Jan..Dec) around the place. */
async function getMonthlyCurve(lat: number, lon: number): Promise<{ monthly: number[]; source: 'flowering' | 'all' }> {
  const base =
    `https://api.inaturalist.org/v1/observations/histogram?lat=${lat}&lng=${lon}&radius=${RADIUS_KM}` +
    `&iconic_taxa=Plantae&date_field=observed&interval=month_of_year&verifiable=true`;
  const [flowering, all] = await Promise.all([fetchJson(`${base}&term_id=12&term_value_id=13`), fetchJson(base)]);
  // deno-lint-ignore no-explicit-any
  const toArray = (json: any) => Array.from({ length: 12 }, (_, i) => Number(json?.results?.month_of_year?.[i + 1] ?? 0));
  const floweringCurve = toArray(flowering);
  if (floweringCurve.reduce((a, b) => a + b, 0) >= MIN_FLOWERING_FOR_CURVE) return { monthly: floweringCurve, source: 'flowering' };
  return { monthly: toArray(all), source: 'all' };
}

const AREA_JSON_SCHEMA = {
  name: 'area_bloom',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      resumen: { type: 'string' },
      plantas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombreCientifico: { type: 'string' },
            nombreComun: { type: 'string' },
            colorPolen: { type: 'string' },
            colorNombre: { type: 'string' },
            aporte: { type: 'string', enum: ['polen', 'nectar', 'ambos'] },
            importancia: { type: 'integer', enum: [1, 2, 3] },
            floracion: { type: 'string' },
            nota: { type: 'string' },
          },
          required: ['nombreCientifico', 'nombreComun', 'colorPolen', 'colorNombre', 'aporte', 'importancia', 'floracion', 'nota'],
          additionalProperties: false,
        },
      },
    },
    required: ['resumen', 'plantas'],
    additionalProperties: false,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { latitude, longitude, month: rawMonth, placeName, language: rawLanguage } = await req.json();
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return jsonResponse({ success: false, reason: 'invalid_input' }, 400);
    }
    const language: Language = rawLanguage === 'es' ? 'es' : 'en';
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : new Date().getUTCMonth() + 1;

    // ~10 km grid cell so nearby users share the cached result.
    const lat = Math.round(latitude * 10) / 10;
    const lon = Math.round(longitude * 10) / 10;
    const key = `${lat.toFixed(1)}:${lon.toFixed(1)}:${month}:${language}`;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const freshSince = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await admin
      .from('polenbee_area_bloom')
      .select('data')
      .eq('key', key)
      .gte('created_at', freshSince)
      .maybeSingle();
    if (cached?.data) return jsonResponse({ success: true, area: cached.data, cached: true });

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return jsonResponse({ success: false, reason: 'missing_api_key' }, 500);
    }

    const [candidates, curve] = await Promise.all([getCandidates(lat, lon, month, language), getMonthlyCurve(lat, lon)]);

    const candidateList = candidates.length
      ? candidates
          .map((c) => `- ${c.scientificName}${c.commonName ? ` (${c.commonName})` : ''}: ${c.observations} obs.${c.flowering ? ', vista en flor' : ''}`)
          .join('\n')
      : 'Sin datos de observaciones; usa la flora típica de la zona.';

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Results are cached per area and month, so the better model costs little.
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Eres apicultor y botánico experto. Te doy una zona, un mes y las plantas observadas allí en ese mes (iNaturalist). ' +
              'Elige entre 6 y 8 plantas que en ese mes estén en flor y que las abejas melíferas visiten para recoger polen o néctar, ' +
              'ordenadas de más a menos relevantes para las abejas. Usa preferentemente las de la lista, copiando el nombreCientifico exactamente; ' +
              'si la lista es pobre, completa con flora típica de la zona en ese mes. Una planta observada ese mes no tiene por qué estar en flor: ' +
              'incluye solo las que de verdad florecen en ese mes en esa región. Ignora plantas sin interés apícola. ' +
              'colorPolen: color real de las cargas de polen de esa planta tal como se ven en las corbículas, en formato #RRGGBB ' +
              '(colores realistas y diferenciados, no tonos pastel genéricos); colorNombre en minúsculas y coherente con colorPolen. ' +
              'aporte: si a las abejas les interesa sobre todo por polen, néctar o ambos. importancia: 3 = muy importante, 1 = secundaria. ' +
              'floracion: meses de floración con su nombre, p. ej. "Septiembre – Noviembre". nota: frase muy corta y útil para el apicultor. ' +
              'resumen: 1–2 frases sobre cómo está el pecoreo en esa zona ese mes. ' +
              OUTPUT_LANGUAGE[language],
          },
          {
            role: 'user',
            content: `Zona: ${placeName || 'desconocida'} (lat ${lat}, lon ${lon}). Mes: ${month}.\nPlantas observadas en ${RADIUS_KM} km:\n${candidateList}`,
          },
        ],
        response_format: { type: 'json_schema', json_schema: AREA_JSON_SCHEMA },
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI error', aiResponse.status, await aiResponse.text());
      return jsonResponse({ success: false, reason: 'ai_error' }, 502);
    }

    const aiJson = await aiResponse.json();
    const result = JSON.parse(aiJson.choices[0].message.content);

    const byName = new Map(candidates.map((c) => [c.scientificName, c]));
    // Palette share: real observation counts when we have them, otherwise the AI's importance.
    const weighted = (result.plantas ?? []).map((p: { nombreCientifico: string; importancia: number }) => {
      const obs = byName.get(p.nombreCientifico)?.observations ?? 0;
      return { ...p, observations: obs, weight: obs > 0 ? obs : p.importancia * 2 };
    });
    const totalWeight = weighted.reduce((sum: number, p: { weight: number }) => sum + p.weight, 0) || 1;
    const plants = weighted.map(({ weight, ...p }: { weight: number }) => ({ ...p, share: Math.round((weight / totalWeight) * 1000) / 10 }));

    const area = {
      month,
      language,
      latitude: lat,
      longitude: lon,
      summary: result.resumen,
      plants,
      monthly: curve.monthly,
      curveSource: curve.source,
    };

    await admin.from('polenbee_area_bloom').upsert({ key, data: area, created_at: new Date().toISOString() });

    return jsonResponse({ success: true, area, cached: false });
  } catch (error) {
    console.error('polenbee-area-bloom error', error);
    return jsonResponse({ success: false, reason: 'server_error' }, 500);
  }
});
