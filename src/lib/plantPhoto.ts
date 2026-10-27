import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Plant photos come from iNaturalist's default taxon photo. Only Creative Commons
// photos are used, and their attribution is shown next to them.
export type PlantPhoto = { url: string; attribution: string };

const CACHE_PREFIX = 'plant_photo:';
const CACHE_MS = 30 * 24 * 3600 * 1000;
const memory = new Map<string, Promise<PlantPhoto | null>>();

async function fetchPhoto(scientificName: string): Promise<PlantPhoto | null> {
  const key = CACHE_PREFIX + scientificName.toLowerCase();
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { at, photo } = JSON.parse(cached);
      if (Date.now() - at < CACHE_MS) return photo;
    }
  } catch {}

  try {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(scientificName)}&per_page=3&locale=en`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const wanted = scientificName.toLowerCase();
    const taxon =
      json.results?.find((r: any) => r.name?.toLowerCase() === wanted) ??
      json.results?.find((r: any) => r.iconic_taxon_name === 'Plantae');
    const p = taxon?.default_photo;
    const photo: PlantPhoto | null =
      p?.medium_url && typeof p.license_code === 'string' && p.license_code.startsWith('cc')
        ? { url: p.medium_url, attribution: p.attribution_name ? `© ${p.attribution_name} · ${p.license_code.toUpperCase()} · iNaturalist` : 'iNaturalist' }
        : null;
    AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), photo })).catch(() => {});
    return photo;
  } catch {
    // Network errors aren't cached so the photo can appear next time.
    return null;
  }
}

export function getPlantPhoto(scientificName: string): Promise<PlantPhoto | null> {
  const key = scientificName.toLowerCase();
  let pending = memory.get(key);
  if (!pending) {
    pending = fetchPhoto(scientificName);
    memory.set(key, pending);
  }
  return pending;
}

export function usePlantPhoto(scientificName: string | undefined): PlantPhoto | null {
  const [photo, setPhoto] = useState<PlantPhoto | null>(null);
  useEffect(() => {
    if (!scientificName) return;
    let alive = true;
    getPlantPhoto(scientificName).then((p) => alive && setPhoto(p));
    return () => {
      alive = false;
    };
  }, [scientificName]);
  return photo;
}
