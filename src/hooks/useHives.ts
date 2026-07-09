import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Hive, HiveStatus, HIVES } from '@/data/mockData';
import { useSession } from './useSession';

function computeStatus(queenAge: number): HiveStatus {
  if (queenAge <= 2) return 'Fuerte';
  if (queenAge === 3) return 'Media';
  return 'Débil';
}

export function useHives(apiaryId?: string | null) {
  const session = useSession();
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetch() {
    if (!session) {
      setHives(apiaryId ? HIVES.filter((h) => h.apiaryId === apiaryId) : HIVES);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('polenbee_hives')
      .select('id, apiary_id, code, type, queen_age, queen_marking, created_at')
      .order('created_at');
    if (apiaryId) query = query.eq('apiary_id', apiaryId);

    const { data } = await query;
    if (data) {
      const mapped: Hive[] = data.map((row) => ({
        id: row.id,
        code: row.code,
        type: row.type as Hive['type'],
        status: computeStatus(row.queen_age ?? 2),
        queenAge: row.queen_age ?? 2,
        queenMark: row.queen_marking ?? '',
        lastInspection: '',
        apiaryId: row.apiary_id,
        inspections: [],
      }));
      setHives(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (session !== undefined) fetch(); }, [session, apiaryId]);

  async function addHive(
    apiaryIdArg: string,
    code: string,
    type: string,
    queenAge: number,
    queenMarking: string
  ) {
    if (!session) return;
    const { data, error } = await supabase
      .from('polenbee_hives')
      .insert({ user_id: session.user.id, apiary_id: apiaryIdArg, code, type, queen_age: queenAge, queen_marking: queenMarking })
      .select('id, apiary_id, code, type, queen_age, queen_marking')
      .single();
    if (!error && data) {
      const newHive: Hive = {
        id: data.id,
        code: data.code,
        type: data.type as Hive['type'],
        status: computeStatus(data.queen_age ?? 2),
        queenAge: data.queen_age ?? 2,
        queenMark: data.queen_marking ?? '',
        lastInspection: '',
        apiaryId: data.apiary_id,
        inspections: [],
      };
      setHives((prev) => [...prev, newHive]);
    }
  }

  async function deleteHive(id: string) {
    if (!session) return;
    await supabase.from('polenbee_hives').delete().eq('id', id);
    setHives((prev) => prev.filter((h) => h.id !== id));
  }

  return { hives, loading, refetch: fetch, addHive, deleteHive };
}
