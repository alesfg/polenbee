import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HARVEST_DATA } from '@/data/mockData';
import { useSession } from './useSession';

export interface HarvestRow {
  id: string;
  hiveId: string;
  hiveCode: string;
  apiaryName: string;
  harvestedAt: string;
  kg: number;
  season: string;
  notes?: string;
}

export function useHarvests() {
  const session = useSession();
  const [harvests, setHarvests] = useState<HarvestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  async function fetch() {
    if (!session || session.user.is_anonymous) {
      setUsingMock(true);
      setLoading(false);
      return;
    }
    setUsingMock(false);
    setLoading(true);
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const { data } = await supabase
      .from('polenbee_harvests')
      .select('id, hive_id, harvested_at, kg, season, notes, polenbee_hives(code, polenbee_apiaries(name))')
      .gte('harvested_at', yearStart)
      .order('harvested_at', { ascending: false });

    if (data) {
      const mapped: HarvestRow[] = (data as any[]).map((row) => ({
        id: row.id,
        hiveId: row.hive_id,
        hiveCode: row.polenbee_hives?.code ?? '',
        apiaryName: row.polenbee_hives?.polenbee_apiaries?.name ?? '',
        harvestedAt: row.harvested_at,
        kg: row.kg,
        season: row.season,
        notes: row.notes,
      }));
      setHarvests(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (session !== undefined) fetch(); }, [session]);

  async function addHarvest(hiveId: string, kg: number, season: string, harvestedAt: string, notes?: string) {
    if (!session || session.user.is_anonymous) {
      setHarvests((prev) => [{ id: `local-${Date.now()}`, hiveId, hiveCode: hiveId, apiaryName: '', harvestedAt, kg, season, notes }, ...prev]);
      return;
    }
    const { data, error } = await supabase
      .from('polenbee_harvests')
      .insert({ user_id: session.user.id, hive_id: hiveId, kg, season, harvested_at: harvestedAt, notes: notes || null })
      .select('id, hive_id, harvested_at, kg, season, notes, polenbee_hives(code, polenbee_apiaries(name))')
      .single();
    if (!error && data) {
      const row = data as any;
      setHarvests((prev) => [{
        id: row.id,
        hiveId: row.hive_id,
        hiveCode: row.polenbee_hives?.code ?? '',
        apiaryName: row.polenbee_hives?.polenbee_apiaries?.name ?? '',
        harvestedAt: row.harvested_at,
        kg: row.kg,
        season: row.season,
        notes: row.notes,
      }, ...prev]);
    }
  }

  async function deleteHarvest(id: string) {
    setHarvests((prev) => prev.filter((h) => h.id !== id));
    if (session && !session.user.is_anonymous) {
      await supabase.from('polenbee_harvests').delete().eq('id', id);
    }
  }

  const totalKg = usingMock
    ? HARVEST_DATA.totalKg
    : +harvests.reduce((s, h) => s + h.kg, 0).toFixed(1);

  return { harvests, loading, usingMock, mockData: HARVEST_DATA, totalKg, refetch: fetch, addHarvest, deleteHarvest };
}
