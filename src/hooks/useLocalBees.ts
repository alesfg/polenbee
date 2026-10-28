import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { BeeKind, kindForGenus } from '@/data/bees';
import { language } from '@/i18n';
import { getJson, PlantPhoto, photoForTaxon } from '@/lib/plantPhoto';
import { Place } from '@/types/pollen';

// Anthophila: all bees. Observations within this radius, any time of year.
const BEES_TAXON_ID = 630955;
const RADIUS_KM = 25;
const MAX_SPECIES = 10;
const CACHE_PREFIX = 'local_bees:';
const CACHE_MS = 7 * 24 * 3600 * 1000;

export interface LocalBee {
  taxonId: number;
  scientificName: string;
  commonName: string | null;
  observations: number;
  kind: BeeKind;
  photo: PlantPhoto | null;
}

const capitalize = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const isOpenLicence = (code: unknown) => typeof code === 'string' && code.startsWith('cc');

async function fetchLocalBees(place: Place): Promise<{ total: number; bees: LocalBee[] }> {
  const json = await getJson(
    `https://api.inaturalist.org/v1/observations/species_counts?lat=${place.latitude}&lng=${place.longitude}` +
      `&radius=${RADIUS_KM}&taxon_id=${BEES_TAXON_ID}&verifiable=true&locale=${language}&per_page=${MAX_SPECIES}`
  );
  const bees: LocalBee[] = await Promise.all(
    (json.results ?? []).map(async (r: any) => {
      const p = r.taxon?.default_photo;
      const photo: PlantPhoto | null = isOpenLicence(p?.license_code)
        ? {
            url: p.medium_url,
            largeUrl: p.medium_url.replace('/medium.', '/large.'),
            attribution: `© ${p.attribution_name ?? 'iNaturalist'} · ${String(p.license_code).toUpperCase()} · iNaturalist`,
          }
        : await photoForTaxon(r.taxon.id).catch(() => null);
      return {
        taxonId: r.taxon.id,
        scientificName: r.taxon.name,
        commonName: capitalize(r.taxon.preferred_common_name ?? null),
        observations: r.count ?? 0,
        kind: kindForGenus(r.taxon.name),
        photo,
      };
    })
  );
  return { total: json.total_results ?? bees.length, bees };
}

/** Bee species recorded around a place (iNaturalist), most observed first. */
export function useLocalBees(place: Place | null) {
  const [data, setData] = useState<{ total: number; bees: LocalBee[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    const key = `${CACHE_PREFIX}${place.latitude.toFixed(1)}:${place.longitude.toFixed(1)}:${language}`;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const cached = JSON.parse(raw);
          if (!cancelled) setData(cached.data);
          if (Date.now() - cached.at < CACHE_MS) return;
        }
      } catch {}
      setLoading(true);
      try {
        const fresh = await fetchLocalBees(place);
        if (cancelled) return;
        setData(fresh);
        AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), data: fresh })).catch(() => {});
      } catch {
        // Keep whatever was cached; the section just stays hidden otherwise.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [place?.latitude, place?.longitude]);

  return { data, loading };
}
