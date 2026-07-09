import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Inspection, HIVES } from '@/data/mockData';
import { useSession } from './useSession';

export function useInspections(hiveId?: string | null) {
  const session = useSession();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetch() {
    if (!session || session.user.is_anonymous) {
      const hive = HIVES.find((h) => h.id === hiveId);
      setInspections(hive ? hive.inspections : []);
      setLoading(false);
      return;
    }
    if (!hiveId) { setInspections([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('polenbee_inspections')
      .select('id, inspected_at, queen_seen, brood, honey_reserves, pollen_reserves, varroa, loque, temperament, notes')
      .eq('hive_id', hiveId)
      .order('inspected_at', { ascending: false });

    if (data) {
      const mapped: Inspection[] = data.map((row) => ({
        id: row.id,
        date: new Date(row.inspected_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        queenSeen: row.queen_seen ? 'Sí' : 'No',
        brood: row.brood as Inspection['brood'],
        honey: row.honey_reserves as Inspection['honey'],
        pollen: row.pollen_reserves as Inspection['pollen'],
        varroa: row.varroa as Inspection['varroa'],
        loque: row.loque,
        temperament: row.temperament as Inspection['temperament'],
        notes: row.notes ?? '',
      }));
      setInspections(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (session !== undefined) fetch(); }, [session, hiveId]);

  async function addInspection(
    hiveIdArg: string,
    draft: {
      queenSeen: boolean;
      brood: string;
      honey: string;
      pollen: string;
      varroa: string;
      loque: boolean;
      temperament: string;
      notes: string;
    }
  ) {
    if (!session || session.user.is_anonymous) {
      const newInsp: Inspection = {
        id: `local-${Date.now()}`,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        queenSeen: draft.queenSeen ? 'Sí' : 'No',
        brood: draft.brood as Inspection['brood'],
        honey: draft.honey as Inspection['honey'],
        pollen: draft.pollen as Inspection['pollen'],
        varroa: draft.varroa as Inspection['varroa'],
        loque: draft.loque,
        temperament: draft.temperament as Inspection['temperament'],
        notes: draft.notes,
      };
      setInspections((prev) => [newInsp, ...prev]);
      return;
    }
    const { data, error } = await supabase
      .from('polenbee_inspections')
      .insert({
        hive_id: hiveIdArg,
        user_id: session.user.id,
        queen_seen: draft.queenSeen,
        brood: draft.brood,
        honey_reserves: draft.honey,
        pollen_reserves: draft.pollen,
        varroa: draft.varroa,
        loque: draft.loque,
        temperament: draft.temperament,
        notes: draft.notes || null,
      })
      .select('id, inspected_at, queen_seen, brood, honey_reserves, pollen_reserves, varroa, loque, temperament, notes')
      .single();
    if (!error && data) {
      const newInsp: Inspection = {
        id: data.id,
        date: new Date(data.inspected_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        queenSeen: data.queen_seen ? 'Sí' : 'No',
        brood: data.brood as Inspection['brood'],
        honey: data.honey_reserves as Inspection['honey'],
        pollen: data.pollen_reserves as Inspection['pollen'],
        varroa: data.varroa as Inspection['varroa'],
        loque: data.loque,
        temperament: data.temperament as Inspection['temperament'],
        notes: data.notes ?? '',
      };
      setInspections((prev) => [newInsp, ...prev]);
    }
  }

  return { inspections, loading, addInspection };
}
