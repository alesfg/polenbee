import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Hive, HiveStatus, HIVES } from '@/data/mockData';
import { useSession } from './useSession';

function computeHiveStatus(lastInspection?: { varroa: string; brood: string }): { status: HiveStatus; attentionReason?: string } {
  if (!lastInspection) return { status: 'Media' };
  const { varroa, brood } = lastInspection;
  if (varroa === 'Alto' || brood === 'Ninguna')
    return { status: 'Débil', attentionReason: varroa === 'Alto' ? 'Varroa alto' : 'Sin cría' };
  if (varroa === 'Moderado' || brood === 'Escasa')
    return { status: 'Media', attentionReason: varroa === 'Moderado' ? 'Varroa moderado' : undefined };
  return { status: 'Fuerte' };
}

export function useHives(apiaryId?: string | null) {
  const session = useSession();
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetch() {
    if (!session || session.user.is_anonymous) {
      setHives(apiaryId ? HIVES.filter((h) => h.apiaryId === apiaryId) : HIVES);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('polenbee_hives')
      .select(`
        id, apiary_id, code, type, queen_age, queen_marking, created_at,
        polenbee_inspections(varroa, brood, temperament, inspected_at)
      `)
      .order('created_at')
      .order('inspected_at', { referencedTable: 'polenbee_inspections', ascending: false });

    if (apiaryId) query = (query as any).eq('apiary_id', apiaryId);

    const { data } = await query;
    if (data) {
      const mapped: Hive[] = (data as any[]).map((row) => {
        const inspections: any[] = Array.isArray(row.polenbee_inspections) ? row.polenbee_inspections : [];
        const last = inspections[0];
        const { status, attentionReason } = computeHiveStatus(last);
        const lastDate = last ? new Date(last.inspected_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
        return {
          id: row.id,
          code: row.code,
          type: row.type as Hive['type'],
          status,
          attentionReason,
          queenAge: row.queen_age ?? 2,
          queenMark: row.queen_marking ?? '',
          lastInspection: lastDate,
          apiaryId: row.apiary_id,
          inspections: [],
        };
      });
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
    if (!session || session.user.is_anonymous) {
      const newHive: Hive = {
        id: `local-${Date.now()}`,
        code,
        type: type as Hive['type'],
        status: 'Media',
        queenAge,
        queenMark: queenMarking,
        lastInspection: '',
        apiaryId: apiaryIdArg,
        inspections: [],
      };
      setHives((prev) => [...prev, newHive]);
      return;
    }
    const { data, error } = await supabase
      .from('polenbee_hives')
      .insert({ user_id: session.user.id, apiary_id: apiaryIdArg, code, type, queen_age: queenAge, queen_marking: queenMarking })
      .select('id, apiary_id, code, type, queen_age, queen_marking')
      .single();
    if (!error && data) {
      const newHive: Hive = {
        id: (data as any).id,
        code: (data as any).code,
        type: (data as any).type as Hive['type'],
        status: 'Media',
        queenAge: (data as any).queen_age ?? 2,
        queenMark: (data as any).queen_marking ?? '',
        lastInspection: '',
        apiaryId: (data as any).apiary_id,
        inspections: [],
      };
      setHives((prev) => [...prev, newHive]);
    }
  }

  async function deleteHive(id: string) {
    setHives((prev) => prev.filter((h) => h.id !== id));
    if (session && !session.user.is_anonymous) {
      await supabase.from('polenbee_hives').delete().eq('id', id);
    }
  }

  return { hives, loading, refetch: fetch, addHive, deleteHive };
}
