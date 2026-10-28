import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { CellKind, Flower, HexCell, TopBee } from '@/components/illustrations/BeeBits';
import { HoneyJar } from '@/components/illustrations/HoneyJar';
import { Colors } from '@/constants/theme';
import { Card, CountUp, Float, GrowBar, Intro, L, learnStyles as s, Pulse, tl } from './LearnParts';

/* ---------- 4 · The waggle dance ---------- */

const DANCE_HALF = 46;
const DIRECTIONS: { angle: number; label: L }[] = [
  { angle: 0, label: { es: 'Hacia el sol', en: 'Towards the sun' } },
  { angle: 60, label: { es: '60° a la derecha del sol', en: '60° right of the sun' } },
  { angle: -120, label: { es: 'Casi de espaldas al sol', en: 'Almost away from the sun' } },
];

export function DanceChapter() {
  const [dir, setDir] = useState(1);
  const angle = DIRECTIONS[dir].angle;
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1);
    return () => cancelAnimation(prog);
  }, []);

  // Figure of eight: a straight waggle run up the comb, then a loop back down, alternating sides.
  const beeStyle = useAnimatedStyle(() => {
    const t = prog.value;
    const second = t >= 0.5;
    const u = second ? (t - 0.5) * 2 : t * 2;
    const side = second ? -1 : 1;
    let x = 0;
    let y = 0;
    let rot = 0;
    if (u < 0.5) {
      const k = u * 2;
      y = DANCE_HALF - k * 2 * DANCE_HALF;
      x = Math.sin(k * Math.PI * 14) * 5;
      rot = Math.sin(k * Math.PI * 14) * 18;
    } else {
      const k = (u - 0.5) * 2;
      const a = Math.PI * k;
      x = side * DANCE_HALF * Math.sin(a);
      y = -DANCE_HALF * Math.cos(a);
      rot = side * (90 + k * 180);
    }
    return { transform: [{ translateX: x }, { translateY: y }, { rotate: `${rot}deg` }] };
  });

  const rad = (angle * Math.PI) / 180;
  const fx = 70 + Math.sin(rad) * 52;
  const fy = 78 - Math.cos(rad) * 52;

  return (
    <View>
      <Intro
        title={{ es: 'La danza de las abejas', en: 'The waggle dance' }}
        text={{
          es: 'Cuando una exploradora encuentra buenas flores, vuelve y baila sobre el panal para contar a las demás dónde están.',
          en: 'When a scout finds good flowers, she comes back and dances on the comb to tell the others where they are.',
        }}
      />
      <Card index={0}>
        <View style={styles.danceRow}>
          <View style={styles.comb}>
            <View style={[styles.danceArea, { transform: [{ rotate: `${angle}deg` }] }]}>
              <Svg width={120} height={120} viewBox="0 0 120 120" style={StyleSheet.absoluteFill}>
                <Path
                  d={`M60 ${60 + DANCE_HALF} L60 ${60 - DANCE_HALF} A${DANCE_HALF} ${DANCE_HALF} 0 0 1 60 ${60 + DANCE_HALF} A${DANCE_HALF} ${DANCE_HALF} 0 0 1 60 ${60 - DANCE_HALF}`}
                  stroke="#C98A34"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                  opacity={0.55}
                />
                <Path d={`M60 ${60 - DANCE_HALF - 2} l-5 9 h10 Z`} fill="#C98A34" opacity={0.7} />
              </Svg>
              <Animated.View style={[styles.dancer, beeStyle]}>
                <TopBee size={30} />
              </Animated.View>
            </View>
            <Text style={styles.combLabel}>{tl({ es: 'En el panal', en: 'On the comb' })}</Text>
          </View>
          <View style={styles.map}>
            <Svg width={140} height={150} viewBox="0 0 140 150">
              <Line x1={70} y1={78} x2={70} y2={18} stroke={Colors.honeyLight} strokeWidth={2} strokeDasharray="4 4" />
              <Line x1={70} y1={78} x2={fx} y2={fy} stroke={Colors.honeyDark} strokeWidth={3} strokeLinecap="round" />
              <Path d="M66 78 h8 v10 h-8 Z" fill="#B98552" />
            </Svg>
            <View style={styles.sun}>
              <Pulse>
                <Text style={{ fontSize: 22 }}>☀️</Text>
              </Pulse>
            </View>
            <View style={[styles.mapFlower, { left: fx - 14, top: fy - 14 }]}>
              <Flower size={28} />
            </View>
            <Text style={styles.combLabel}>{tl({ es: 'En el campo', en: 'In the field' })}</Text>
          </View>
        </View>
        <View style={styles.dirButtons}>
          {DIRECTIONS.map((d, i) => (
            <TouchableOpacity key={d.angle} onPress={() => setDir(i)} style={[styles.dirBtn, dir === i && styles.dirBtnOn]}>
              <Text style={[styles.dirText, dir === i && styles.dirTextOn]}>{tl(d.label)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      <Card index={1}>
        <Text style={s.h2}>🧭 {tl({ es: 'Dirección', en: 'Direction' })}</Text>
        <Text style={s.body}>
          {tl({
            es: 'El ángulo del tramo recto respecto a la vertical del panal es el ángulo entre el sol y las flores. Arriba = hacia el sol.',
            en: 'The angle of the straight run from the vertical of the comb is the angle between the sun and the flowers. Up = towards the sun.',
          })}
        </Text>
      </Card>
      <Card index={2}>
        <Text style={s.h2}>📏 {tl({ es: 'Distancia', en: 'Distance' })}</Text>
        <Text style={s.body}>
          {tl({
            es: 'Cuanto más dura el meneo del abdomen, más lejos están: aproximadamente 1 segundo de meneo por cada kilómetro.',
            en: 'The longer the waggle lasts, the farther away they are: roughly 1 second of waggling per kilometre.',
          })}
        </Text>
      </Card>
      <Card index={3}>
        <Text style={s.h2}>👃 {tl({ es: 'Y el olor', en: 'And the smell' })}</Text>
        <Text style={s.body}>
          {tl({
            es: 'Las demás tocan a la bailarina con las antenas y prueban el néctar que trae: así saben qué flor buscar.',
            en: 'The others touch the dancer with their antennae and taste the nectar she brings, so they know which flower to look for.',
          })}
        </Text>
      </Card>
    </View>
  );
}

/* ---------- 5 · The comb ---------- */

const COLS = 7;
const ROWS = 6;
const POLLEN = ['#E8742C', '#F2C230', '#B33A2E', '#4B4FA0', '#D9C9A3', '#7FA04A'];

function cellKind(r: number, c: number): { kind: CellKind; color?: string; dist: number } {
  const dx = c - (COLS - 1) / 2 + (r % 2 ? 0.5 : 0);
  const dy = (r - (ROWS - 1) / 2) * 0.9;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1.3) return { kind: (r + c) % 3 === 0 ? 'egg' : 'brood', dist };
  if (dist < 2.4) return { kind: 'pollen', color: POLLEN[(r * 7 + c) % POLLEN.length], dist };
  return { kind: (r + c) % 4 === 0 ? 'capped' : 'honey', dist };
}

export function CombChapter() {
  const size = 40;
  return (
    <View>
      <Intro
        title={{ es: 'El panal, una obra maestra', en: 'The comb, a masterpiece' }}
        text={{
          es: 'Las celdillas hexagonales guardan el máximo espacio con la mínima cera. Y la colmena las organiza siempre igual:',
          en: 'Hexagonal cells hold the most space with the least wax. And the colony always arranges them the same way:',
        }}
      />
      <Card index={0}>
        <View style={styles.combGrid}>
          {Array.from({ length: ROWS }).map((_, r) => (
            <View key={r} style={[styles.combRow, { marginLeft: r % 2 ? size / 2 : 0, marginTop: r ? -size * 0.22 : 0 }]}>
              {Array.from({ length: COLS }).map((__, c) => {
                const cell = cellKind(r, c);
                return (
                  <Animated.View key={c} entering={ZoomIn.delay(Math.round(cell.dist * 180)).duration(350)}>
                    <HexCell size={size} kind={cell.kind} color={cell.color} />
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.combLegend}>
          <CombLegend kind="brood" label={{ es: 'Cría en el centro', en: 'Brood in the middle' }} />
          <CombLegend kind="pollen" label={{ es: 'Polen alrededor', en: 'Pollen around it' }} />
          <CombLegend kind="honey" label={{ es: 'Miel en los bordes', en: 'Honey at the edges' }} />
        </View>
      </Card>
      <Card index={1}>
        <Text style={s.body}>
          {tl({
            es: '🕯️ La cera sale de 4 pares de glándulas bajo el abdomen de las obreras jóvenes. Para hacer 1 kg de cera gastan unos 6–8 kg de miel.',
            en: '🕯️ Wax comes from 4 pairs of glands under the belly of young workers. Making 1 kg of wax costs them about 6–8 kg of honey.',
          })}
        </Text>
      </Card>
      <Card index={2}>
        <Text style={s.body}>
          {tl({
            es: '🌡️ El nido de cría se mantiene a 34–35 °C: en invierno tiritan con los músculos de las alas para dar calor y en verano abanican y traen agua para refrescarlo.',
            en: '🌡️ The brood nest is kept at 34–35 °C: in winter they shiver their flight muscles for heat, and in summer they fan and fetch water to cool it.',
          })}
        </Text>
      </Card>
    </View>
  );
}

function CombLegend({ kind, label }: { kind: CellKind; label: L }) {
  return (
    <View style={styles.combLegendItem}>
      <HexCell size={18} kind={kind} />
      <Text style={s.small}>{tl(label)}</Text>
    </View>
  );
}

/* ---------- 6 · From nectar to honey ---------- */

const HONEY_STEPS: { icon: string; title: L; text: L }[] = [
  { icon: '🌸', title: { es: 'Néctar', en: 'Nectar' }, text: { es: 'La pecoreadora lo sorbe de las flores y lo guarda en su buche melario.', en: 'The forager sips it from flowers and keeps it in her honey stomach.' } },
  { icon: '👄', title: { es: 'De boca en boca', en: 'Mouth to mouth' }, text: { es: 'En la colmena lo pasa a otras abejas, que le añaden enzimas que convierten el azúcar.', en: 'In the hive she passes it to other bees, who add enzymes that convert the sugar.' } },
  { icon: '💨', title: { es: 'Secado', en: 'Drying' }, text: { es: 'Lo extienden en las celdillas y abanican con las alas para evaporar el agua.', en: 'They spread it in cells and fan their wings to evaporate the water.' } },
  { icon: '🍯', title: { es: 'Miel sellada', en: 'Capped honey' }, text: { es: 'Cuando está madura, la tapan con cera. Así se conserva durante años.', en: 'When it is ripe they cap it with wax. That way it keeps for years.' } },
];

export function HoneyChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'Del néctar a la miel', en: 'From nectar to honey' }}
        text={{
          es: 'La miel es néctar transformado y concentrado por las abejas. Para 500 g visitan unos 2 millones de flores.',
          en: 'Honey is nectar transformed and concentrated by bees. For 500 g they visit about 2 million flowers.',
        }}
      />
      {HONEY_STEPS.map((st, i) => (
        <Card key={i} index={i}>
          <View style={s.row}>
            <View style={styles.stepIcon}>
              <Text style={{ fontSize: 26 }}>{st.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{tl(st.title)}</Text>
              <Text style={s.body}>{tl(st.text)}</Text>
            </View>
          </View>
        </Card>
      ))}
      <Card index={4} tint="#FFF8EA">
        <View style={s.row}>
          <Float>
            <HoneyJar size={78} />
          </Float>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.h2}>{tl({ es: 'Agua que pierde', en: 'Water it loses' })}</Text>
            <Text style={s.small}>{tl({ es: 'Néctar', en: 'Nectar' })}: ~70%</Text>
            <GrowBar pct={70} color="#9FC3D6" />
            <Text style={s.small}>{tl({ es: 'Miel', en: 'Honey' })}: ~18%</Text>
            <GrowBar pct={18} color={Colors.honeyPrimary} delay={600} />
          </View>
        </View>
      </Card>
    </View>
  );
}

/* ---------- 7 · Swarming ---------- */

// A teardrop-shaped cluster hanging under the branch (sunflower spiral, narrower towards the bottom).
const SWARM = Array.from({ length: 40 }).map((_, i) => {
  const r = Math.sqrt(i / 40);
  const a = i * 2.39996;
  const y = 7 + (Math.sin(a) * 0.5 + 0.5) * 68 * r;
  const width = 22 * (1 - (y - 7) / 110);
  return { x: 46 + Math.cos(a) * width * r, y, rot: (i * 47) % 360, delay: (i * 137) % 1200 };
});

export function SwarmChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'El enjambre', en: 'Swarming' }}
        text={{
          es: 'Así se reproducen las colonias: en primavera, la reina vieja se marcha con la mitad de las abejas y deja una reina nueva en casa.',
          en: 'This is how colonies reproduce: in spring the old queen leaves with half the bees, leaving a new queen at home.',
        }}
      />
      <Card index={0}>
        <View style={styles.swarm}>
          <View style={styles.branch} />
          {SWARM.map((b, i) => (
            <View key={i} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: [{ rotate: `${b.rot}deg` }] }}>
              <Float amount={3} duration={700 + (i % 5) * 120} delay={b.delay}>
                <TopBee size={20} />
              </Float>
            </View>
          ))}
        </View>
        <Text style={s.body}>
          {tl({
            es: 'El enjambre se cuelga de una rama mientras unas cientos de exploradoras buscan un hueco nuevo.',
            en: 'The swarm hangs from a branch while a few hundred scouts look for a new home.',
          })}
        </Text>
      </Card>
      <Card index={1}>
        <Text style={s.h2}>🗳️ {tl({ es: 'Deciden por votación', en: 'They decide by vote' })}</Text>
        <Text style={s.body}>
          {tl({
            es: 'Cada exploradora baila por el sitio que ha encontrado; cuanto mejor es, con más entusiasmo. Cuando un sitio reúne suficientes “votos”, todo el enjambre vuela hacia él.',
            en: 'Each scout dances for the site she found, the better it is the more eagerly. When one site gathers enough “votes”, the whole swarm flies there.',
          })}
        </Text>
      </Card>
      <Card index={2}>
        <Text style={s.h2}>😌 {tl({ es: 'Muy mansas', en: 'Very gentle' })}</Text>
        <Text style={s.body}>
          {tl({
            es: 'Un enjambre recién salido casi no pica: van cargadas de miel y no tienen casa que defender. Si ves uno, avisa a un apicultor.',
            en: 'A freshly issued swarm hardly stings: the bees are full of honey and have no home to defend. If you see one, call a beekeeper.',
          })}
        </Text>
      </Card>
    </View>
  );
}

/* ---------- 8 · Fun facts ---------- */

const FACTS: { to: number; decimals?: number; suffix?: L; label: L }[] = [
  { to: 5, label: { es: 'ojos: 2 grandes y 3 pequeños arriba de la cabeza', en: 'eyes: 2 big ones and 3 small ones on top of the head' } },
  { to: 230, suffix: { es: '/s', en: '/s' }, label: { es: 'aleteos por segundo: de ahí su zumbido', en: 'wingbeats per second: hence the buzz' } },
  { to: 25, suffix: { es: ' km/h', en: ' km/h' }, label: { es: 'de velocidad de vuelo', en: 'flight speed' } },
  { to: 3, suffix: { es: ' km', en: ' km' }, label: { es: 'de radio habitual de pecoreo (hasta 10 km)', en: 'usual foraging radius (up to 10 km)' } },
  { to: 2000, label: { es: 'huevos al día puede poner la reina', en: 'eggs a day the queen can lay' } },
  { to: 170, label: { es: 'olores distintos puede reconocer con sus antenas', en: 'different smells she can recognise with her antennae' } },
  { to: 4, label: { es: 'alas que se enganchan en vuelo con unos ganchitos', en: 'wings that hook together in flight with tiny hooks' } },
  { to: 35, suffix: { es: ' °C', en: ' °C' }, label: { es: 'mantienen en el nido de cría todo el año', en: 'kept in the brood nest all year round' } },
];

export function FactsChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'Curiosidades', en: 'Fun facts' }}
        text={{
          es: 'Las abejas ven el ultravioleta (pero no el rojo), se orientan con el sol aunque esté nublado y reconocen caras.',
          en: 'Bees see ultraviolet (but not red), navigate by the sun even when it is cloudy, and can recognise faces.',
        }}
      />
      <View style={styles.facts}>
        {FACTS.map((f, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(80 + i * 70).duration(400)} style={styles.fact}>
            <CountUp to={f.to} suffix={f.suffix ? tl(f.suffix) : ''} delay={200 + i * 90} style={s.big} />
            <Text style={s.small}>{tl(f.label)}</Text>
          </Animated.View>
        ))}
      </View>
      <Card index={8} tint="#FFF8EA">
        <View style={s.row}>
          <Svg width={56} height={56} viewBox="0 0 56 56">
            <Circle cx={28} cy={28} r={26} fill="#F7D9A0" />
            <Circle cx={28} cy={28} r={16} fill="#E9A23B" />
          </Svg>
          <Text style={[s.body, { flex: 1 }]}>
            {tl({
              es: 'Un tercio de lo que comemos depende de polinizadores como las abejas. Cuidarlas es cuidar nuestra comida.',
              en: 'A third of what we eat depends on pollinators like bees. Looking after them is looking after our food.',
            })}
          </Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  danceRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  comb: { flex: 1, height: 170, borderRadius: 16, backgroundColor: '#F7E2B0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  danceArea: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  dancer: { position: 'absolute' },
  combLabel: { position: 'absolute', bottom: 6, fontFamily: 'NunitoSans-Bold', fontSize: 11, color: Colors.textMuted2 },
  map: { width: 140, height: 170, borderRadius: 16, backgroundColor: '#EAF1DE', alignItems: 'center' },
  sun: { position: 'absolute', top: 2, left: 56 },
  mapFlower: { position: 'absolute' },
  dirButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  dirBtn: { borderRadius: 100, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: Colors.bg },
  dirBtnOn: { backgroundColor: Colors.greenDark },
  dirText: { fontFamily: 'NunitoSans-Bold', fontSize: 12, color: Colors.textMuted2 },
  dirTextOn: { color: '#fff' },

  combGrid: { alignItems: 'center', paddingVertical: 6 },
  combRow: { flexDirection: 'row' },
  combLegend: { gap: 6, marginTop: 12 },
  combLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  stepIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },

  swarm: { height: 160, marginBottom: 10 },
  branch: { position: 'absolute', top: 10, left: '8%', right: '8%', height: 10, borderRadius: 5, backgroundColor: '#8A6A44', transform: [{ rotate: '-4deg' }] },

  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  fact: { width: '48%', flexGrow: 1, backgroundColor: Colors.card, borderRadius: 18, padding: 14, gap: 4 },
});
