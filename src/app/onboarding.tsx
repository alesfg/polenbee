import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OddsScene, PhotoScene, PlaceScene, SCENE_SIZE, WelcomeScene } from '@/components/illustrations/OnboardingScenes';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { requestLocationPermission } from '@/lib/location';
import { posthog } from '@/lib/posthog';

export const ONBOARDING_KEY = 'onboarding_v2_complete';

const SLIDES = [
  {
    Scene: WelcomeScene,
    blob: '#FCEBC9',
    title: t('onboarding.welcome.title'),
    subtitle: t('onboarding.welcome.subtitle'),
  },
  {
    Scene: PhotoScene,
    blob: '#EAF1DE',
    title: t('onboarding.photo.title'),
    subtitle: t('onboarding.photo.subtitle'),
  },
  {
    Scene: PlaceScene,
    blob: '#E6F0F4',
    title: t('onboarding.place.title'),
    subtitle: t('onboarding.place.subtitle'),
  },
  {
    Scene: OddsScene,
    blob: '#F7E3EA',
    title: t('onboarding.odds.title'),
    subtitle: t('onboarding.odds.subtitle'),
  },
] as const;

function Dot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const p = scrollX.value / width;
    const focus = interpolate(Math.abs(p - index), [0, 1], [1, 0], 'clamp');
    return {
      width: 8 + focus * 18,
      backgroundColor: interpolateColor(focus, [0, 1], [Colors.border2, Colors.honeyPrimary]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function Slide({ index, scrollX, width, active }: { index: number; scrollX: SharedValue<number>; width: number; active: boolean }) {
  const { Scene, title, subtitle } = SLIDES[index];
  const parallax = useAnimatedStyle(() => {
    const offset = scrollX.value - index * width;
    return {
      opacity: interpolate(Math.abs(offset), [0, width * 0.6], [1, 0], 'clamp'),
      transform: [{ translateX: offset * 0.35 }, { scale: interpolate(Math.abs(offset), [0, width], [1, 0.8], 'clamp') }],
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const offset = scrollX.value - index * width;
    return {
      opacity: interpolate(Math.abs(offset), [0, width * 0.5], [1, 0], 'clamp'),
      transform: [{ translateY: interpolate(Math.abs(offset), [0, width], [0, 30], 'clamp') }],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.illustration, parallax]}>
        <Scene active={active} />
      </Animated.View>
      <Animated.View style={[styles.textArea, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const blobStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollX.value / width,
      SLIDES.map((_, i) => i),
      SLIDES.map((s) => s.blob)
    ),
    transform: [{ rotate: `${(scrollX.value / width) * 40}deg` }],
  }));

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    // Ask for location here, after explaining why we need it.
    await requestLocationPermission();
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    posthog.capture('onboarding_completed');
    router.replace('/');
  }

  function goTo(i: number) {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <Animated.View style={[styles.blob, { top: insets.top + 40, left: width / 2 - 170 }, blobStyle]} />

      <View style={styles.topBar}>
        {!isLast && (
          <TouchableOpacity onPress={() => goTo(SLIDES.length - 1)} hitSlop={12}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((_, i) => (
          <Slide key={i} index={i} scrollX={scrollX} width={width} active={i === index} />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, isLast && styles.nextBtnLast]}
          onPress={() => (isLast ? finish() : goTo(index + 1))}
          activeOpacity={0.85}
          disabled={finishing}
        >
          <Text style={styles.nextBtnText}>{isLast ? t('onboarding.start') : t('onboarding.next')}</Text>
        </TouchableOpacity>
        {isLast && <Text style={styles.permissionNote}>{t('onboarding.permissionNote')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, overflow: 'hidden' },
  blob: { position: 'absolute', width: 340, height: 340, borderRadius: 150 },
  topBar: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 24 },
  skipText: { color: Colors.textMuted, fontFamily: 'NunitoSans-SemiBold', fontSize: 14 },
  slide: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  illustration: { height: SCENE_SIZE + 40, alignItems: 'center', justifyContent: 'center' },
  textArea: { alignItems: 'center', paddingTop: 24, maxWidth: 420 },
  title: { fontFamily: 'Nunito-Black', fontSize: 27, color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontFamily: 'NunitoSans', fontSize: 16, color: Colors.textMuted2, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24, gap: 18, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8, height: 8 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { width: '100%', maxWidth: 480, backgroundColor: Colors.greenDark, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  nextBtnLast: { backgroundColor: Colors.honeyPrimary },
  nextBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 17 },
  permissionNote: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted, marginTop: -6 },
});
