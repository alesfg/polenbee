import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Plant photos come from iNaturalist. Only Creative Commons photos are used, and their
// attribution is shown next to them.
export type PlantPhoto = { url: string; largeUrl: string; attribution: string };

const API = 'https://api.inaturalist.org/v1';
const CACHE_PREFIX = 'plant_photo2:';
const CACHE_MS = 30 * 24 * 3600 * 1000;
// Most open licences first; any CC licence is acceptable.
const LICENSE_RANK = ['cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd'];
const SPECIES_RANKS = new Set(['species', 'hybrid', 'subspecies', 'variety']);

const memory = new Map<string, Promise<PlantPhoto | null>>();

// iNaturalist asks for gentle use: at most a few requests at a time.
const MAX_CONCURRENT = 3;
let active = 0;
const waiting: (() => void)[] = [];

async function getJson(url: string) {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`iNaturalist ${res.status}`);
    return await res.json();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

/** Finds the species, also through synonyms (e.g. Prunus dulcis → Prunus amygdalus). */
async function findTaxonId(scientificName: string): Promise<number | null> {
  const json = await getJson(`${API}/taxa?q=${encodeURIComponent(scientificName)}&iconic_taxa=Plantae&per_page=10`);
  const wanted = scientificName.toLowerCase();
  const candidates = (json.results ?? []).filter((r: any) => SPECIES_RANKS.has(r.rank));
  const taxon =
    candidates.find((r: any) => r.name?.toLowerCase() === wanted) ??
    candidates.find((r: any) => r.matched_term?.toLowerCase() === wanted) ??
    candidates[0];
  return taxon?.id ?? null;
}

async function fetchPhoto(scientificName: string): Promise<PlantPhoto | null> {
  const id = await findTaxonId(scientificName);
  if (!id) return null;
  const json = await getJson(`${API}/taxa/${id}`);
  const photos = (json.results?.[0]?.taxon_photos ?? []).map((tp: any) => tp.photo).filter((p: any) => p?.medium_url);
  const rank = (p: any) => {
    const i = LICENSE_RANK.indexOf(p.license_code);
    return i === -1 ? Infinity : i;
  };
  // Keep iNaturalist's order (best photos first) among the most open licence available.
  const best = photos.reduce((acc: any, p: any) => (rank(p) < rank(acc ?? {}) ? p : acc), null);
  if (!best) return null;
  return {
    url: best.medium_url,
    largeUrl: best.large_url ?? best.medium_url,
    attribution: `© ${best.attribution_name ?? 'iNaturalist'} · ${String(best.license_code).toUpperCase()} · iNaturalist`,
  };
}

async function loadPhoto(scientificName: string): Promise<PlantPhoto | null> {
  const key = CACHE_PREFIX + scientificName.toLowerCase();
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { at, photo } = JSON.parse(cached);
      if (Date.now() - at < CACHE_MS) return photo;
    }
  } catch {}

  try {
    const photo = await fetchPhoto(scientificName);
    AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), photo })).catch(() => {});
    return photo;
  } catch {
    // Network errors and rate limits aren't cached, so the photo can appear next time.
    memory.delete(scientificName.toLowerCase());
    return null;
  }
}

export function getPlantPhoto(scientificName: string): Promise<PlantPhoto | null> {
  const key = scientificName.toLowerCase();
  let pending = memory.get(key);
  if (!pending) {
    pending = loadPhoto(scientificName);
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
