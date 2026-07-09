import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Apiary, APIARIES } from '@/data/mockData';
import { useSession } from './useSession';

export function useApiaries() {
  const session = useSession();
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetch() {
    if (!session) {
      setApiaries(APIARIES);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('polenbee_apiaries')
      .select('id, name, location')
      .order('created_at');

    if (data) {
      const mapped: Apiary[] = await Promise.all(
        data.map(async (row) => {
          const { count } = await supabase
            .from('polenbee_hives')
            .select('id', { count: 'exact', head: true })
            .eq('apiary_id', row.id);
          return { id: row.id, name: row.name, location: row.location, hiveCount: count ?? 0 };
        })
      );
      setApiaries(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (session !== undefined) fetch(); }, [session]);

  async function addApiary(name: string, location: string) {
    if (!session) return;
    const { data, error } = await supabase
      .from('polenbee_apiaries')
      .insert({ user_id: session.user.id, name, location })
      .select('id, name, location')
      .single();
    if (!error && data) {
      setApiaries((prev) => [...prev, { id: data.id, name: data.name, location: data.location, hiveCount: 0 }]);
    }
  }

  async function deleteApiary(id: string) {
    if (!session) return;
    await supabase.from('polenbee_apiaries').delete().eq('id', id);
    setApiaries((prev) => prev.filter((a) => a.id !== id));
  }

  return { apiaries, loading, refetch: fetch, addApiary, deleteApiary };
}
