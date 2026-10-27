import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { language } from '@/i18n';
import { PlantShare } from '@/lib/pollenStats';
import { supabase } from '@/lib/supabase';
import { HoneyEstimate } from '@/types/pollen';
import { useSession } from './useSession';

const CACHE_PREFIX = 'honey:';
const MAX_PLANTS = 8;

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Likely honey for a pollen mix. Same rounding as the server, so a stable history never calls the AI again. */
export function useHoney(plants: PlantShare[], placeName: string | null) {
  const session = useSession();
  const [honey, setHoney] = useState<HoneyEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const top = plants.slice(0, MAX_PLANTS).map((p) => ({
    nombreCientifico: p.nombreCientifico,
    nombreComun: p.nombreComun,
    share: Math.round(p.share / 5) * 5,
  }));
  const signature = top.map((p) => `${p.nombreCientifico.toLowerCase()}=${p.share}`).sort().join('|');

  useEffect(() => {
    if (!session || !top.length) {
      setHoney(null);
      return;
    }
    let cancelled = false;
    const key = `${CACHE_PREFIX}${language}|${signature}`;

    (async () => {
      setError(false);
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          if (!cancelled) setHoney(JSON.parse(raw));
          return;
        }
      } catch {
        // ignore a broken cache entry
      }
      setLoading(true);
      const { data } = await supabase.functions.invoke('polenbee-honey', { body: { plants: top, placeName, language } });
      if (cancelled) return;
      setLoading(false);
      if (data?.success && data.honey) {
        const h: HoneyEstimate = {
          ...data.honey,
          composicion: (data.honey.composicion ?? []).map((c: HoneyEstimate['composicion'][number]) => ({ ...c, nombreComun: capitalize(c.nombreComun) })),
        };
        setHoney(h);
        AsyncStorage.setItem(key, JSON.stringify(h));
      } else {
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signature, session?.user.id]);

  return { honey, loading, error };
}
