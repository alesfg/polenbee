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

export interface Place {
  label: string;
  latitude: number;
  longitude: number;
}
