export interface PollenSpecies {
  nombreComun: string;
  nombreCientifico: string;
  probabilidad: number;
  colorPolen: string;
  colorNombre: string;
  floracion: string;
  motivo?: string;
}

/** How useful the photo was: clear pollen, unclear/blurry, or no bee/pollen visible (estimate from place + date only). */
export type PhotoQuality = 'clara' | 'dudosa' | 'sin_polen';

export interface PollenAnalysis {
  id: string;
  createdAt: string;
  photoTakenAt: string;
  photoQuality: PhotoQuality | null;
  species: PollenSpecies[];
  latitude: number | null;
  longitude: number | null;
  placeName: string | null;
  pollenColor: string | null;
  pollenColorName: string | null;
  summary: string | null;
  temperature: number | null;
}

/** A plant bees can forage in an area during a month (polenbee-area-bloom). */
export interface AreaPlant {
  nombreCientifico: string;
  nombreComun: string;
  colorPolen: string;
  colorNombre: string;
  aporte: 'polen' | 'nectar' | 'ambos';
  importancia: 1 | 2 | 3;
  floracion: string;
  nota: string;
  observations: number;
  /** Percentage of the area's palette (0–100). */
  share: number;
}

export interface AreaBloom {
  month: number;
  summary: string;
  plants: AreaPlant[];
  /** Plant observations per month, January first. */
  monthly: number[];
  curveSource: 'flowering' | 'all';
}

export interface Place {
  label: string;
  latitude: number;
  longitude: number;
}

/** Estimated honey from the hive's pollen mix (polenbee-honey). */
export interface HoneyEstimate {
  tipo: 'monofloral' | 'multifloral';
  nombre: string;
  colorMiel: string;
  colorNombre: string;
  sabor: string;
  aroma: string;
  cristalizacion: string;
  nota: string;
  composicion: { nombreCientifico: string; nombreComun: string; porcentaje: number }[];
}
