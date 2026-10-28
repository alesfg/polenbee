import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BeeProfile } from '@/components/illustrations/BeeProfile';
import { ColonyChapter, JobsChapter, LifeCycleChapter } from '@/components/learn/ColonyChapters';
import { CombChapter, DanceChapter, FactsChapter, HoneyChapter, SwarmChapter } from '@/components/learn/HiveChapters';
import { GrowBar, L, tl } from '@/components/learn/LearnParts';
import {
  AnatomyChapter,
  HelpChapter,
  PollinationChapter,
  ProductsChapter,
  QuizChapter,
  ThreatsChapter,
  VisionChapter,
  YearChapter,
} from '@/components/learn/MoreChapters';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

type Chapter = { id: string; icon: string; tint: string; title: L; Chapter: () => React.JSX.Element };

const SECTIONS: { title: L; chapters: Chapter[] }[] = [
  {
    title: { es: 'La colmena', en: 'The hive' },
    chapters: [
      { id: 'colony', icon: '👑', tint: '#FFF1D6', title: { es: 'La colonia', en: 'The colony' }, Chapter: ColonyChapter },
      { id: 'life', icon: '🥚', tint: '#FBEFD2', title: { es: 'Ciclo de vida', en: 'Life cycle' }, Chapter: LifeCycleChapter },
      { id: 'jobs', icon: '🧹', tint: '#EAF1DE', title: { es: 'Trabajos', en: 'Jobs' }, Chapter: JobsChapter },
      { id: 'comb', icon: '⬡', tint: '#F7E2B0', title: { es: 'El panal', en: 'The comb' }, Chapter: CombChapter },
      { id: 'year', icon: '📅', tint: '#E6F0F4', title: { es: 'El año de la colmena', en: 'A hive’s year' }, Chapter: YearChapter },
      { id: 'swarm', icon: '🌳', tint: '#EAF1DE', title: { es: 'El enjambre', en: 'Swarming' }, Chapter: SwarmChapter },
    ],
  },
  {
    title: { es: 'La abeja', en: 'The bee' },
    chapters: [
      { id: 'anatomy', icon: '🔬', tint: '#F7E3EA', title: { es: 'Anatomía', en: 'Anatomy' }, Chapter: AnatomyChapter },
      { id: 'vision', icon: '👁️', tint: '#ECE8FA', title: { es: 'Cómo ven', en: 'How they see' }, Chapter: VisionChapter },
      { id: 'dance', icon: '💃', tint: '#FFF1D6', title: { es: 'La danza', en: 'The dance' }, Chapter: DanceChapter },
      { id: 'facts', icon: '✨', tint: '#FBEFD2', title: { es: 'Curiosidades', en: 'Fun facts' }, Chapter: FactsChapter },
    ],
  },
  {
    title: { es: 'Abejas y personas', en: 'Bees and us' },
    chapters: [
      { id: 'pollination', icon: '🌸', tint: '#F3F8EC', title: { es: 'Polinización', en: 'Pollination' }, Chapter: PollinationChapter },
      { id: 'honey', icon: '🍯', tint: '#FFF1D6', title: { es: 'La miel', en: 'Honey' }, Chapter: HoneyChapter },
      { id: 'products', icon: '🕯️', tint: '#FBEFD2', title: { es: 'Tesoros de la colmena', en: 'Hive treasures' }, Chapter: ProductsChapter },
      { id: 'threats', icon: '⚠️', tint: '#FBE4E1', title: { es: 'Peligros', en: 'Threats' }, Chapter: ThreatsChapter },
      { id: 'help', icon: '🤝', tint: '#EAF1DE', title: { es: 'Cómo ayudar', en: 'How to help' }, Chapter: HelpChapter },
      { id: 'quiz', icon: '🏆', tint: '#FFF1D6', title: { es: 'Quiz', en: 'Quiz' }, Chapter: QuizChapter },
    ],
  },
];
const CHAPTERS = SECTIONS.flatMap((sec) => sec.chapters);
const SEEN_KEY = 'learn_seen';

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY)
      .then((v) => v && setSeen(JSON.parse(v)))
      .catch(() => {});
  }, []);

  function open(i: number | null) {
    setIndex(i);
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (i === null) return;
    const id = CHAPTERS[i].id;
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

  function back() {
    if (index !== null) open(null);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const current = index === null ? null : CHAPTERS[index];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {current ? `${current.icon} ${tl(current.title)}` : t('learn.title')}
        </Text>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {current === null ? (
          <Animated.View key="hub" entering={FadeIn.duration(250)}>
            <View style={styles.hero}>
              <BeeProfile size={120} pollenColor="#E8742C" />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.heroTitle}>{t('learn.heroTitle')}</Text>
                <Text style={styles.heroText}>{t('learn.progress', { seen: String(seen.length), total: String(CHAPTERS.length) })}</Text>
                <View style={styles.progressTrack}>
                  <GrowBar pct={(seen.length / CHAPTERS.length) * 100} color={Colors.honeyPrimary} height={10} />
                </View>
              </View>
            </View>
            {SECTIONS.map((sec, si) => (
              <View key={si}>
                <Text style={styles.sectionTitle}>{tl(sec.title)}</Text>
                <View style={styles.grid}>
                  {sec.chapters.map((c) => {
                    const i = CHAPTERS.indexOf(c);
                    const done = seen.includes(c.id);
                    return (
                      <Animated.View key={c.id} entering={FadeInDown.delay(40 * i).duration(300)} style={styles.tileWrap}>
                        <TouchableOpacity style={[styles.tile, { backgroundColor: c.tint }]} onPress={() => open(i)} activeOpacity={0.85}>
                          <Text style={styles.tileIcon}>{c.icon}</Text>
                          <Text style={styles.tileTitle} numberOfLines={2}>
                            {tl(c.title)}
                          </Text>
                          {done ? (
                            <View style={styles.seenBadge}>
                              <Text style={styles.seenText}>✓</Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            ))}
          </Animated.View>
        ) : (
          // Keyed so each chapter's entrance animations play again when it's opened.
          <Animated.View key={current.id} entering={FadeIn.duration(250)}>
            <current.Chapter />
            <View style={styles.navRow}>
              {index! > 0 ? (
                <TouchableOpacity style={[styles.nav, styles.navPrev]} onPress={() => open(index! - 1)} activeOpacity={0.85}>
                  <Text style={styles.navSmallDark}>← {t('learn.prev')}</Text>
                  <Text style={styles.navTitleDark} numberOfLines={1}>
                    {CHAPTERS[index! - 1].icon} {tl(CHAPTERS[index! - 1].title)}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {index! < CHAPTERS.length - 1 ? (
                <TouchableOpacity style={styles.nav} onPress={() => open(index! + 1)} activeOpacity={0.85}>
                  <Text style={styles.navSmall}>{t('learn.next')} →</Text>
                  <Text style={styles.navTitle} numberOfLines={1}>
                    {CHAPTERS[index! + 1].icon} {tl(CHAPTERS[index! + 1].title)}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => open(null)} style={styles.allLink}>
              <Text style={styles.allLinkText}>{t('learn.all')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: Colors.honeyDark, fontFamily: 'Nunito-Black' },
  title: { flex: 1, fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8EA', borderWidth: 1.5, borderColor: Colors.honeyLight, borderRadius: 22, padding: 14, marginBottom: 18 },
  heroTitle: { fontFamily: 'Nunito-Black', fontSize: 18, color: Colors.textPrimary, lineHeight: 22 },
  heroText: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12.5, color: Colors.textMuted2 },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: Colors.honeyFaint, overflow: 'hidden' },

  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 17, color: Colors.textPrimary, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  tileWrap: { width: '31%', flexGrow: 1 },
  tile: { borderRadius: 18, padding: 12, height: 104, justifyContent: 'space-between' },
  tileIcon: { fontSize: 30 },
  tileTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 13.5, color: Colors.textPrimary, lineHeight: 17 },
  seenBadge: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.greenDark, alignItems: 'center', justifyContent: 'center' },
  seenText: { color: '#fff', fontFamily: 'Nunito-Black', fontSize: 12 },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  nav: { flex: 1, backgroundColor: Colors.greenDark, borderRadius: 18, padding: 14 },
  navPrev: { backgroundColor: Colors.card },
  navSmall: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: '#FFFFFFB0' },
  navTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: '#fff', marginTop: 2 },
  navSmallDark: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: Colors.textMuted },
  navTitleDark: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginTop: 2 },
  allLink: { alignItems: 'center', paddingVertical: 16 },
  allLinkText: { fontFamily: 'NunitoSans-Bold', fontSize: 13.5, color: Colors.honeyDark },
});
