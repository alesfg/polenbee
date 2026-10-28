import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Polyline, Rect, Stop, LinearGradient, Defs } from 'react-native-svg';

import { Flower, HexCell } from '@/components/illustrations/BeeBits';
import { BeeLook, BeeProfile, WORKER_LOOK } from '@/components/illustrations/BeeProfile';
import { HoneyJar } from '@/components/illustrations/HoneyJar';
import { Colors } from '@/constants/theme';
import { language } from '@/i18n';
import { Card, Float, Intro, L, learnStyles as s, Pulse, tl } from './LearnParts';

/* ---------- 9 · Anatomy (tap the parts) ---------- */

const ANATOMY_SIZE = 290;
const PARTS: { x: number; y: number; icon: string; name: L; text: L }[] = [
  { x: 26, y: 31, icon: '📡', name: { es: 'Antenas', en: 'Antennae' }, text: { es: 'Su nariz y su tacto: huelen las flores, las feromonas de la reina y notan las vibraciones de la danza.', en: 'Her nose and touch: they smell flowers and the queen’s pheromones and feel the vibrations of the dance.' } },
  { x: 41, y: 51, icon: '👁️', name: { es: 'Ojos compuestos', en: 'Compound eyes' }, text: { es: 'Cada uno tiene unas 6.900 facetas. Ven el ultravioleta y la luz polarizada del cielo para orientarse.', en: 'Each has about 6,900 facets. They see ultraviolet and the sky’s polarised light to navigate.' } },
  { x: 31, y: 66, icon: '👅', name: { es: 'Probóscide', en: 'Proboscis' }, text: { es: 'Una lengua-pajita que se despliega para sorber el néctar del fondo de las flores.', en: 'A straw-like tongue that unfolds to sip nectar from deep inside flowers.' } },
  { x: 96, y: 24, icon: '🪽', name: { es: 'Alas', en: 'Wings' }, text: { es: 'Dos pares que se enganchan en vuelo con unos ganchitos (hámulos). Baten unas 230 veces por segundo.', en: 'Two pairs that hook together in flight with tiny hooks (hamuli). They beat about 230 times a second.' } },
  { x: 66, y: 50, icon: '💪', name: { es: 'Tórax', en: 'Thorax' }, text: { es: 'Lleno de músculos de vuelo. Tiritando con ellos sin mover las alas calientan la colmena.', en: 'Packed with flight muscles. By shivering them without moving the wings they heat the hive.' } },
  { x: 81, y: 80, icon: '🧺', name: { es: 'Corbícula', en: 'Pollen basket' }, text: { es: 'Una “cesta” de pelos en las patas traseras donde aprietan el polen en bolitas. ¡Lo que fotografías en PolenBee!', en: 'A “basket” of hairs on the hind legs where pollen is packed into pellets. What you photograph in PollenBee!' } },
  { x: 112, y: 72, icon: '🕯️', name: { es: 'Glándulas de cera', en: 'Wax glands' }, text: { es: 'Bajo el abdomen, 4 pares de glándulas producen escamas de cera para construir el panal.', en: 'Under the abdomen, 4 pairs of glands make wax flakes to build comb.' } },
  { x: 145, y: 57, icon: '🪡', name: { es: 'Aguijón', en: 'Sting' }, text: { es: 'Solo las hembras lo tienen. El de la obrera tiene sierra y se queda clavado en la piel de los mamíferos.', en: 'Only females have one. A worker’s is barbed and stays stuck in mammal skin.' } },
];

export function AnatomyChapter() {
  const [selected, setSelected] = useState(5);
  const k = ANATOMY_SIZE / 160;
  const part = PARTS[selected];
  return (
    <View>
      <Intro
        title={{ es: 'El cuerpo de una abeja', en: 'A bee’s body' }}
        text={{ es: 'Toca los puntos para descubrir para qué sirve cada parte.', en: 'Tap the dots to find out what each part does.' }}
      />
      <Card index={0}>
        <View style={{ width: ANATOMY_SIZE, height: ANATOMY_SIZE * 0.625, alignSelf: 'center' }}>
          <BeeProfile size={ANATOMY_SIZE} pollenColor="#E8742C" />
          {PARTS.map((p, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelected(i)}
              hitSlop={10}
              style={[styles.hotspot, { left: p.x * k - 11, top: p.y * k - 11 }]}
            >
              {selected === i ? (
                <View style={[styles.dot, styles.dotOn]} />
              ) : (
                <Pulse amount={0.25}>
                  <View style={styles.dot} />
                </Pulse>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View key={selected} entering={FadeIn.duration(250)} style={styles.partInfo}>
          <Text style={s.h2}>
            {part.icon} {tl(part.name)}
          </Text>
          <Text style={s.body}>{tl(part.text)}</Text>
        </Animated.View>
        <View style={styles.partChips}>
          {PARTS.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => setSelected(i)} style={[styles.partChip, selected === i && styles.partChipOn]}>
              <Text style={[styles.partChipText, selected === i && styles.partChipTextOn]}>{tl(p.name)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </View>
  );
}

/* ---------- 10 · Pollination ---------- */

export function PollinationChapter() {
  const [stageWidth, setStageWidth] = useState(300);
  // From over the left flower to over the right one.
  const flight = Math.max(120, stageWidth - 100);
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1);
    return () => cancelAnimation(prog);
  }, []);
  // There and back between the two flowers in an arc, turning to face where she flies.
  const beeStyle = useAnimatedStyle(() => {
    const t = prog.value;
    const k = t < 0.5 ? t * 2 : (1 - t) * 2;
    return {
      transform: [{ translateX: k * flight }, { translateY: -Math.sin(k * Math.PI) * 46 }, { scaleX: t < 0.5 ? -1 : 1 }],
    };
  });

  return (
    <View>
      <Intro
        title={{ es: 'Polinización', en: 'Pollination' }}
        text={{
          es: 'Al ir de flor en flor, las abejas llevan polen de una a otra sin querer. Así las plantas se fecundan y dan frutos y semillas.',
          en: 'Going from flower to flower, bees carry pollen from one to the next without meaning to. That is how plants get fertilised and make fruit and seeds.',
        }}
      />
      <Card index={0} tint="#F3F8EC">
        <View style={styles.pollinationStage} onLayout={(e) => setStageWidth(e.nativeEvent.layout.width)}>
          <View style={[styles.stageFlower, { left: 6 }]}>
            <Flower size={58} petal="#F4A7B9" />
            <View style={styles.stem} />
          </View>
          <View style={[styles.stageFlower, { right: 6 }]}>
            <Flower size={58} petal="#B9A5E8" />
            <View style={styles.stem} />
          </View>
          <Animated.View style={[styles.flyer, beeStyle]}>
            <BeeProfile size={70} pollenColor="#F2C230" />
          </Animated.View>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.grain, { left: 64 + ((i + 1) / 6) * flight, top: 44 - Math.sin(((i + 1) / 6) * Math.PI) * 40 }]}>
              <Float amount={3} duration={900 + i * 150} delay={i * 120}>
                <View style={styles.grainDot} />
              </Float>
            </View>
          ))}
        </View>
      </Card>
      {[
        { icon: '🍎', text: { es: 'Unas 3 de cada 4 cosechas de alimentos dependen en parte de polinizadores: manzanas, almendras, tomates, café, girasol…', en: 'About 3 in 4 food crops depend partly on pollinators: apples, almonds, tomatoes, coffee, sunflowers…' } },
        { icon: '🎯', text: { es: 'Fidelidad floral: en cada viaje una abeja visita casi siempre la misma especie. Por eso cada bolita de polen suele ser de un solo color.', en: 'Flower constancy: on each trip a bee almost always visits the same species. That’s why each pollen pellet is usually a single colour.' } },
        { icon: '⚡', text: { es: 'Las abejas llevan carga eléctrica: el polen salta hacia ellas solo, y hasta notan el campo eléctrico de las flores.', en: 'Bees carry an electric charge: pollen jumps onto them, and they can even sense the electric field of flowers.' } },
      ].map((f, i) => (
        <Card key={i} index={i + 1}>
          <View style={s.row}>
            <Text style={{ fontSize: 26 }}>{f.icon}</Text>
            <Text style={[s.body, { flex: 1 }]}>{tl(f.text)}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

/* ---------- 11 · The beekeeping year ---------- */

const POPULATION = [18, 18, 28, 48, 78, 96, 100, 88, 70, 52, 32, 22];
const SEASONS: { months: number[]; icon: string; title: L; text: L }[] = [
  { months: [0, 1], icon: '❄️', title: { es: 'Racimo de invierno', en: 'Winter cluster' }, text: { es: 'Las abejas se apiñan alrededor de la reina y tiritan para mantener el calor. Comen la miel guardada y salen solo en días soleados.', en: 'Bees huddle around the queen and shiver to stay warm. They eat stored honey and only fly on sunny days.' } },
  { months: [2], icon: '🌱', title: { es: 'Despertar', en: 'Waking up' }, text: { es: 'Con las primeras flores la reina vuelve a poner y entra el primer polen fresco: la colonia empieza a crecer.', en: 'With the first flowers the queen starts laying again and fresh pollen comes in: the colony starts to grow.' } },
  { months: [3, 4], icon: '🐝', title: { es: 'Explosión de primavera', en: 'Spring build-up' }, text: { es: 'La población se dispara y llega la época de enjambres. El apicultor amplía la colmena para darles espacio.', en: 'The population soars and swarming season arrives. Beekeepers give the hive more room.' } },
  { months: [5, 6], icon: '🍯', title: { es: 'Gran mielada', en: 'Main honey flow' }, text: { es: 'Máximo de abejas y de flores: se llenan las alzas de miel y llega la cosecha.', en: 'Peak bees and peak flowers: the honey supers fill up and harvest time comes.' } },
  { months: [7], icon: '☀️', title: { es: 'Parón de verano', en: 'Summer dearth' }, text: { es: 'Con el calor y la sequía hay pocas flores. Necesitan agua cerca para refrescar la colmena.', en: 'Heat and drought mean few flowers. They need water nearby to cool the hive.' } },
  { months: [8, 9], icon: '🍂', title: { es: 'Preparando el invierno', en: 'Getting ready for winter' }, text: { es: 'Floraciones de otoño como la hiedra. Nacen las “abejas de invierno”, que vivirán meses. Se expulsa a los zánganos.', en: 'Autumn blooms such as ivy. “Winter bees” are born that will live for months. Drones are thrown out.' } },
  { months: [10, 11], icon: '🌙', title: { es: 'Recogimiento', en: 'Settling down' }, text: { es: 'La reina casi deja de poner y la colonia se encoge para gastar poco hasta la primavera.', en: 'The queen nearly stops laying and the colony shrinks to save energy until spring.' } },
];

function monthLabel(m: number) {
  const name = new Date(2024, m, 1).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' });
  return name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
}

export function YearChapter() {
  const [month, setMonth] = useState(new Date().getMonth());
  const season = SEASONS.find((x) => x.months.includes(month)) ?? SEASONS[0];
  const W = 300;
  const H = 90;
  const pts = POPULATION.map((p, i) => `${(i / 11) * W},${H - (p / 100) * (H - 8)}`).join(' ');
  const mx = (month / 11) * W;
  const my = H - (POPULATION[month] / 100) * (H - 8);
  return (
    <View>
      <Intro
        title={{ es: 'El año de una colmena', en: 'A hive’s year' }}
        text={{
          es: 'La colonia cambia con las estaciones: de unas 10.000 abejas en invierno a más de 50.000 en verano. Toca un mes. (Hemisferio norte; en el sur va al revés).',
          en: 'The colony changes with the seasons: from about 10,000 bees in winter to over 50,000 in summer. Tap a month. (Northern hemisphere; it’s reversed in the south.)',
        }}
      />
      <Card index={0}>
        <Text style={s.small}>{tl({ es: 'Población de la colonia', en: 'Colony population' })}</Text>
        <Svg width="100%" height={H + 10} viewBox={`-6 -4 ${W + 12} ${H + 10}`}>
          <Defs>
            <LinearGradient id="yearFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.honeyPrimary} stopOpacity={0.35} />
              <Stop offset="1" stopColor={Colors.honeyPrimary} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`M0,${H} L${pts.split(' ').join(' L')} L${W},${H} Z`} fill="url(#yearFill)" />
          <Polyline points={pts} fill="none" stroke={Colors.honeyPrimary} strokeWidth={3} strokeLinejoin="round" />
          <Line x1={mx} y1={0} x2={mx} y2={H} stroke={Colors.honeyDark} strokeWidth={1} strokeDasharray="3 3" />
          <Circle cx={mx} cy={my} r={6} fill={Colors.honeyDark} stroke="#fff" strokeWidth={2} />
        </Svg>
        <View style={styles.months}>
          {POPULATION.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setMonth(i)} style={[styles.month, month === i && styles.monthOn]} hitSlop={4}>
              <Text style={[styles.monthText, month === i && styles.monthTextOn]}>{monthLabel(i)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      <Animated.View key={season.icon} entering={FadeInDown.duration(300)}>
        <Card tint="#FFF8EA">
          <View style={s.row}>
            <Pulse>
              <Text style={{ fontSize: 40 }}>{season.icon}</Text>
            </Pulse>
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{tl(season.title)}</Text>
              <Text style={s.body}>{tl(season.text)}</Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    </View>
  );
}

/* ---------- 12 · How bees see ---------- */

export function VisionChapter() {
  const [bee, setBee] = useState(false);
  return (
    <View>
      <Intro
        title={{ es: 'Cómo ven las abejas', en: 'How bees see' }}
        text={{
          es: 'Las abejas no ven el rojo, pero sí el ultravioleta. Muchas flores tienen dibujos ultravioleta, invisibles para nosotros, que señalan dónde está el néctar.',
          en: 'Bees can’t see red, but they do see ultraviolet. Many flowers have UV patterns, invisible to us, that point to the nectar.',
        }}
      />
      <Card index={0}>
        <View style={styles.visionToggle}>
          {[false, true].map((v) => (
            <TouchableOpacity key={String(v)} onPress={() => setBee(v)} style={[styles.visionBtn, bee === v && styles.visionBtnOn]}>
              <Text style={[styles.visionBtnText, bee === v && styles.visionBtnTextOn]}>
                {v ? tl({ es: '🐝 Como una abeja', en: '🐝 As a bee' }) : tl({ es: '👀 Como tú', en: '👀 As you' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View key={String(bee)} entering={FadeIn.duration(450)} style={[styles.visionStage, bee && { backgroundColor: '#2C2A4A' }]}>
          <Svg width={180} height={180} viewBox="0 0 100 100">
            <G>
              {Array.from({ length: 10 }).map((_, i) => (
                <Ellipse
                  key={i}
                  cx="50"
                  cy="22"
                  rx="9"
                  ry="22"
                  transform={`rotate(${i * 36} 50 50)`}
                  fill={bee ? '#C9C2F2' : '#F6D23A'}
                  stroke={bee ? '#A49BE0' : '#E2B91E'}
                  strokeWidth={0.8}
                />
              ))}
            </G>
            {bee ? <Circle cx="50" cy="50" r="24" fill="#3B2A6A" opacity={0.85} /> : null}
            {bee
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Line key={i} x1="50" y1="50" x2="50" y2="18" stroke="#3B2A6A" strokeWidth={2.5} transform={`rotate(${i * 36 + 18} 50 50)`} opacity={0.7} />
                ))
              : null}
            <Circle cx="50" cy="50" r="11" fill={bee ? '#1E1640' : '#C9851E'} />
          </Svg>
          {bee ? <Text style={styles.visionNote}>{tl({ es: 'La “diana” ultravioleta guía hasta el néctar', en: 'The UV “bullseye” leads to the nectar' })}</Text> : null}
        </Animated.View>
      </Card>
      <Card index={1}>
        <Text style={s.h2}>{tl({ es: 'Colores que vemos', en: 'Colours we see' })}</Text>
        <Spectrum label={tl({ es: 'Personas', en: 'People' })} from={0.25} to={1} />
        <Spectrum label={tl({ es: 'Abejas', en: 'Bees' })} from={0} to={0.78} />
        <View style={styles.specLabels}>
          <Text style={s.small}>UV</Text>
          <Text style={s.small}>{tl({ es: 'violeta · azul · verde · amarillo', en: 'violet · blue · green · yellow' })}</Text>
          <Text style={s.small}>{tl({ es: 'rojo', en: 'red' })}</Text>
        </View>
        <Text style={[s.body, { marginTop: 8 }]}>
          {tl({
            es: 'Por eso las flores que polinizan las abejas suelen ser azules, violetas, amarillas o blancas. Las rojas suelen ser para colibríes.',
            en: 'That’s why bee-pollinated flowers tend to be blue, violet, yellow or white. Red ones are usually for hummingbirds.',
          })}
        </Text>
      </Card>
    </View>
  );
}

function Spectrum({ label, from, to }: { label: string; from: number; to: number }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={s.small}>{label}</Text>
      <View style={styles.specTrack}>
        <Svg width="100%" height={14} viewBox="0 0 100 14" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#5A3E9E" />
              <Stop offset="0.25" stopColor="#7B4FD0" />
              <Stop offset="0.42" stopColor="#3B6FD8" />
              <Stop offset="0.58" stopColor="#4CAF50" />
              <Stop offset="0.75" stopColor="#F2D23A" />
              <Stop offset="1" stopColor="#D8402E" />
            </LinearGradient>
          </Defs>
          <Rect x={from * 100} y={0} width={(to - from) * 100} height={14} rx={7} fill="url(#spec)" />
        </Svg>
      </View>
    </View>
  );
}

/* ---------- 13 · Hive products ---------- */

const PRODUCTS: { art: 'jar' | 'wax' | 'propolis' | 'pollen' | 'jelly' | 'venom'; name: L; text: L }[] = [
  { art: 'jar', name: { es: 'Miel', en: 'Honey' }, text: { es: 'Su despensa de energía. Nunca se estropea: se ha encontrado miel comestible de hace 3.000 años.', en: 'Their energy store. It never spoils: edible honey 3,000 years old has been found.' } },
  { art: 'wax', name: { es: 'Cera', en: 'Wax' }, text: { es: 'Para construir el panal. La usamos en velas, cosmética y para hacer láminas nuevas para las colmenas.', en: 'To build comb. We use it in candles, cosmetics and to make new foundation for hives.' } },
  { art: 'propolis', name: { es: 'Propóleo', en: 'Propolis' }, text: { es: 'Resina de los árboles mezclada con cera: tapa grietas y protege la colmena de microbios.', en: 'Tree resin mixed with wax: it seals cracks and protects the hive from microbes.' } },
  { art: 'pollen', name: { es: 'Polen', en: 'Pollen' }, text: { es: 'Su fuente de proteína para criar larvas. Guardado en el panal y fermentado se llama “pan de abeja”.', en: 'Their protein source for raising larvae. Stored and fermented in the comb it’s called “bee bread”.' } },
  { art: 'jelly', name: { es: 'Jalea real', en: 'Royal jelly' }, text: { es: 'Secreción de las nodrizas. La reina se alimenta solo de ella toda su vida.', en: 'Secreted by nurse bees. The queen eats nothing else her whole life.' } },
  { art: 'venom', name: { es: 'Apitoxina', en: 'Bee venom' }, text: { es: 'El veneno del aguijón. Se estudia en medicina, aunque puede causar alergias graves.', en: 'The sting’s venom. It is studied in medicine, though it can cause serious allergies.' } },
];

function ProductArt({ art }: { art: (typeof PRODUCTS)[number]['art'] }) {
  if (art === 'jar') return <HoneyJar size={52} />;
  if (art === 'wax') return <HexCell size={46} kind="capped" />;
  if (art === 'pollen')
    return (
      <Svg width={56} height={56} viewBox="0 0 56 56">
        {['#E8742C', '#F2C230', '#B33A2E', '#4B4FA0', '#D9C9A3', '#7FA04A'].map((c, i) => (
          <Circle key={c} cx={14 + (i % 3) * 14} cy={20 + Math.floor(i / 3) * 16} r={7} fill={c} />
        ))}
      </Svg>
    );
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56">
      {art === 'propolis' ? <Path d="M10 40 C 14 20, 30 12, 44 18 C 50 30, 40 46, 22 46 C 16 46, 10 44, 10 40 Z" fill="#7A4A1E" /> : null}
      {art === 'jelly' ? <Ellipse cx={28} cy={32} rx={18} ry={12} fill="#FFF6DA" stroke="#E8D9A8" strokeWidth={2} /> : null}
      {art === 'venom' ? <Path d="M28 8 C 38 24, 42 32, 42 38 A 14 14 0 0 1 14 38 C 14 32, 18 24, 28 8 Z" fill="#E7EEF2" stroke="#9FB8C6" strokeWidth={2} /> : null}
    </Svg>
  );
}

export function ProductsChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'Los tesoros de la colmena', en: 'Treasures of the hive' }}
        text={{ es: 'Las abejas fabrican mucho más que miel.', en: 'Bees make much more than honey.' }}
      />
      <View style={styles.grid}>
        {PRODUCTS.map((p, i) => (
          <Animated.View key={p.art} entering={ZoomIn.delay(80 + i * 90).duration(350)} style={styles.product}>
            <Float amount={3} delay={i * 200}>
              <ProductArt art={p.art} />
            </Float>
            <Text style={[s.h2, { marginTop: 6 }]}>{tl(p.name)}</Text>
            <Text style={s.small}>{tl(p.text)}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/* ---------- 14 · Threats ---------- */

const HORNET_LOOK: BeeLook = {
  ...WORKER_LOOK,
  head: '#2A1E14',
  thorax: '#1E1610',
  hair: '#3A2A1E',
  abdomen: '#241A12',
  band: '#E8A33A',
  bandWidth: 0.3,
  abdomenLength: 1.1,
  tail: '#E8A33A',
};

const THREATS: { art: 'varroa' | 'hornet' | 'spray' | 'field' | 'heat'; name: L; text: L }[] = [
  { art: 'varroa', name: { es: 'Varroa', en: 'Varroa mite' }, text: { es: 'Un ácaro que se alimenta de las abejas y les transmite virus. Es el mayor problema de la apicultura en el mundo.', en: 'A mite that feeds on bees and spreads viruses to them. It is beekeeping’s biggest problem worldwide.' } },
  { art: 'hornet', name: { es: 'Avispa asiática', en: 'Asian hornet' }, text: { es: 'Vespa velutina: caza abejas en vuelo delante de la colmena. Si ves un nido, avisa a las autoridades.', en: 'Vespa velutina: it hunts bees in flight in front of the hive. If you see a nest, report it.' } },
  { art: 'spray', name: { es: 'Pesticidas', en: 'Pesticides' }, text: { es: 'Algunos, como los neonicotinoides, desorientan a las abejas aunque no las maten.', en: 'Some, like neonicotinoids, disorient bees even when they don’t kill them.' } },
  { art: 'field', name: { es: 'Menos flores', en: 'Fewer flowers' }, text: { es: 'Los monocultivos y el césped cortado dejan a las abejas sin comida variada.', en: 'Monocultures and mown lawns leave bees without varied food.' } },
  { art: 'heat', name: { es: 'Clima extremo', en: 'Extreme weather' }, text: { es: 'Sequías y olas de calor adelantan o acortan las floraciones.', en: 'Droughts and heatwaves bring blooms forward or cut them short.' } },
];

function ThreatArt({ art }: { art: (typeof THREATS)[number]['art'] }) {
  if (art === 'hornet') return <BeeProfile look={HORNET_LOOK} size={86} />;
  if (art === 'varroa')
    return (
      <Svg width={70} height={56} viewBox="0 0 70 56">
        <G stroke="#6A2A14" strokeWidth={2} strokeLinecap="round">
          {[-1, 1].map((side) =>
            [0, 1, 2, 3].map((i) => <Line key={`${side}${i}`} x1={35 + side * 10} y1={22 + i * 4} x2={35 + side * 24} y2={14 + i * 8} />)
          )}
        </G>
        <Ellipse cx={35} cy={28} rx={18} ry={12} fill="#8E3A1E" />
        <Ellipse cx={30} cy={24} rx={7} ry={3} fill="#FFFFFF" opacity={0.25} />
      </Svg>
    );
  const emoji = art === 'spray' ? '🧴' : art === 'field' ? '🌾' : '🌡️';
  return <Text style={{ fontSize: 40 }}>{emoji}</Text>;
}

export function ThreatsChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'Peligros para las abejas', en: 'Threats to bees' }}
        text={{
          es: 'Las abejas lo tienen difícil. Estos son sus principales enemigos.',
          en: 'Bees are having a hard time. These are their main enemies.',
        }}
      />
      {THREATS.map((th, i) => (
        <Card key={th.art} index={i}>
          <View style={s.row}>
            <View style={styles.threatArt}>
              <Float amount={2} delay={i * 180}>
                <ThreatArt art={th.art} />
              </Float>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{tl(th.name)}</Text>
              <Text style={s.body}>{tl(th.text)}</Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

/* ---------- 15 · How to help ---------- */

const ACTIONS: { icon: string; text: L }[] = [
  { icon: '🌼', text: { es: 'Planta flores autóctonas que florezcan en distintas épocas (romero, lavanda, tomillo…).', en: 'Plant native flowers that bloom at different times (rosemary, lavender, thyme…).' } },
  { icon: '🌿', text: { es: 'Deja crecer “malas hierbas” con flor: diente de león, trébol, cardos.', en: 'Let flowering “weeds” grow: dandelion, clover, thistles.' } },
  { icon: '💧', text: { es: 'Pon un plato con agua y piedras para que beban sin ahogarse.', en: 'Put out a dish of water with stones so they can drink without drowning.' } },
  { icon: '🚫', text: { es: 'Evita pesticidas en tu jardín o balcón.', en: 'Avoid pesticides in your garden or balcony.' } },
  { icon: '🏠', text: { es: 'Cuelga un hotel de abejas solitarias en un sitio soleado.', en: 'Hang a solitary bee hotel in a sunny spot.' } },
  { icon: '🍯', text: { es: 'Compra miel local a apicultores de tu zona.', en: 'Buy local honey from beekeepers near you.' } },
  { icon: '📸', text: { es: 'Fotografía abejas: tus análisis en PolenBee ayudan a conocer sus flores.', en: 'Photograph bees: your PollenBee analyses help map their flowers.' } },
];

export function HelpChapter() {
  const [done, setDone] = useState<boolean[]>(ACTIONS.map(() => false));
  const count = done.filter(Boolean).length;
  return (
    <View>
      <Intro
        title={{ es: 'Cómo ayudar a las abejas', en: 'How to help bees' }}
        text={{ es: 'Pequeños gestos que marcan la diferencia. ¿Cuántos haces ya?', en: 'Small things that make a difference. How many do you already do?' }}
      />
      {ACTIONS.map((a, i) => (
        <Animated.View key={i} entering={FadeInDown.delay(60 + i * 70).duration(350)}>
          <TouchableOpacity
            style={[styles.action, done[i] && styles.actionOn]}
            onPress={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>{a.icon}</Text>
            <Text style={[s.body, { flex: 1 }]}>{tl(a.text)}</Text>
            <View style={[styles.check, done[i] && styles.checkOn]}>
              {done[i] ? (
                <Animated.Text entering={ZoomIn.duration(250)} style={styles.checkMark}>
                  ✓
                </Animated.Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
      {count > 0 ? (
        <Animated.View key={count} entering={FadeIn.duration(300)}>
          <Card tint={Colors.statusFuerteBg}>
            <Text style={s.h2}>
              {count === ACTIONS.length
                ? tl({ es: '🏆 ¡Eres un gran aliado de las abejas!', en: '🏆 You’re a great friend to bees!' })
                : tl({ es: `🐝 ¡Ya haces ${count}! Prueba alguno más.`, en: `🐝 You already do ${count}! Try one more.` })}
            </Text>
          </Card>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ---------- 16 · Quiz ---------- */

const QUIZ: { q: L; options: L[]; answer: number }[] = [
  { q: { es: '¿Cuántos huevos al día puede poner una reina?', en: 'How many eggs a day can a queen lay?' }, options: [{ es: '200', en: '200' }, { es: '2.000', en: '2,000' }, { es: '20.000', en: '20,000' }], answer: 1 },
  { q: { es: '¿Qué indica el ángulo de la danza?', en: 'What does the angle of the dance show?' }, options: [{ es: 'La distancia', en: 'The distance' }, { es: 'La dirección respecto al sol', en: 'The direction relative to the sun' }, { es: 'El tipo de flor', en: 'The kind of flower' }], answer: 1 },
  { q: { es: '¿Cuántos días tarda en nacer una obrera?', en: 'How many days does a worker take to emerge?' }, options: [{ es: '16', en: '16' }, { es: '21', en: '21' }, { es: '24', en: '24' }], answer: 1 },
  { q: { es: '¿Qué color NO ven las abejas?', en: 'Which colour can bees NOT see?' }, options: [{ es: 'Rojo', en: 'Red' }, { es: 'Azul', en: 'Blue' }, { es: 'Ultravioleta', en: 'Ultraviolet' }], answer: 0 },
  { q: { es: '¿Quién hace casi todo el trabajo?', en: 'Who does almost all the work?' }, options: [{ es: 'Los zánganos', en: 'The drones' }, { es: 'Las obreras', en: 'The workers' }, { es: 'La reina', en: 'The queen' }], answer: 1 },
  { q: { es: '¿De dónde sale la cera?', en: 'Where does wax come from?' }, options: [{ es: 'De las flores', en: 'From flowers' }, { es: 'De glándulas del abdomen', en: 'From glands in the abdomen' }, { es: 'Del polen', en: 'From pollen' }], answer: 1 },
  { q: { es: '¿Qué es la varroa?', en: 'What is varroa?' }, options: [{ es: 'Un ácaro parásito', en: 'A parasitic mite' }, { es: 'Una flor', en: 'A flower' }, { es: 'Un tipo de miel', en: 'A kind of honey' }], answer: 0 },
  { q: { es: '¿Cuánta miel hace una obrera en toda su vida?', en: 'How much honey does a worker make in her life?' }, options: [{ es: '1/12 de cucharadita', en: '1/12 of a teaspoon' }, { es: 'Un tarro', en: 'A jar' }, { es: 'Un vaso', en: 'A glass' }], answer: 0 },
];
const BEST_KEY = 'learn_quiz_best';

export function QuizChapter() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const finished = i >= QUIZ.length;

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then((v) => v && setBest(Number(v))).catch(() => {});
  }, []);

  function pick(o: number) {
    if (picked !== null) return;
    setPicked(o);
    if (o === QUIZ[i].answer) setScore((x) => x + 1);
  }

  function next() {
    const nextI = i + 1;
    setPicked(null);
    setI(nextI);
    if (nextI >= QUIZ.length && (best === null || score > best)) {
      setBest(score);
      AsyncStorage.setItem(BEST_KEY, String(score)).catch(() => {});
    }
  }

  function restart() {
    setI(0);
    setPicked(null);
    setScore(0);
  }

  if (finished) {
    const ratio = score / QUIZ.length;
    return (
      <View>
        <Intro title={{ es: 'Quiz de abejas', en: 'Bee quiz' }} text={{ es: '¡Terminado!', en: 'Done!' }} />
        <Animated.View entering={ZoomIn.duration(400)} style={styles.result}>
          <Float>
            <HoneyJar size={110} color={ratio > 0.7 ? '#E0A53A' : ratio > 0.4 ? '#EBC46B' : '#F2D99A'} />
          </Float>
          <Text style={styles.resultScore}>
            {score}/{QUIZ.length}
          </Text>
          <Text style={s.h2}>
            {ratio === 1
              ? tl({ es: '¡Eres una abeja reina del saber! 👑', en: 'Queen bee of knowledge! 👑' })
              : ratio > 0.6
                ? tl({ es: '¡Muy bien, pecoreadora experta!', en: 'Great job, expert forager!' })
                : tl({ es: 'Vuelve a los capítulos y repite 🐝', en: 'Go back to the chapters and try again 🐝' })}
          </Text>
          {best !== null ? <Text style={s.small}>{tl({ es: `Tu mejor resultado: ${best}/${QUIZ.length}`, en: `Your best: ${best}/${QUIZ.length}` })}</Text> : null}
          <TouchableOpacity style={styles.quizBtn} onPress={restart}>
            <Text style={styles.quizBtnText}>{tl({ es: 'Repetir', en: 'Try again' })}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const q = QUIZ[i];
  return (
    <View>
      <Intro title={{ es: 'Quiz de abejas', en: 'Bee quiz' }} text={{ es: '¿Cuánto has aprendido? 8 preguntas.', en: 'How much have you learned? 8 questions.' }} />
      <View style={styles.quizProgress}>
        {QUIZ.map((_, j) => (
          <View key={j} style={[styles.quizDot, j < i && styles.quizDotDone, j === i && styles.quizDotNow]} />
        ))}
      </View>
      <Animated.View key={i} entering={FadeInDown.duration(300)}>
        <Card>
          <Text style={styles.quizQ}>{tl(q.q)}</Text>
          {q.options.map((o, j) => {
            const right = picked !== null && j === q.answer;
            const wrong = picked === j && j !== q.answer;
            return (
              <TouchableOpacity key={j} onPress={() => pick(j)} activeOpacity={0.85} style={[styles.option, right && styles.optionRight, wrong && styles.optionWrong]}>
                <Text style={[styles.optionText, (right || wrong) && { color: '#fff' }]}>{tl(o)}</Text>
                {right ? <Animated.Text entering={ZoomIn} style={styles.optionMark}>✓</Animated.Text> : null}
                {wrong ? <Animated.Text entering={ZoomIn} style={styles.optionMark}>✗</Animated.Text> : null}
              </TouchableOpacity>
            );
          })}
          {picked !== null ? (
            <Animated.View entering={FadeIn.duration(250)}>
              <TouchableOpacity style={styles.quizBtn} onPress={next}>
                <Text style={styles.quizBtnText}>{i === QUIZ.length - 1 ? tl({ es: 'Ver resultado', en: 'See result' }) : tl({ es: 'Siguiente', en: 'Next' })}</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hotspot: { position: 'absolute', width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFFDD', borderWidth: 3, borderColor: Colors.greenDark },
  dotOn: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.greenDark, borderColor: '#fff' },
  partInfo: { backgroundColor: Colors.bg, borderRadius: 14, padding: 12, marginTop: 6, gap: 4 },
  partChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  partChip: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.bg },
  partChipOn: { backgroundColor: Colors.greenDark },
  partChipText: { fontFamily: 'NunitoSans-Bold', fontSize: 11.5, color: Colors.textMuted2 },
  partChipTextOn: { color: '#fff' },

  pollinationStage: { height: 150, justifyContent: 'flex-end' },
  stageFlower: { position: 'absolute', bottom: 0, alignItems: 'center' },
  stem: { width: 4, height: 50, backgroundColor: '#7FA04A', borderRadius: 2, marginTop: -6 },
  flyer: { position: 'absolute', left: 14, top: 40 },
  grain: { position: 'absolute' },
  grainDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2C230' },

  months: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  month: { width: '14.6%', alignItems: 'center', paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.bg },
  monthOn: { backgroundColor: Colors.honeyDark },
  monthText: { fontFamily: 'NunitoSans-Bold', fontSize: 12, color: Colors.textMuted2 },
  monthTextOn: { color: '#fff' },

  visionToggle: { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 12, padding: 4, marginBottom: 12 },
  visionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  visionBtnOn: { backgroundColor: Colors.card },
  visionBtnText: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.textMuted2 },
  visionBtnTextOn: { color: Colors.textPrimary },
  visionStage: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#EAF1DE', paddingVertical: 14 },
  visionNote: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12.5, color: '#E6E1FF', marginTop: 6 },
  specTrack: { height: 14, borderRadius: 7, backgroundColor: Colors.bg, overflow: 'hidden', marginTop: 4 },
  specLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  product: { width: '48%', flexGrow: 1, backgroundColor: Colors.card, borderRadius: 18, padding: 14, alignItems: 'flex-start' },

  threatArt: { width: 90, height: 64, alignItems: 'center', justifyContent: 'center' },

  action: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  actionOn: { borderColor: Colors.greenPrimary, backgroundColor: '#F3F8EC' },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: Colors.greenDark, borderColor: Colors.greenDark },
  checkMark: { color: '#fff', fontFamily: 'Nunito-Black', fontSize: 14 },

  quizProgress: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  quizDot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  quizDotDone: { backgroundColor: Colors.honeyPrimary },
  quizDotNow: { backgroundColor: Colors.honeyDark },
  quizQ: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  optionRight: { backgroundColor: Colors.greenPrimary },
  optionWrong: { backgroundColor: Colors.statusDebilFg },
  optionText: { fontFamily: 'NunitoSans-Bold', fontSize: 14.5, color: Colors.textPrimary },
  optionMark: { color: '#fff', fontFamily: 'Nunito-Black', fontSize: 16 },
  quizBtn: { backgroundColor: Colors.greenDark, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 6, alignSelf: 'stretch' },
  quizBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  result: { backgroundColor: Colors.card, borderRadius: 22, padding: 22, alignItems: 'center', gap: 8 },
  resultScore: { fontFamily: 'Nunito-Black', fontSize: 44, color: Colors.honeyDark },
});
