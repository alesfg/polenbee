import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PollenHistoryEntry, PollenResult, POLLEN_HISTORY } from '@/data/mockData';
import { useSession } from './useSession';

async function uploadPollenImage(userId: string, imageUri: string): Promise<string | null> {
  try {
    const path = `${userId}/${Date.now()}.jpg`;
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('pollen-images').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) return null;
    const { data } = supabase.storage.from('pollen-images').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export function usePollenAnalyses() {
  const session = useSession();
  const [analyses, setAnalyses] = useState<PollenHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetch() {
    if (!session) {
      setAnalyses(POLLEN_HISTORY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('polenbee_pollen_analyses')
      .select('id, analyzed_at, image_url, species, polenbee_apiaries(name)')
      .order('analyzed_at', { ascending: false });

    if (data) {
      const mapped: PollenHistoryEntry[] = (data as any[])
        .map((row) => {
          const species: PollenResult[] = Array.isArray(row.species) ? row.species : [];
          if (!species.length) return null;
          return {
            id: row.id,
            date: new Date(row.analyzed_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            apiary: row.polenbee_apiaries?.name ?? '',
            topSpecies: species[0],
            allSpecies: species,
            imageUri: row.image_url ?? undefined,
          };
        })
        .filter(Boolean) as PollenHistoryEntry[];
      setAnalyses(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (session !== undefined) fetch(); }, [session]);

  async function saveAnalysis(species: PollenResult[], imageUri?: string, apiaryId?: string, apiaryName?: string) {
    const entry: PollenHistoryEntry = {
      id: `local-${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      apiary: apiaryName ?? '',
      topSpecies: species[0],
      allSpecies: species,
      imageUri,
    };
    setAnalyses((prev) => [entry, ...prev]);

    if (!session) return;

    let imageUrl: string | null = null;
    if (imageUri) {
      imageUrl = await uploadPollenImage(session.user.id, imageUri);
    }

    await supabase.from('polenbee_pollen_analyses').insert({
      user_id: session.user.id,
      apiary_id: apiaryId || null,
      species,
      image_url: imageUrl,
      analyzed_at: new Date().toISOString().split('T')[0],
    });
  }

  return { analyses, loading, saveAnalysis };
}
