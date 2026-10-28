import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_LIMIT = 30;
const NEARBY_RADIUS_KM = 15;
// Anonymous users are free to create, so the per-user limit alone doesn't cap spend:
// also limit per (hashed) IP and globally. Tunable via function secrets.
const IP_DAILY_LIMIT = Number(Deno.env.get('POLENBEE_ANALYZE_IP_DAILY') ?? 60);
const GLOBAL_DAILY_LIMIT = Number(Deno.env.get('POLENBEE_ANALYZE_GLOBAL_DAILY') ?? 2000);

async function clientKey(req: Request): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`polenbee:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function fetchJson(url: string, timeoutMs = 6000) {
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

type Language = 'en' | 'es';

// The app is English unless the device is in Spanish; every user-facing text the AI writes follows it.
const OUTPUT_LANGUAGE: Record<Language, string> = {
  en: 'Escribe nombreComun, colorNombre, floracion, motivo, mensaje y rasgos en INGLÉS (nombres comunes ingleses, p. ej. "Ivy", meses como "March – May").',
  es: 'Escribe nombreComun, colorNombre, floracion, motivo, mensaje y rasgos en español.',
};

// Keys the app has illustrations for (src/data/bees.ts).
const RACE_KEYS = ['iberiensis', 'mellifera', 'ligustica', 'carnica', 'caucasica', 'cecropia', 'anatoliaca', 'intermissa', 'scutellata', 'africanizada', 'buckfast'];
const BEE_KINDS = ['melifera', 'abejorro', 'carpintera', 'albanil', 'minera', 'solitaria'];

type NearbyPlant = { scientificName: string; commonName: string | null; observations: number; flowering: boolean };

// Plants observed around the photo's location in the photo's month on iNaturalist. "flowering" ones carry
// the Plant Phenology = Flowering annotation (term 12 / value 13).
async function getNearbyPlants(lat: number, lon: number, month: number, language: Language): Promise<NearbyPlant[]> {
  const base =
    `https://api.inaturalist.org/v1/observations/species_counts?lat=${lat}&lng=${lon}` +
    `&radius=${NEARBY_RADIUS_KM}&iconic_taxa=Plantae&month=${month}&verifiable=true&locale=${language}&per_page=40`;
  const [flowering, all] = await Promise.all([
    fetchJson(`${base}&term_id=12&term_value_id=13`),
    fetchJson(base),
  ]);

  const byName = new Map<string, NearbyPlant>();
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

type Weather = { temperature: number; isDay: boolean; weatherCode: number } | null;

// Weather at the hour the photo was taken. `localDateTime` is the photo's wall-clock time
// (YYYY-MM-DDTHH:mm...), which matches Open-Meteo's hourly times with timezone=auto.
// The forecast endpoint covers roughly the last 3 months; older photos get no weather.
async function getWeather(lat: number, lon: number, localDateTime: string): Promise<Weather> {
  const day = localDateTime.slice(0, 10);
  const hour = `${localDateTime.slice(0, 13)}:00`;
  const json = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,weather_code,is_day&start_date=${day}&end_date=${day}&timezone=auto`
  );
  const i = json?.hourly?.time?.indexOf(hour) ?? -1;
  if (i < 0) return null;
  return {
    temperature: Math.round(json.hourly.temperature_2m[i]),
    isDay: json.hourly.is_day[i] === 1,
    weatherCode: json.hourly.weather_code[i],
  };
}

const POLLEN_JSON_SCHEMA = {
  name: 'pollen_analysis',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      calidadFoto: { type: 'string', enum: ['clara', 'dudosa', 'sin_polen'] },
      mensaje: { type: 'string' },
      colorPolen: { type: 'string' },
      colorNombre: { type: 'string' },
      abeja: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: [...BEE_KINDS, 'no_es_abeja', 'no_visible'] },
          casta: { type: 'string', enum: ['obrera', 'reina', 'zangano', 'desconocida'] },
          raza: { type: 'string', enum: [...RACE_KEYS, 'desconocida', 'no_aplica'] },
          confianzaRaza: { type: 'string', enum: ['alta', 'media', 'baja'] },
          rasgos: { type: 'string' },
        },
        required: ['tipo', 'casta', 'raza', 'confianzaRaza', 'rasgos'],
        additionalProperties: false,
      },
      especies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombreComun: { type: 'string' },
            nombreCientifico: { type: 'string' },
            probabilidad: { type: 'integer' },
            colorPolen: { type: 'string' },
            colorNombre: { type: 'string' },
            floracion: { type: 'string' },
            motivo: { type: 'string' },
          },
          required: ['nombreComun', 'nombreCientifico', 'probabilidad', 'colorPolen', 'colorNombre', 'floracion', 'motivo'],
          additionalProperties: false,
        },
      },
    },
    required: ['calidadFoto', 'mensaje', 'colorPolen', 'colorNombre', 'abeja', 'especies'],
    additionalProperties: false,
  },
};

type Species = {
  nombreComun: string;
  nombreCientifico: string;
  probabilidad: number;
  colorPolen: string;
  colorNombre: string;
  floracion: string;
  motivo: string;
};

// Rescale so the shown percentages always add up to exactly 100.
function normalizeProbabilities(species: Species[]): Species[] {
  const valid = species.filter((s) => s.probabilidad > 0);
  const total = valid.reduce((sum, s) => sum + s.probabilidad, 0);
  if (!total) return valid;
  const scaled = valid.map((s) => ({ ...s, probabilidad: Math.round((s.probabilidad / total) * 100) }));
  scaled.sort((a, b) => b.probabilidad - a.probabilidad);
  const diff = 100 - scaled.reduce((sum, s) => sum + s.probabilidad, 0);
  if (scaled.length) scaled[0].probabilidad += diff;
  return scaled;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { imageBase64, latitude, longitude, placeName, localDateTime: rawDateTime, language: rawLanguage, raceHints: rawRaceHints } = await req.json();
    // Races native to / commonly kept in the area, worked out by the app from the location.
    const raceHints: string[] = Array.isArray(rawRaceHints) ? rawRaceHints.filter((k: unknown) => typeof k === 'string' && RACE_KEYS.includes(k)) : [];
    const language: Language = rawLanguage === 'es' ? 'es' : 'en';
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return jsonResponse({ success: false, reason: 'invalid_input' }, 400);
    }
    const hasImage = typeof imageBase64 === 'string' && imageBase64.length > 0;
    // Wall-clock time where the photo was taken, as chosen in the app (YYYY-MM-DDTHH:mm:ss±hh:mm).
    const localDateTime: string =
      typeof rawDateTime === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(rawDateTime)
        ? rawDateTime
        : new Date().toISOString();
    const parsedTakenAt = new Date(localDateTime);
    const photoTakenAt = isNaN(parsedTakenAt.getTime()) ? new Date() : parsedTakenAt;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return jsonResponse({ success: false, reason: 'missing_api_key' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, reason: 'unauthorized' }, 401);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ success: false, reason: 'unauthorized' }, 401);
    }
    const userId = userData.user.id;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('polenbee_pollen_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return jsonResponse({ success: false, reason: 'rate_limited' }, 429);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!(await takeQuota(admin, `analyze:ip:${await clientKey(req)}`, IP_DAILY_LIMIT))) {
      return jsonResponse({ success: false, reason: 'rate_limited' }, 429);
    }
    if (!(await takeQuota(admin, 'analyze:global', GLOBAL_DAILY_LIMIT))) {
      console.error('global daily analysis cap reached');
      return jsonResponse({ success: false, reason: 'busy' }, 503);
    }

    const month = Number(localDateTime.slice(5, 7));
    const [nearbyPlants, weather] = await Promise.all([
      getNearbyPlants(latitude, longitude, month, language),
      getWeather(latitude, longitude, localDateTime),
    ]);

    const plantList = nearbyPlants.length
      ? nearbyPlants
          .map((p) => `- ${p.commonName ? `${p.commonName} ` : ''}(${p.scientificName}): ${p.observations} obs.${p.flowering ? ', vista en flor' : ''}`)
          .join('\n')
      : 'No hay datos de plantas cercanas; usa tu conocimiento de la flora típica de la zona.';

    const context = [
      `Ubicación: ${placeName || 'desconocida'} (lat ${latitude.toFixed(3)}, lon ${longitude.toFixed(3)}).`,
      `Fecha y hora local de la foto: ${localDateTime}.`,
      weather ? `Tiempo a esa hora: ${weather.temperature} °C, ${weather.isDay ? 'de día' : 'de noche'}.` : '',
      `Plantas observadas en un radio de ${NEARBY_RADIUS_KM} km en ese mes (iNaturalist):`,
      plantList,
      raceHints.length ? `Razas de abeja melífera habituales en esa zona (autóctona primero): ${raceHints.join(', ')}.` : '',
      hasImage ? '' : 'No hay foto: estima solo con la ubicación, la fecha y las plantas cercanas.',
    ]
      .filter(Boolean)
      .join('\n');

    const userContent: unknown[] = [{ type: 'text', text: context }];
    if (hasImage) userContent.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } });

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Eres palinólogo y apicultor experto. Recibes (normalmente) la foto de una abeja y el contexto de dónde y cuándo se tomó. ' +
              'Tu tarea es estimar qué plantas está pecoreando, y SIEMPRE debes dar una estimación. ' +
              'Si se ven bien las cargas de polen de las corbículas (patas traseras), usa su color como pista principal y crúzalo con lo que florece en esa zona y época: calidadFoto = "clara". ' +
              'Si la foto está borrosa, lejos o el color no es fiable, usa lo que se pueda ver y apóyate más en la zona y la fecha: calidadFoto = "dudosa". ' +
              'Si no se ve abeja ni polen (o no hay foto), estima solo con las plantas que florecen en esa zona y fecha y que más atraen a las abejas: calidadFoto = "sin_polen". ' +
              'Da preferencia a las plantas de la lista de observaciones cercanas, pero puedes incluir otras típicas de la zona si encajan mejor. ' +
              'Devuelve entre 3 y 5 especies con probabilidades enteras que sumen 100; con calidadFoto "dudosa" o "sin_polen" reparte las probabilidades con más prudencia. ' +
              'colorPolen siempre en formato #RRGGBB: el color observado o, si no se ve, el color típico del polen de la especie más probable. ' +
              'colorNombre en minúsculas (p. ej. "naranja intenso"). En cada especie, colorPolen y colorNombre son los del polen típico de esa planta; ' +
              'floracion con meses, p. ej. "Marzo – Mayo"; motivo: una frase corta de por qué encaja (color, floración, cercanía, hora). ' +
              'mensaje: una frase de resumen; si la foto no sirvió, dilo con amabilidad y da un consejo para la próxima foto. ' +
              'abeja: identifica el insecto de la foto. tipo: melifera (Apis mellifera), abejorro (Bombus), carpintera (Xylocopa), ' +
              'albanil (Osmia, Megachile, Anthidium…), minera (Andrena…), solitaria (otras abejas), no_es_abeja (avispa, sírfido, mosca…) o no_visible. ' +
              'casta solo para melífera (obrera; zangano con ojos enormes que se tocan y cuerpo ancho; reina con abdomen largo); si no, desconocida. ' +
              'raza solo si tipo es melifera (si no, no_aplica): elige la más probable fijándote en el color de los terguitos del abdomen ' +
              '(amarillo dorado = ligustica/buckfast; pardo oscuro con bandas finas = iberiensis; casi negra = mellifera/intermissa; gris con pelos grises = carnica/caucasica) ' +
              'y en las razas habituales de la zona; por foto rara vez se puede asegurar, así que confianzaRaza casi siempre media o baja. ' +
              'Si no se distingue, raza = desconocida. rasgos: una frase corta con lo que se ve (colores, bandas, pelo, tamaño). ' +
              OUTPUT_LANGUAGE[language],
          },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_schema', json_schema: POLLEN_JSON_SCHEMA },
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI error', aiResponse.status, await aiResponse.text());
      return jsonResponse({ success: false, reason: 'ai_error' }, 502);
    }

    const aiJson = await aiResponse.json();
    const result = JSON.parse(aiJson.choices[0].message.content);

    if (!result.especies?.length) {
      return jsonResponse({ success: false, reason: 'ai_error' }, 502);
    }

    const species = normalizeProbabilities(result.especies);

    const { data: row, error: insertError } = await supabase
      .from('polenbee_pollen_analyses')
      .insert({
        user_id: userId,
        species,
        latitude,
        longitude,
        place_name: placeName || null,
        pollen_color: result.colorPolen,
        pollen_color_name: result.colorNombre,
        photo_taken_at: photoTakenAt.toISOString(),
        analyzed_at: localDateTime.slice(0, 10),
        photo_quality: hasImage ? result.calidadFoto : 'sin_polen',
        context: {
          summary: result.mensaje,
          localDateTime,
          language,
          weather,
          nearbyPlantsCount: nearbyPlants.length,
          abeja: hasImage ? result.abeja : null,
        },
      })
      .select('id, created_at, photo_taken_at, photo_quality, species, latitude, longitude, place_name, pollen_color, pollen_color_name, context')
      .single();
    if (insertError) throw insertError;

    return jsonResponse({ success: true, analysis: row });
  } catch (error) {
    console.error('polenbee-analyze-pollen error', error);
    return jsonResponse({ success: false, reason: 'server_error' }, 500);
  }
});
