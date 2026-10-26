import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { language } from '@/i18n';
import { Place } from '@/types/pollen';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  address: { city?: string; town?: string; village?: string; municipality?: string; county?: string; state?: string; country?: string };
}

const NOMINATIM_HEADERS = { 'User-Agent': 'PolenBee/2.0', 'Accept-Language': language };

function nominatimLabel(r: NominatimResult): string {
  const a = r.address ?? {};
  return [a.city ?? a.town ?? a.village ?? a.municipality ?? r.name, a.state, a.country].filter(Boolean).join(', ');
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    const json: NominatimResult[] = await res.json();
    return json.map((r) => ({ label: nominatimLabel(r), latitude: Number(r.lat), longitude: Number(r.lon) }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  if (Platform.OS !== 'web') {
    try {
      const [p] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const label = [p?.city ?? p?.subregion, p?.region, p?.country].filter(Boolean).join(', ');
      if (label) return label;
    } catch {
      // fall through to Nominatim
    }
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    const label = nominatimLabel(await res.json());
    if (label) return label;
  } catch {
    // ignore
  }
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
}

export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getCurrentPlace(): Promise<Place | null> {
  if (!(await requestLocationPermission())) return null;
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;
    return { label: await reverseGeocode(latitude, longitude), latitude, longitude };
  } catch {
    return null;
  }
}
