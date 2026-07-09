export type HiveStatus = 'Fuerte' | 'Media' | 'Débil';

export interface Inspection {
  id: string;
  date: string;
  queenSeen: 'Sí' | 'No';
  brood: 'Abundante' | 'Moderada' | 'Escasa' | 'Ninguna';
  honey: 'Altas' | 'Medias' | 'Bajas';
  pollen: 'Altas' | 'Medias' | 'Bajas';
  varroa: 'Ninguno' | 'Leve' | 'Moderado' | 'Alto';
  loque: boolean;
  temperament: 'Tranquila' | 'Normal' | 'Agresiva';
  notes: string;
}

export interface Hive {
  id: string;
  code: string;
  type: 'Langstroth' | 'Layens' | 'Dadant';
  status: HiveStatus;
  queenAge: number;
  queenMark: string;
  lastInspection: string;
  apiaryId: string;
  attentionReason?: string;
  inspections: Inspection[];
}

export interface Apiary {
  id: string;
  name: string;
  location: string;
  hiveCount: number;
}

export interface Task {
  id: string;
  type: 'treatment' | 'feeding' | 'harvest' | 'inspection';
  title: string;
  date: string;
  apiary: string;
  done: boolean;
}

export interface PollenResult {
  nombreComun: string;
  nombreCientifico: string;
  probabilidad: number;
  colorPolen: string;
  colorNombre: string;
  floracion: string;
}

export interface PollenHistoryEntry {
  id: string;
  date: string;
  apiary: string;
  topSpecies: PollenResult;
  allSpecies: PollenResult[];
  imageUri?: string;
}

export const APIARIES: Apiary[] = [
  { id: 'a01', name: 'Valle del Jerte', location: 'Cáceres, Extremadura', hiveCount: 12 },
  { id: 'a02', name: 'Sierra de Gata', location: 'Cáceres, Extremadura', hiveCount: 8 },
  { id: 'a03', name: 'La Vera', location: 'Cáceres, Extremadura', hiveCount: 4 },
];

export const HIVES: Hive[] = [
  {
    id: 'c01', code: 'C-01', type: 'Langstroth', status: 'Fuerte',
    queenAge: 2, queenMark: 'Blanco · 2024', lastInspection: '15/06/2026', apiaryId: 'a01',
    inspections: [
      { id: 'i1', date: '15/06/2026', queenSeen: 'Sí', brood: 'Abundante', honey: 'Altas', pollen: 'Altas', varroa: 'Ninguno', loque: false, temperament: 'Tranquila', notes: 'Colonia en excelente estado.' },
      { id: 'i2', date: '01/06/2026', queenSeen: 'Sí', brood: 'Abundante', honey: 'Medias', pollen: 'Altas', varroa: 'Leve', loque: false, temperament: 'Tranquila', notes: '' },
    ],
  },
  {
    id: 'c02', code: 'C-02', type: 'Layens', status: 'Media',
    queenAge: 3, queenMark: 'Amarillo · 2023', lastInspection: '08/06/2026', apiaryId: 'a01',
    inspections: [
      { id: 'i3', date: '08/06/2026', queenSeen: 'Sí', brood: 'Moderada', honey: 'Medias', pollen: 'Medias', varroa: 'Leve', loque: false, temperament: 'Normal', notes: 'Vigilar reservas.' },
    ],
  },
  {
    id: 'c03', code: 'C-03', type: 'Langstroth', status: 'Débil',
    queenAge: 4, queenMark: 'Rojo · 2022', lastInspection: '01/06/2026', apiaryId: 'a01',
    attentionReason: 'Varroa moderado',
    inspections: [
      { id: 'i4', date: '01/06/2026', queenSeen: 'Sí', brood: 'Escasa', honey: 'Bajas', pollen: 'Bajas', varroa: 'Moderado', loque: false, temperament: 'Normal', notes: 'Tratar varroa urgente. Colonia débil.' },
    ],
  },
  {
    id: 'c04', code: 'C-04', type: 'Dadant', status: 'Fuerte',
    queenAge: 1, queenMark: 'Verde · 2025', lastInspection: '20/06/2026', apiaryId: 'a01',
    inspections: [
      { id: 'i5', date: '20/06/2026', queenSeen: 'Sí', brood: 'Abundante', honey: 'Altas', pollen: 'Altas', varroa: 'Ninguno', loque: false, temperament: 'Tranquila', notes: 'Reina joven muy productiva.' },
    ],
  },
  {
    id: 'c05', code: 'C-05', type: 'Langstroth', status: 'Fuerte',
    queenAge: 2, queenMark: 'Blanco · 2024', lastInspection: '18/06/2026', apiaryId: 'a01',
    attentionReason: 'Reina envejecida',
    inspections: [
      { id: 'i6', date: '18/06/2026', queenSeen: 'Sí', brood: 'Moderada', honey: 'Medias', pollen: 'Medias', varroa: 'Ninguno', loque: false, temperament: 'Normal', notes: '' },
    ],
  },
  { id: 'c06', code: 'C-06', type: 'Layens', status: 'Media', queenAge: 2, queenMark: 'Blanco · 2024', lastInspection: '12/06/2026', apiaryId: 'a02', inspections: [] },
  { id: 'c07', code: 'C-07', type: 'Dadant', status: 'Fuerte', queenAge: 1, queenMark: 'Verde · 2025', lastInspection: '14/06/2026', apiaryId: 'a02', inspections: [] },
  { id: 'c08', code: 'C-08', type: 'Langstroth', status: 'Fuerte', queenAge: 2, queenMark: 'Blanco · 2024', lastInspection: '10/06/2026', apiaryId: 'a03', inspections: [] },
];

export const TASKS: Task[] = [
  { id: 't1', type: 'treatment', title: 'Tratamiento varroa', date: '21 Jul', apiary: 'Valle del Jerte', done: false },
  { id: 't2', type: 'feeding', title: 'Alimentación complementaria', date: '18 Jul', apiary: 'Sierra de Gata', done: false },
  { id: 't3', type: 'inspection', title: 'Revisión general A-02', date: '25 Jul', apiary: 'Sierra de Gata', done: false },
  { id: 't4', type: 'harvest', title: 'Cosecha miel La Vera', date: '30 Jul', apiary: 'La Vera', done: false },
  { id: 't5', type: 'feeding', title: 'Control alimentación verano', date: '15 Jul', apiary: 'Valle del Jerte', done: false },
  { id: 't6', type: 'harvest', title: 'Cata miel Jerte', date: '10 Jun', apiary: 'Valle del Jerte', done: true },
  { id: 't7', type: 'inspection', title: 'Limpieza colmenares', date: '05 Jun', apiary: 'Todos', done: true },
];

export const HARVEST_DATA = {
  totalKg: 187,
  avgPerHive: 7.8,
  topProducer: 'C-07',
  seasons: [
    { label: 'T. 2024', kg: 142 },
    { label: 'T. 2025', kg: 168 },
    { label: 'T. 2026', kg: 187 },
  ],
  byHive: [
    { code: 'C-07', apiary: 'Sierra de Gata', kg: 24.3 },
    { code: 'C-04', apiary: 'Valle del Jerte', kg: 22.1 },
    { code: 'C-01', apiary: 'Valle del Jerte', kg: 19.8 },
    { code: 'C-08', apiary: 'La Vera', kg: 18.5 },
    { code: 'C-02', apiary: 'Valle del Jerte', kg: 15.2 },
    { code: 'C-05', apiary: 'Valle del Jerte', kg: 12.7 },
  ],
};

export const POLLEN_HISTORY: PollenHistoryEntry[] = [
  {
    id: 'p1',
    date: '08/07/2026',
    apiary: 'Valle del Jerte',
    topSpecies: { nombreComun: 'Jara', nombreCientifico: 'Cistus ladanifer', probabilidad: 48, colorPolen: '#8B3A2A', colorNombre: 'rojo oscuro', floracion: 'Abril - Junio' },
    allSpecies: [
      { nombreComun: 'Jara', nombreCientifico: 'Cistus ladanifer', probabilidad: 48, colorPolen: '#8B3A2A', colorNombre: 'rojo oscuro', floracion: 'Abril - Junio' },
      { nombreComun: 'Romero', nombreCientifico: 'Salvia rosmarinus', probabilidad: 32, colorPolen: '#C8A84B', colorNombre: 'amarillo dorado', floracion: 'Feb - Mayo' },
      { nombreComun: 'Castaño', nombreCientifico: 'Castanea sativa', probabilidad: 20, colorPolen: '#D4A520', colorNombre: 'amarillo', floracion: 'Junio - Julio' },
    ],
  },
  {
    id: 'p2',
    date: '25/06/2026',
    apiary: 'La Vera',
    topSpecies: { nombreComun: 'Castaño', nombreCientifico: 'Castanea sativa', probabilidad: 55, colorPolen: '#D4A520', colorNombre: 'amarillo', floracion: 'Junio - Julio' },
    allSpecies: [
      { nombreComun: 'Castaño', nombreCientifico: 'Castanea sativa', probabilidad: 55, colorPolen: '#D4A520', colorNombre: 'amarillo', floracion: 'Junio - Julio' },
      { nombreComun: 'Jara', nombreCientifico: 'Cistus ladanifer', probabilidad: 30, colorPolen: '#8B3A2A', colorNombre: 'rojo oscuro', floracion: 'Abril - Junio' },
      { nombreComun: 'Otras', nombreCientifico: 'Varias especies', probabilidad: 15, colorPolen: '#9A8A70', colorNombre: 'beige', floracion: 'Variable' },
    ],
  },
  {
    id: 'p3',
    date: '10/06/2026',
    apiary: 'Sierra de Gata',
    topSpecies: { nombreComun: 'Romero', nombreCientifico: 'Salvia rosmarinus', probabilidad: 60, colorPolen: '#C8A84B', colorNombre: 'amarillo dorado', floracion: 'Feb - Mayo' },
    allSpecies: [
      { nombreComun: 'Romero', nombreCientifico: 'Salvia rosmarinus', probabilidad: 60, colorPolen: '#C8A84B', colorNombre: 'amarillo dorado', floracion: 'Feb - Mayo' },
      { nombreComun: 'Lavanda', nombreCientifico: 'Lavandula angustifolia', probabilidad: 25, colorPolen: '#7B68B0', colorNombre: 'lavanda', floracion: 'Junio - Agosto' },
      { nombreComun: 'Otras', nombreCientifico: 'Varias especies', probabilidad: 15, colorPolen: '#9A8A70', colorNombre: 'beige', floracion: 'Variable' },
    ],
  },
];

export const FALLBACK_POLLEN: PollenResult[] = [
  { nombreComun: 'Jara', nombreCientifico: 'Cistus ladanifer', probabilidad: 45, colorPolen: '#8B3A2A', colorNombre: 'rojo oscuro', floracion: 'Abril - Junio' },
  { nombreComun: 'Romero', nombreCientifico: 'Salvia rosmarinus', probabilidad: 30, colorPolen: '#C8A84B', colorNombre: 'amarillo dorado', floracion: 'Feb - Mayo' },
  { nombreComun: 'Colza', nombreCientifico: 'Brassica napus', probabilidad: 15, colorPolen: '#E8D44D', colorNombre: 'amarillo brillante', floracion: 'Mar - Mayo' },
  { nombreComun: 'Otras', nombreCientifico: 'Varias especies', probabilidad: 10, colorPolen: '#9A8A70', colorNombre: 'beige', floracion: 'Variable' },
];
