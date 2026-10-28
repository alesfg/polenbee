import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColonyChapter, JobsChapter, LifeCycleChapter } from '@/components/learn/ColonyChapters';
import { CombChapter, DanceChapter, FactsChapter, HoneyChapter, SwarmChapter } from '@/components/learn/HiveChapters';
import { L, tl } from '@/components/learn/LearnParts';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

const CHAPTERS: { icon: string; title: L; Chapter: () => React.JSX.Element }[] = [
  { icon: '👑', title: { es: 'La colonia', en: 'The colony' }, Chapter: ColonyChapter },
  { icon: '🥚', title: { es: 'Ciclo de vida', en: 'Life cycle' }, Chapter: LifeCycleChapter },
  { icon: '🧹', title: { es: 'Trabajos', en: 'Jobs' }, Chapter: JobsChapter },
  { icon: '💃', title: { es: 'La danza', en: 'The dance' }, Chapter: DanceChapter },
  { icon: '⬡', title: { es: 'El panal', en: 'The comb' }, Chapter: CombChapter },
  { icon: '🍯', title: { es: 'La miel', en: 'Honey' }, Chapter: HoneyChapter },
  { icon: '🌳', title: { es: 'El enjambre', en: 'Swarming' }, Chapter: SwarmChapter },
  { icon: '✨', title: { es: 'Curiosidades', en: 'Fun facts' }, Chapter: FactsChapter },
];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const { Chapter } = CHAPTERS[index];

  function open(i: number) {
    setIndex(i);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('learn.title')}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0, flexShrink: 0 }}>
        {CHAPTERS.map((c, i) => (
          <TouchableOpacity key={i} style={[styles.chip, index === i && styles.chipOn]} onPress={() => open(i)} activeOpacity={0.8}>
            <Text style={[styles.chipText, index === i && styles.chipTextOn]}>
              {c.icon} {tl(c.title)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {/* Keyed so each chapter's entrance animations play again when it's opened. */}
        <Animated.View key={index} entering={FadeIn.duration(250)}>
          <Chapter />
        </Animated.View>
        {index < CHAPTERS.length - 1 && (
          <TouchableOpacity style={styles.next} onPress={() => open(index + 1)} activeOpacity={0.85}>
            <Text style={styles.nextSmall}>{t('learn.next')}</Text>
            <Text style={styles.nextTitle}>
              {CHAPTERS[index + 1].icon} {tl(CHAPTERS[index + 1].title)} →
            </Text>
          </TouchableOpacity>
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
  title: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  chips: { paddingHorizontal: Spacing.lg, gap: 8, paddingVertical: 8 },
  chip: { backgroundColor: Colors.card, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.border },
  chipOn: { backgroundColor: Colors.greenDark, borderColor: Colors.greenDark },
  chipText: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.textMuted2 },
  chipTextOn: { color: '#fff' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },
  next: { backgroundColor: Colors.greenDark, borderRadius: 18, padding: 16, marginTop: 6 },
  nextSmall: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: '#FFFFFFB0' },
  nextTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 17, color: '#fff', marginTop: 2 },
});
