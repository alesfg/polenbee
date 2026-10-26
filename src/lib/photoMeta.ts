import { reverseGeocode } from './location';
import { Place } from '@/types/pollen';

// EXIF shapes differ per platform: Android gives flat keys (GPSLatitude as a number),
// iOS nests GPS data under {GPS}. Web usually has no EXIF at all.
type Exif = Record<string, any> | null | undefined;

/** "2026:10:26 12:30:05" -> local Date. */
export function exifDate(exif: Exif): Date | null {
  const raw: unknown = exif?.DateTimeOriginal ?? exif?.DateTimeDigitized ?? exif?.DateTime ?? exif?.['{Exif}']?.DateTimeOriginal;
  if (typeof raw !== 'string') return null;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
  if (isNaN(d.getTime()) || d.getTime() > Date.now() + 60_000) return null;
  return d;
}

function signed(value: unknown, ref: unknown, negativeRef: string): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  if (!isFinite(n)) return null;
  return ref === negativeRef ? -Math.abs(n) : n;
}

export async function exifPlace(exif: Exif): Promise<Place | null> {
  const gps = exif?.['{GPS}'] ?? exif?.GPS;
  const latitude = signed(gps?.Latitude ?? exif?.GPSLatitude, gps?.LatitudeRef ?? exif?.GPSLatitudeRef, 'S');
  const longitude = signed(gps?.Longitude ?? exif?.GPSLongitude, gps?.LongitudeRef ?? exif?.GPSLongitudeRef, 'W');
  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) return null;
  return { label: await reverseGeocode(latitude, longitude), latitude, longitude };
}
