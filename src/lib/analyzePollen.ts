import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from './supabase';
import { racesForPlace } from '@/data/bees';
import { language, t } from '@/i18n';
import { PollenAnalysis, PollenSpecies, Place } from '@/types/pollen';

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Database / edge-function row -> app model.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAnalysisRow(row: any): PollenAnalysis {
  return {
    id: row.id,
    createdAt: row.created_at,
    photoTakenAt: row.photo_taken_at ?? row.created_at,
    photoQuality: row.photo_quality ?? null,
    species: Array.isArray(row.species)
      ? row.species.map((s: PollenSpecies) => ({ ...s, nombreComun: capitalize(s.nombreComun) }))
      : [],
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    placeName: row.place_name ?? null,
    pollenColor: row.pollen_color ?? null,
    pollenColorName: row.pollen_color_name ?? null,
    summary: row.context?.summary ?? null,
    temperature: row.context?.weather?.temperature ?? null,
    bee: row.context?.abeja ?? null,
  };
}

export type AnalyzeResult =
  | { ok: true; analysis: PollenAnalysis }
  | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: t('error.rateLimited'),
  unauthorized: t('error.unauthorized'),
  ai_error: t('error.aiUnavailable'),
  busy: t('error.busy'),
};

// Local wall-clock time with offset, e.g. 2026-10-26T18:42:00+01:00, so the AI knows the hour where the photo was taken.
function localDateTime(d: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00` +
    `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  );
}

// 1280px wide JPEG keeps the pollen loads readable while staying well under request limits.
async function prepareImage(uri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).resize({ width: 1280 }).renderAsync();
  const saved = await rendered.saveAsync({ base64: true, compress: 0.75, format: SaveFormat.JPEG });
  if (!saved.base64) throw new Error(t('error.image'));
  return saved.base64;
}

export async function analyzePollen(imageUri: string, place: Place, takenAt: Date): Promise<AnalyzeResult> {
  try {
    const imageBase64 = await prepareImage(imageUri);
    const { data, error } = await supabase.functions.invoke('polenbee-analyze-pollen', {
      body: {
        imageBase64,
        latitude: place.latitude,
        longitude: place.longitude,
        placeName: place.label,
        localDateTime: localDateTime(takenAt),
        language,
        raceHints: (({ native, kept }) => [...native, ...kept])(racesForPlace(place.latitude, place.longitude)),
      },
    });

    if (error) {
      // Non-2xx responses still carry our JSON body with a reason.
      const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
      return { ok: false, message: ERROR_MESSAGES[body?.reason] ?? t('error.generic') };
    }
    if (!data?.success) {
      return { ok: false, message: ERROR_MESSAGES[data?.reason] ?? t('error.generic') };
    }
    return { ok: true, analysis: mapAnalysisRow(data.analysis) };
  } catch {
    return { ok: false, message: t('error.network') };
  }
}
