import { useCallback, useEffect, useState } from 'react';

import { t } from '@/i18n';
import { mapAnalysisRow } from '@/lib/analyzePollen';
import { supabase } from '@/lib/supabase';
import { PollenAnalysis } from '@/types/pollen';
import { useSession } from './useSession';

export interface ZoneGroup {
  zone: string;
  analyses: PollenAnalysis[];
}

export function groupByZone(analyses: PollenAnalysis[]): ZoneGroup[] {
  const groups = new Map<string, PollenAnalysis[]>();
  for (const a of analyses) {
    const zone = a.placeName ?? t('history.noLocation');
    groups.set(zone, [...(groups.get(zone) ?? []), a]);
  }
  return [...groups.entries()].map(([zone, list]) => ({ zone, analyses: list }));
}

export function usePollenAnalyses() {
  const session = useSession();
  const [analyses, setAnalyses] = useState<PollenAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setLoading(session === undefined);
      return;
    }
    const { data } = await supabase
      .from('polenbee_pollen_analyses')
      .select('id, created_at, photo_taken_at, photo_quality, species, latitude, longitude, place_name, pollen_color, pollen_color_name, context')
      .order('photo_taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setAnalyses(data.map(mapAnalysisRow).filter((a) => a.species.length > 0));
    setLoading(false);
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  const addLocal = useCallback(
    (a: PollenAnalysis) =>
      setAnalyses((prev) => [a, ...prev].sort((x, y) => y.photoTakenAt.localeCompare(x.photoTakenAt))),
    []
  );

  return { analyses, loading, refresh, addLocal };
}
