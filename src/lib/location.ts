import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { language } from '@/i18n';
import { Place } from '@/types/pollen';

// Photon (komoot) is built for search-as-you-type, unlike Nominatim whose usage policy forbids autocomplete.
// It only localises to a few languages; "default" returns local names (Spanish names in Spain).
const PHOTON_URL = 'https://photon.komoot.io';
const PHOTON_LANG = language === 'en' ? 'en' : 'default';
const PHOTON_LAYERS = ['city', 'locality', 'district', 'county'].map((l) => `&layer=${l}`).join('');
const PHOTON_HEADERS = { 'User-Agent': 'PolenBee/2.0 (com.floresstudios.polenbee)' };

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; city?: string; county?: string; state?: string; country?: string };
}

function photonPlace(f: PhotonFeature): Place {
  const p = f.properties;
  const label = [p.name ?? p.city ?? p.county, p.state, p.country]
    .filter((part, i, all) => part && all.indexOf(part) === i)
    .join(', ');
  return { label, latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (query.trim().length < 3) return [];
  try {
    const url = `${PHOTON_URL}/api/?q=${encodeURIComponent(query)}&limit=6&lang=${PHOTON_LANG}${PHOTON_LAYERS}`;
    const res = await fetch(url, { headers: PHOTON_HEADERS });
    const json: { features?: PhotonFeature[] } = await res.json();
    // A town and its municipality often share a label; keep the first.
    const places = (json.features ?? []).map(photonPlace).filter((p) => p.label);
    return places.filter((p, i) => places.findIndex((q) => q.label === p.label) === i);
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
      // fall through to Photon
    }
  }
  try {
    const url = `${PHOTON_URL}/reverse?lat=${latitude}&lon=${longitude}&limit=1&lang=${PHOTON_LANG}${PHOTON_LAYERS}`;
    const res = await fetch(url, { headers: PHOTON_HEADERS });
    const json: { features?: PhotonFeature[] } = await res.json();
    const label = json.features?.[0] ? photonPlace(json.features[0]).label : '';
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
