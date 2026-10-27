import { PhotoQuality, PollenAnalysis } from '@/types/pollen';

// Estimates from photos without visible pollen say more about the area than about the hive,
// so they count for less in the mix.
const QUALITY_WEIGHT: Record<PhotoQuality, number> = { clara: 1, dudosa: 0.6, sin_polen: 0.3 };

export interface PlantShare {
  nombreCientifico: string;
  nombreComun: string;
  colorPolen: string;
  /** % of the hive's pollen mix (0–100). */
  share: number;
  /** Analyses where it was the most likely plant. */
  topCount: number;
}

export interface PollenStats {
  total: number;
  plants: PlantShare[];
  /** One colour per analysis, newest first. */
  colors: { id: string; color: string; name: string | null }[];
  /** Analyses per calendar month, Jan..Dec. */
  byMonth: number[];
  firstAt: string | null;
  lastAt: string | null;
}

export function computeStats(analyses: PollenAnalysis[]): PollenStats {
  const plants = new Map<string, PlantShare & { weight: number }>();
  let totalWeight = 0;
  const byMonth = Array(12).fill(0);

  for (const a of analyses) {
    const w = QUALITY_WEIGHT[a.photoQuality ?? 'clara'];
    a.species.forEach((s, i) => {
      const weight = (s.probabilidad / 100) * w;
      totalWeight += weight;
      const prev = plants.get(s.nombreCientifico);
      plants.set(s.nombreCientifico, {
        nombreCientifico: s.nombreCientifico,
        nombreComun: prev?.nombreComun ?? s.nombreComun,
        colorPolen: prev?.colorPolen ?? s.colorPolen,
        share: 0,
        weight: (prev?.weight ?? 0) + weight,
        topCount: (prev?.topCount ?? 0) + (i === 0 ? 1 : 0),
      });
    });
    const month = new Date(a.photoTakenAt).getMonth();
    if (!Number.isNaN(month)) byMonth[month]++;
  }

  const sorted = [...plants.values()]
    .map(({ weight, ...p }) => ({ ...p, share: totalWeight ? (weight / totalWeight) * 100 : 0 }))
    .sort((a, b) => b.share - a.share);

  const dates = analyses.map((a) => a.photoTakenAt).sort();
  return {
    total: analyses.length,
    plants: sorted,
    colors: analyses.map((a) => ({ id: a.id, color: a.pollenColor ?? a.species[0]?.colorPolen ?? '#E3963E', name: a.pollenColorName })),
    byMonth,
    firstAt: dates[0] ?? null,
    lastAt: dates[dates.length - 1] ?? null,
  };
}
