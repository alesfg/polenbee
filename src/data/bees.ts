import { BeeLook, WORKER_LOOK } from '@/components/illustrations/BeeProfile';
import { language } from '@/i18n';

type Text = { es: string; en: string };
const tr = (t: Text) => t[language];

/* ---------- Honey bee races (Apis mellifera subspecies and common lines) ---------- */

export type RaceKey =
  | 'iberiensis'
  | 'mellifera'
  | 'ligustica'
  | 'carnica'
  | 'caucasica'
  | 'cecropia'
  | 'anatoliaca'
  | 'intermissa'
  | 'scutellata'
  | 'africanizada'
  | 'buckfast';

interface RaceDef {
  scientific: string;
  name: Text;
  origin: Text;
  traits: Text;
  look: BeeLook;
}

const DARK = '#2A211B';

export const RACES: Record<RaceKey, RaceDef> = {
  iberiensis: {
    scientific: 'Apis mellifera iberiensis',
    name: { es: 'Abeja ibérica', en: 'Iberian honey bee' },
    origin: { es: 'Península ibérica y Baleares', en: 'Iberian Peninsula and Balearic Islands' },
    traits: {
      es: 'Oscura y rústica. Aguanta el calor y la sequía, usa mucho propóleo y puede ser defensiva.',
      en: 'Dark and hardy. Copes with heat and drought, uses lots of propolis and can be defensive.',
    },
    look: { ...WORKER_LOOK, thorax: '#3A2D23', hair: '#8C7A62', abdomen: '#3B2C22', band: '#7A6450', bandWidth: 0.35 },
  },
  mellifera: {
    scientific: 'Apis mellifera mellifera',
    name: { es: 'Abeja negra europea', en: 'European dark bee' },
    origin: { es: 'Norte y oeste de Europa', en: 'Northern and western Europe' },
    traits: {
      es: 'Muy oscura y robusta, resistente al frío y ahorradora en invierno. Algo nerviosa en el panal.',
      en: 'Very dark and sturdy, cold-hardy and thrifty in winter. A bit nervous on the comb.',
    },
    look: { ...WORKER_LOOK, thorax: DARK, hair: '#6E6255', abdomen: '#241C17', band: '#4A3F36', bandWidth: 0.25 },
  },
  ligustica: {
    scientific: 'Apis mellifera ligustica',
    name: { es: 'Abeja italiana', en: 'Italian honey bee' },
    origin: { es: 'Italia; criada en todo el mundo', en: 'Italy; kept worldwide' },
    traits: {
      es: 'Dorada, muy mansa y prolífica. Produce mucho pero gasta reservas en invierno.',
      en: 'Golden, very gentle and prolific. Productive, but eats through stores in winter.',
    },
    look: { ...WORKER_LOOK, thorax: '#7A5A30', hair: '#E2C06E', abdomen: '#F0B640', band: '#5A3E22', bandWidth: 0.4 },
  },
  carnica: {
    scientific: 'Apis mellifera carnica',
    name: { es: 'Abeja carniola', en: 'Carniolan honey bee' },
    origin: { es: 'Eslovenia, Austria y los Balcanes', en: 'Slovenia, Austria and the Balkans' },
    traits: {
      es: 'Gris parda con pelos grises. Mansa, arranca rápido en primavera y enjambra con facilidad.',
      en: 'Grey-brown with grey hair. Gentle, builds up fast in spring and swarms readily.',
    },
    look: { ...WORKER_LOOK, thorax: '#4A433C', hair: '#B8B2A8', abdomen: '#5A4D42', band: '#A69E92', bandWidth: 0.5 },
  },
  caucasica: {
    scientific: 'Apis mellifera caucasia',
    name: { es: 'Abeja caucásica', en: 'Caucasian honey bee' },
    origin: { es: 'Cáucaso (Georgia)', en: 'Caucasus (Georgia)' },
    traits: {
      es: 'Gris plomo y de lengua muy larga. Mansa y gran productora de propóleo.',
      en: 'Lead-grey with a very long tongue. Gentle and a big propolis maker.',
    },
    look: { ...WORKER_LOOK, thorax: '#3F3D3B', hair: '#9E9A94', abdomen: '#4A4643', band: '#8C8781', bandWidth: 0.4 },
  },
  cecropia: {
    scientific: 'Apis mellifera cecropia',
    name: { es: 'Abeja griega', en: 'Greek honey bee' },
    origin: { es: 'Sur de Grecia', en: 'Southern Greece' },
    traits: {
      es: 'Parda con bandas claras. Mansa y bien adaptada al clima mediterráneo.',
      en: 'Brown with light bands. Gentle and well suited to a Mediterranean climate.',
    },
    look: { ...WORKER_LOOK, thorax: '#4E3B2A', hair: '#BFA781', abdomen: '#7A5634', band: '#3A2A1E', bandWidth: 0.4 },
  },
  anatoliaca: {
    scientific: 'Apis mellifera anatoliaca',
    name: { es: 'Abeja de Anatolia', en: 'Anatolian honey bee' },
    origin: { es: 'Turquía', en: 'Turkey' },
    traits: {
      es: 'Oscura y frugal, muy resistente y longeva; de desarrollo lento.',
      en: 'Dark and frugal, very hardy and long-lived; slow to build up.',
    },
    look: { ...WORKER_LOOK, thorax: '#3A2E25', hair: '#9C8A72', abdomen: '#4A382A', band: '#806A52', bandWidth: 0.35 },
  },
  intermissa: {
    scientific: 'Apis mellifera intermissa',
    name: { es: 'Abeja tellian', en: 'Tellian bee' },
    origin: { es: 'Norte de África (Magreb)', en: 'North Africa (Maghreb)' },
    traits: {
      es: 'Negra brillante, muy defensiva y muy resistente al calor y a las enfermedades.',
      en: 'Shiny black, very defensive and very resistant to heat and disease.',
    },
    look: { ...WORKER_LOOK, thorax: '#1E1814', hair: '#5E5348', abdomen: '#1B1511', band: '#3A312A', bandWidth: 0.2 },
  },
  scutellata: {
    scientific: 'Apis mellifera scutellata',
    name: { es: 'Abeja africana', en: 'East African lowland bee' },
    origin: { es: 'África oriental y meridional', en: 'Eastern and southern Africa' },
    traits: {
      es: 'Pequeña, ágil y muy defensiva. Enjambra y abandona el nido con facilidad.',
      en: 'Small, nimble and very defensive. Swarms and absconds readily.',
    },
    look: { ...WORKER_LOOK, thorax: '#6A4A2A', hair: '#D2B57A', abdomen: '#D99A38', band: '#3A2716', bandWidth: 0.55, abdomenLength: 0.9 },
  },
  africanizada: {
    scientific: 'Apis mellifera (híbrido africanizado)',
    name: { es: 'Abeja africanizada', en: 'Africanized honey bee' },
    origin: { es: 'América Latina y sur de EE. UU.', en: 'Latin America and the southern US' },
    traits: {
      es: 'Híbrido con la africana: muy defensiva, enjambra mucho y se adapta a todo.',
      en: 'Hybrid with the African bee: very defensive, swarms a lot and adapts to anything.',
    },
    look: { ...WORKER_LOOK, thorax: '#5E4228', hair: '#CDB07A', abdomen: '#C98A34', band: '#352414', bandWidth: 0.55, abdomenLength: 0.92 },
  },
  buckfast: {
    scientific: 'Apis mellifera (línea Buckfast)',
    name: { es: 'Abeja Buckfast', en: 'Buckfast bee' },
    origin: { es: 'Creada en Inglaterra; criada en todo el mundo', en: 'Bred in England; kept worldwide' },
    traits: {
      es: 'Cruce seleccionado por el hermano Adam: mansa, productiva y poco enjambradora.',
      en: 'Selected cross by Brother Adam: gentle, productive and reluctant to swarm.',
    },
    look: { ...WORKER_LOOK, thorax: '#6A4C2E', hair: '#D7B46A', abdomen: '#D69A3C', band: '#4A321C', bandWidth: 0.45 },
  },
};

export const raceName = (k: RaceKey) => tr(RACES[k].name);
export const raceOrigin = (k: RaceKey) => tr(RACES[k].origin);
export const raceTraits = (k: RaceKey) => tr(RACES[k].traits);

/** Native and commonly kept races for a place (approximate, by region). */
export function racesForPlace(lat: number, lon: number): { native: RaceKey[]; kept: RaceKey[] } {
  const inBox = (la1: number, la2: number, lo1: number, lo2: number) => lat >= la1 && lat <= la2 && lon >= lo1 && lon <= lo2;
  if (inBox(35.8, 43.9, -9.8, 4.5)) return { native: ['iberiensis'], kept: ['buckfast', 'carnica'] };
  if (inBox(36.5, 47.1, 6.6, 18.6) && !inBox(43.5, 47.1, 6.6, 13.5)) return { native: ['ligustica'], kept: ['carnica', 'buckfast'] };
  if (inBox(34.8, 41.8, 19.3, 28.3)) return { native: ['cecropia'], kept: ['carnica', 'ligustica'] };
  if (inBox(35.8, 42.2, 26, 45)) return { native: ['anatoliaca'], kept: ['caucasica', 'carnica'] };
  if (inBox(40, 44, 39, 50)) return { native: ['caucasica'], kept: ['carnica'] };
  if (inBox(42, 51, 12, 30)) return { native: ['carnica'], kept: ['buckfast', 'ligustica'] };
  if (inBox(43.5, 71, -11, 30)) return { native: ['mellifera'], kept: ['carnica', 'buckfast', 'ligustica'] };
  if (inBox(27, 37.5, -13, 11.6)) return { native: ['intermissa'], kept: ['ligustica'] };
  if (inBox(-35, 15, -18, 52)) return { native: ['scutellata'], kept: [] };
  // The Americas have no native honey bees.
  if (lon < -30 && lat < 33) return { native: [], kept: ['africanizada', 'ligustica', 'carnica'] };
  if (lon < -30) return { native: [], kept: ['ligustica', 'carnica', 'buckfast'] };
  return { native: [], kept: ['ligustica', 'carnica', 'buckfast'] };
}

/* ---------- Castes ---------- */

export type CasteKey = 'obrera' | 'reina' | 'zangano';

export const CASTE_LOOK: Record<CasteKey, BeeLook> = {
  obrera: WORKER_LOOK,
  reina: { ...WORKER_LOOK, abdomenLength: 1.45, abdomenHeight: 0.95, abdomen: '#C9852E', band: '#4A2E18', bandWidth: 0.3 },
  zangano: { ...WORKER_LOOK, abdomenLength: 1.05, abdomenHeight: 1.25, bigEyes: true, sting: false, abdomen: '#B88435', band: '#3B2A1E', bandWidth: 0.55 },
};

/* ---------- Kinds of bees ---------- */

export type BeeKind = 'melifera' | 'abejorro' | 'carpintera' | 'albanil' | 'minera' | 'solitaria';

interface KindDef {
  name: Text;
  description: Text;
  look: BeeLook;
}

export const KINDS: Record<BeeKind, KindDef> = {
  melifera: {
    name: { es: 'Abeja melífera', en: 'Honey bee' },
    description: { es: 'Vive en colonias de miles y produce miel.', en: 'Lives in colonies of thousands and makes honey.' },
    look: WORKER_LOOK,
  },
  abejorro: {
    name: { es: 'Abejorro', en: 'Bumblebee' },
    description: { es: 'Grande y peludo; colonias pequeñas de un año. Poliniza con vibración.', en: 'Big and furry; small one-year colonies. Pollinates by buzzing.' },
    look: { ...WORKER_LOOK, head: '#1C1714', thorax: '#1C1714', hair: '#2A2420', abdomen: '#1C1714', band: '#F2C230', bandWidth: 1.6, abdomenLength: 0.95, abdomenHeight: 1.3, tail: '#F4EFE6', fluffy: true },
  },
  carpintera: {
    name: { es: 'Abeja carpintera', en: 'Carpenter bee' },
    description: { es: 'Negra brillante con alas violetas; excava su nido en la madera.', en: 'Shiny black with violet wings; digs its nest in wood.' },
    look: { ...WORKER_LOOK, head: '#141218', thorax: '#1A1720', hair: '#2A2632', abdomen: '#16131C', band: '#16131C', bandWidth: 0, abdomenLength: 1.05, abdomenHeight: 1.2, wing: '#6B4FA0', fluffy: true },
  },
  albanil: {
    name: { es: 'Abeja albañil o cortadora', en: 'Mason or leafcutter bee' },
    description: { es: 'Solitaria; cierra sus celdas con barro u hojas. Lleva el polen bajo el abdomen.', en: 'Solitary; seals its cells with mud or leaves. Carries pollen under its belly.' },
    look: { ...WORKER_LOOK, head: '#1E1A16', thorax: '#2E2620', hair: '#C9A27A', abdomen: '#B5652E', band: '#B5652E', bandWidth: 0, abdomenLength: 0.85, fluffy: true },
  },
  minera: {
    name: { es: 'Abeja minera', en: 'Mining bee' },
    description: { es: 'Solitaria; anida en túneles en el suelo, a menudo en primavera.', en: 'Solitary; nests in tunnels in the ground, often in spring.' },
    look: { ...WORKER_LOOK, head: '#2A221C', thorax: '#7A5A3A', hair: '#C79A62', abdomen: '#3A2E26', band: '#9A8064', bandWidth: 0.3, abdomenLength: 0.85 },
  },
  solitaria: {
    name: { es: 'Abeja solitaria', en: 'Solitary bee' },
    description: { es: 'Cada hembra hace su propio nido. Son la mayoría de las especies de abejas.', en: 'Each female builds her own nest. Most bee species are like this.' },
    look: { ...WORKER_LOOK, head: '#2A2420', thorax: '#3A322C', hair: '#B8A48A', abdomen: '#3A322C', band: '#C9B89C', bandWidth: 0.35, abdomenLength: 0.9 },
  },
};

export const kindName = (k: BeeKind) => tr(KINDS[k].name);
export const kindDescription = (k: BeeKind) => tr(KINDS[k].description);

/** Kind of bee from its genus. */
export function kindForGenus(scientificName: string): BeeKind {
  const genus = scientificName.split(' ')[0];
  if (genus === 'Apis') return 'melifera';
  if (genus === 'Bombus') return 'abejorro';
  if (genus === 'Xylocopa' || genus === 'Ceratina') return 'carpintera';
  if (['Osmia', 'Megachile', 'Anthidium', 'Rhodanthidium', 'Hoplitis', 'Chelostoma', 'Heriades', 'Anthidiellum'].includes(genus)) return 'albanil';
  if (['Andrena', 'Panurgus', 'Melitturga', 'Dasypoda'].includes(genus)) return 'minera';
  return 'solitaria';
}

export function isRaceKey(k: string): k is RaceKey {
  return k in RACES;
}

export function isBeeKind(k: string): k is BeeKind {
  return k in KINDS;
}
