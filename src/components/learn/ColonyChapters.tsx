import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Egg, Larva, Pupa } from '@/components/illustrations/BeeBits';
import { BeeProfile } from '@/components/illustrations/BeeProfile';
import { Colors } from '@/constants/theme';
import { CASTE_LOOK } from '@/data/bees';
import { Card, CountUp, Float, GrowBar, Intro, L, learnStyles as s, tl } from './LearnParts';

/* ---------- 1 · The colony ---------- */

const CASTES = [
  {
    key: 'reina' as const,
    name: { es: 'La reina', en: 'The queen' },
    count: 1,
    countLabel: { es: 'por colonia', en: 'per colony' },
    life: { es: 'Vive 2–5 años', en: 'Lives 2–5 years' },
    text: {
      es: 'Es la madre de toda la colonia: pone hasta 2.000 huevos al día. Su olor (feromonas) mantiene unida a la colmena.',
      en: 'Mother of the whole colony: she lays up to 2,000 eggs a day. Her scent (pheromones) holds the hive together.',
    },
    tint: '#FFF4DE',
  },
  {
    key: 'obrera' as const,
    name: { es: 'Las obreras', en: 'The workers' },
    count: 50000,
    countLabel: { es: 'en pleno verano', en: 'in midsummer' },
    life: { es: '5–6 semanas en verano, hasta 5 meses en invierno', en: '5–6 weeks in summer, up to 5 months in winter' },
    text: {
      es: 'Hembras que hacen todo el trabajo: limpian, crían, construyen, defienden y salen a buscar néctar y polen.',
      en: 'Females that do all the work: cleaning, nursing, building, guarding and foraging for nectar and pollen.',
    },
    tint: '#FFFFFF',
  },
  {
    key: 'zangano' as const,
    name: { es: 'Los zánganos', en: 'The drones' },
    count: 1500,
    countLabel: { es: 'en primavera y verano', en: 'in spring and summer' },
    life: { es: 'Unas 8 semanas', en: 'About 8 weeks' },
    text: {
      es: 'Los machos: no tienen aguijón ni trabajan. Su misión es fecundar reinas de otras colonias. En otoño los expulsan.',
      en: 'The males: no sting and no chores. Their job is to mate with queens from other colonies. In autumn they are thrown out.',
    },
    tint: '#F6F1E7',
  },
];

export function ColonyChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'Una colonia, un superorganismo', en: 'One colony, one superorganism' }}
        text={{
          es: 'Una colmena funciona como un solo ser vivo formado por miles de abejas. Hay tres tipos de abeja, cada uno con su papel.',
          en: 'A hive works like a single living being made of thousands of bees. There are three kinds of bee, each with its role.',
        }}
      />
      {CASTES.map((c, i) => (
        <Card key={c.key} index={i} tint={c.tint}>
          <View style={s.row}>
            <Float delay={i * 300}>
              <BeeProfile look={CASTE_LOOK[c.key]} size={120} />
            </Float>
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{tl(c.name)}</Text>
              <CountUp to={c.count} delay={200 + i * 150} style={s.big} />
              <Text style={s.small}>{tl(c.countLabel)}</Text>
            </View>
          </View>
          <Text style={[s.body, { marginTop: 8 }]}>{tl(c.text)}</Text>
          <Text style={[s.small, { marginTop: 6 }]}>⏳ {tl(c.life)}</Text>
        </Card>
      ))}
      <Card index={3}>
        <Text style={s.h2}>{tl({ es: '¿Quién hay en una colmena de verano?', en: 'Who lives in a summer hive?' })}</Text>
        <View style={styles.mix}>
          <View style={{ flex: 50000, backgroundColor: Colors.honeyPrimary }} />
          <View style={{ flex: 1500 * 6, backgroundColor: '#8A6A44' }} />
          <View style={{ flex: 400, backgroundColor: '#C9852E' }} />
        </View>
        <Text style={s.small}>
          {tl({
            es: 'Por cada zángano hay unas 30 obreras… y una sola reina (la franja de zánganos está ampliada para que se vea).',
            en: 'For every drone there are about 30 workers… and a single queen (the drone strip is enlarged so you can see it).',
          })}
        </Text>
      </Card>
    </View>
  );
}

/* ---------- 2 · Life cycle ---------- */

const STAGES = [
  { Art: Egg, name: { es: 'Huevo', en: 'Egg' }, text: { es: 'La reina lo pone en una celdilla. A los 3 días eclosiona.', en: 'The queen lays it in a cell. It hatches after 3 days.' } },
  { Art: Larva, name: { es: 'Larva', en: 'Larva' }, text: { es: 'Las nodrizas la alimentan cientos de veces al día. Crece 1.500 veces en 6 días.', en: 'Nurse bees feed it hundreds of times a day. It grows 1,500-fold in 6 days.' } },
  { Art: Pupa, name: { es: 'Pupa', en: 'Pupa' }, text: { es: 'Las obreras sellan la celdilla con cera y dentro se transforma en abeja.', en: 'Workers seal the cell with wax and inside it turns into a bee.' } },
];

const DEVELOPMENT = [
  { name: { es: 'Reina', en: 'Queen' }, egg: 3, larva: 5.5, pupa: 7.5 },
  { name: { es: 'Obrera', en: 'Worker' }, egg: 3, larva: 6, pupa: 12 },
  { name: { es: 'Zángano', en: 'Drone' }, egg: 3, larva: 6.5, pupa: 14.5 },
];
const MAX_DAYS = 24;

export function LifeCycleChapter() {
  return (
    <View>
      <Intro
        title={{ es: 'De huevo a abeja', en: 'From egg to bee' }}
        text={{
          es: 'Todas las abejas pasan por cuatro fases. Lo que comen de larva decide si serán obreras o reinas: la reina se cría solo con jalea real.',
          en: 'Every bee goes through four stages. What a larva eats decides whether it becomes a worker or a queen: queens are raised on royal jelly alone.',
        }}
      />
      {STAGES.map((st, i) => (
        <Card key={i} index={i}>
          <View style={s.row}>
            <Float delay={i * 250} amount={3}>
              <st.Art size={64} />
            </Float>
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>
                {i + 1}. {tl(st.name)}
              </Text>
              <Text style={s.body}>{tl(st.text)}</Text>
            </View>
          </View>
        </Card>
      ))}
      <Card index={3} tint="#FFF8EA">
        <View style={s.row}>
          <BeeProfile size={90} />
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>4. {tl({ es: 'Adulta', en: 'Adult' })}</Text>
            <Text style={s.body}>{tl({ es: 'Rompe el opérculo con las mandíbulas y sale lista para trabajar.', en: 'She chews through the wax cap and comes out ready to work.' })}</Text>
          </View>
        </View>
      </Card>
      <Card index={4}>
        <Text style={s.h2}>{tl({ es: 'Días hasta salir de la celdilla', en: 'Days until leaving the cell' })}</Text>
        {DEVELOPMENT.map((d, i) => {
          const total = d.egg + d.larva + d.pupa;
          return (
            <View key={i} style={{ marginTop: 10 }}>
              <View style={styles.devHead}>
                <Text style={styles.devName}>{tl(d.name)}</Text>
                <Text style={styles.devDays}>{total} {tl({ es: 'días', en: 'days' })}</Text>
              </View>
              <View style={styles.devTrack}>
                <View style={{ width: `${(total / MAX_DAYS) * 100}%`, flexDirection: 'row', gap: 2 }}>
                  <Seg flex={d.egg} color="#F4EBDD" delay={i * 200} />
                  <Seg flex={d.larva} color="#F2D27A" delay={i * 200 + 200} />
                  <Seg flex={d.pupa} color="#C88A4A" delay={i * 200 + 400} />
                </View>
              </View>
            </View>
          );
        })}
        <View style={styles.legend}>
          <Legend color="#F4EBDD" label={tl({ es: 'Huevo', en: 'Egg' })} />
          <Legend color="#F2D27A" label={tl({ es: 'Larva', en: 'Larva' })} />
          <Legend color="#C88A4A" label={tl({ es: 'Pupa', en: 'Pupa' })} />
        </View>
      </Card>
    </View>
  );
}

function Seg({ flex, color, delay }: { flex: number; color: string; delay: number }) {
  return (
    <View style={{ flex, height: 14 }}>
      <GrowBar pct={100} color={color} delay={delay} height={14} />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={s.small}>{label}</Text>
    </View>
  );
}

/* ---------- 3 · A worker's career ---------- */

const JOBS: { days: string; icon: string; name: L; text: L }[] = [
  { days: '1–2', icon: '🧹', name: { es: 'Limpiadora', en: 'Cleaner' }, text: { es: 'Limpia y pule las celdillas para que la reina vuelva a poner.', en: 'Cleans and polishes cells so the queen can lay again.' } },
  { days: '3–11', icon: '🍼', name: { es: 'Nodriza', en: 'Nurse' }, text: { es: 'Alimenta a las larvas y a la reina con jalea real que fabrica en su cabeza.', en: 'Feeds larvae and the queen with royal jelly made in glands in her head.' } },
  { days: '12–17', icon: '🧱', name: { es: 'Constructora y almacenera', en: 'Builder and storer' }, text: { es: 'Segrega cera, construye panal y guarda el néctar y el polen que llegan.', en: 'Secretes wax, builds comb and stores the incoming nectar and pollen.' } },
  { days: '18–21', icon: '🛡️', name: { es: 'Guardiana', en: 'Guard' }, text: { es: 'Vigila la piquera y huele a cada abeja que entra para frenar intrusas.', en: 'Watches the entrance and sniffs every incoming bee to stop intruders.' } },
  { days: '22+', icon: '🌸', name: { es: 'Pecoreadora', en: 'Forager' }, text: { es: 'Sale al campo a por néctar, polen, agua y resina hasta agotar sus alas.', en: 'Flies out for nectar, pollen, water and resin until her wings wear out.' } },
];

export function JobsChapter() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(y);
  }, []);
  // The little bee walks down the timeline as she gets older.
  const beeStyle = useAnimatedStyle(() => ({ top: `${y.value * 88}%` }));

  return (
    <View>
      <Intro
        title={{ es: 'Una carrera profesional en 6 semanas', en: 'A whole career in 6 weeks' }}
        text={{
          es: 'Las obreras cambian de trabajo según su edad: empiezan dentro de la colmena y terminan siendo las que vemos en las flores.',
          en: 'Workers change jobs as they age: they start inside the hive and end up as the bees we see on flowers.',
        }}
      />
      <View style={styles.timeline}>
        <View style={styles.rail}>
          <View style={styles.railLine} />
          <Animated.View style={[styles.railBee, beeStyle]}>
            <BeeProfile size={44} animated={false} />
          </Animated.View>
        </View>
        <View style={{ flex: 1 }}>
          {JOBS.map((j, i) => (
            <Animated.View key={j.days} entering={FadeInDown.delay(100 + i * 140).duration(400)} style={styles.job}>
              <View style={styles.jobHead}>
                <Text style={styles.jobIcon}>{j.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobDays}>{tl({ es: `Días ${j.days}`, en: `Days ${j.days}` })}</Text>
                  <Text style={s.h2}>{tl(j.name)}</Text>
                </View>
              </View>
              <Text style={s.body}>{tl(j.text)}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
      <Card index={6} tint="#FFF8EA">
        <Text style={s.body}>
          {tl({
            es: '🍯 En toda su vida, una pecoreadora produce solo 1/12 de cucharadita de miel. Por eso cada tarro es trabajo de miles de abejas.',
            en: '🍯 In her whole life a forager makes just 1/12 of a teaspoon of honey. Every jar is the work of thousands of bees.',
          })}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  mix: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden', gap: 2, marginVertical: 10 },
  devHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  devName: { fontFamily: 'NunitoSans-Bold', fontSize: 13.5, color: Colors.textPrimary },
  devDays: { fontFamily: 'Nunito-ExtraBold', fontSize: 13.5, color: Colors.honeyDark },
  devTrack: { height: 14, backgroundColor: Colors.bg, borderRadius: 7, overflow: 'hidden' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#00000014' },
  timeline: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  rail: { width: 48, alignItems: 'center' },
  railLine: { position: 'absolute', top: 10, bottom: 10, width: 4, borderRadius: 2, backgroundColor: Colors.honeyLight },
  railBee: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  job: { backgroundColor: Colors.card, borderRadius: 18, padding: 14, marginBottom: 10 },
  jobHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  jobIcon: { fontSize: 26 },
  jobDays: { fontFamily: 'NunitoSans-Bold', fontSize: 11.5, color: Colors.honeyDark, textTransform: 'uppercase' },
});
