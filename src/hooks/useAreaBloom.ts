import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { language } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { AreaBloom, AreaPlant, Place } from '@/types/pollen';
import { useSession } from './useSession';

const CACHE_PREFIX = 'area_bloom:';
const CACHE_MS = 3 * 24 * 60 * 60 * 1000;

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function cacheKey(place: Place, month: number) {
  return `${CACHE_PREFIX}${place.latitude.toFixed(1)}:${place.longitude.toFixed(1)}:${month}:${language}`;
}

function normalize(area: AreaBloom): AreaBloom {
  return {
    ...area,
    plants: area.plants
      .map((p: AreaPlant) => ({ ...p, nombreComun: capitalize(p.nombreComun) }))
      .sort((a, b) => b.share - a.share || b.importancia - a.importancia),
  };
}

/** What's in bloom for bees around `place` in `month` (1–12). Cached on the device for a few days. */
export function useAreaBloom(place: Place | null, month: number) {
  const session = useSession();
  const [area, setArea] = useState<AreaBloom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!place || !session) return;
    let cancelled = false;
    const key = cacheKey(place, month);

    (async () => {
      setError(false);
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const cached = JSON.parse(raw) as { at: number; area: AreaBloom };
          if (!cancelled) setArea(normalize(cached.area));
          if (Date.now() - cached.at < CACHE_MS) return;
        } else if (!cancelled) {
          setArea(null);
        }
      } catch {
        // ignore a broken cache entry
      }

      setLoading(true);
      const { data } = await supabase.functions.invoke('polenbee-area-bloom', {
        body: { latitude: place.latitude, longitude: place.longitude, month, placeName: place.label, language },
      });
      if (cancelled) return;
      setLoading(false);
      if (data?.success && data.area) {
        setArea(normalize(data.area));
        AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), area: data.area }));
      } else {
        setError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [place?.latitude, place?.longitude, month, session?.user.id]);

  return { area, loading, error };
}
