import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { locale, t } from '@/i18n';
import { Bee } from './Bee';
import { Flower } from './Flower';

export const SCENE_SIZE = 280;

interface SceneProps {
  active: boolean;
}

/** Runs `start` every time the slide becomes active and stops the given values when it leaves. */
function useSceneAnimation(active: boolean, values: SharedValue<number>[], start: () => void) {
  useEffect(() => {
    if (!active) {
      values.forEach((v) => { cancelAnimation(v); v.value = 0; });
      return;
    }
    start();
    return () => values.forEach((v) => cancelAnimation(v));
  }, [active]);
}

/* ---------- 1 · Welcome: bee flying over a meadow ---------- */

function FloatingPollen({ x, delay, active }: { x: number; delay: number; active: boolean }) {
  const t = useSharedValue(0);
  useSceneAnimation(active, [t], () => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1));
  });
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 10 : 1 - t.value,
    transform: [{ translateY: -t.value * 170 }, { translateX: Math.sin(t.value * Math.PI * 3) * 10 }],
  }));
  return <Animated.View style={[styles.pollenDot, { left: x, bottom: 60 }, style]} />;
}

function SwayingFlower({ left, petal, size, delay, active }: { left: number; petal: string; size: number; delay: number; active: boolean }) {
  const t = useSharedValue(0);
  useSceneAnimation(active, [t], () => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
  });
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${(t.value - 0.5) * 12}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', bottom: 0, left, transformOrigin: 'bottom' }, style]}>
      <Flower size={size} petal={petal} stem />
    </Animated.View>
  );
}

export function WelcomeScene({ active }: SceneProps) {
  const sun = useSharedValue(0);
  const fly = useSharedValue(0);
  useSceneAnimation(active, [sun, fly], () => {
    sun.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.linear }), -1);
    fly.value = withRepeat(withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true);
  });
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sun.value * 360}deg` }] }));
  const flyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (fly.value - 0.5) * 70 }, { translateY: Math.sin(fly.value * Math.PI * 2) * 18 }],
  }));

  return (
    <View style={styles.scene}>
      <Animated.View style={[styles.sunRays, sunStyle]}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {Array.from({ length: 12 }).map((_, i) => (
            <Rect key={i} x="96" y="6" width="8" height="30" rx="4" fill={Colors.honeyLight} transform={`rotate(${i * 30} 100 100)`} />
          ))}
          <Circle cx="100" cy="100" r="58" fill={Colors.honeySoft} />
        </Svg>
      </Animated.View>
      <SwayingFlower left={18} petal="#F4A7B9" size={44} delay={0} active={active} />
      <SwayingFlower left={78} petal="#B9A5E8" size={34} delay={300} active={active} />
      <SwayingFlower left={180} petal="#FFFFFF" size={38} delay={150} active={active} />
      <SwayingFlower left={228} petal="#F7D04A" size={30} delay={450} active={active} />
      {[60, 110, 150, 200, 240].map((x, i) => (
        <FloatingPollen key={x} x={x} delay={i * 600} active={active} />
      ))}
      <Animated.View style={[styles.welcomeBee, flyStyle]}>
        <Bee size={130} animated={active} />
      </Animated.View>
    </View>
  );
}

/* ---------- 2 · Photo: phone camera framing a bee ---------- */

export function PhotoScene({ active }: SceneProps) {
  const enter = useSharedValue(0);
  const flash = useSharedValue(0);
  const focus = useSharedValue(0);
  useSceneAnimation(active, [enter, flash, focus], () => {
    enter.value = withSpring(1, { damping: 12 });
    focus.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true);
    flash.value = withDelay(
      900,
      withRepeat(withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 420 }), withTiming(0, { duration: 1900 })), -1)
    );
  });

  const phoneStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 60 }, { rotate: `${(1 - enter.value) * -8}deg` }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.9 }));
  const focusStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1.15 - focus.value * 0.2 }], opacity: 0.6 + focus.value * 0.4 }));

  return (
    <View style={styles.scene}>
      <Animated.View style={[styles.phone, phoneStyle]}>
        <View style={styles.phoneNotch} />
        <View style={styles.viewfinder}>
          <View style={[styles.corner, { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[styles.corner, { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          <Flower size={34} petal="#F4A7B9" />
          <Bee size={120} pollenColor="#E8742C" animated={active} />
          {/* focus ring locks on the pollen load */}
          <Animated.View style={[styles.focusRing, focusStyle]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
        </View>
        <View style={styles.shutter}>
          <View style={styles.shutterInner} />
        </View>
      </Animated.View>
    </View>
  );
}

/* ---------- 3 · Place & time: map pin, radius and blooming flowers ---------- */

function Ring({ delay, active }: { delay: number; active: boolean }) {
  const t = useSharedValue(0);
  useSceneAnimation(active, [t], () => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1));
  });
  const style = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ scaleX: 0.3 + t.value }, { scaleY: (0.3 + t.value) * 0.45 }] }));
  return <Animated.View style={[styles.ring, style]} />;
}

function PopFlower({ x, y, petal, delay, active }: { x: number; y: number; petal: string; delay: number; active: boolean }) {
  const t = useSharedValue(0);
  useSceneAnimation(active, [t], () => {
    t.value = withDelay(delay, withSpring(1, { damping: 7, stiffness: 140 }));
  });
  const style = useAnimatedStyle(() => ({ transform: [{ scale: t.value }, { rotate: `${(1 - t.value) * 90}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
      <Flower size={34} petal={petal} />
    </Animated.View>
  );
}

function nowLabel() {
  const d = new Date();
  const month = d.toLocaleDateString(locale, { month: 'long' });
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} · ${time}`;
}

export function PlaceScene({ active }: SceneProps) {
  const drop = useSharedValue(0);
  const clock = useSharedValue(0);
  useSceneAnimation(active, [drop, clock], () => {
    drop.value = withSpring(1, { damping: 8, stiffness: 120 });
    clock.value = withDelay(700, withSpring(1, { damping: 10 }));
  });
  const pinStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, drop.value * 2), transform: [{ translateY: (1 - drop.value) * -120 }] }));
  const clockStyle = useAnimatedStyle(() => ({ transform: [{ scale: clock.value }] }));

  return (
    <View style={styles.scene}>
      <View style={styles.mapCard}>
        <Svg width="100%" height="100%" viewBox="0 0 240 200" preserveAspectRatio="none">
          <Path d="M0 140 C60 110 90 170 150 140 S220 100 240 120 L240 200 L0 200 Z" fill="#DCEBC7" />
          <Path d="M0 60 C50 80 80 30 140 50 S210 80 240 40" stroke="#FFFFFF" strokeWidth={10} fill="none" />
          <Path d="M70 0 C80 60 60 120 90 200" stroke="#FFFFFF" strokeWidth={6} fill="none" />
          <Path d="M170 0 C160 50 200 120 180 200" stroke="#BFDCE6" strokeWidth={8} fill="none" />
        </Svg>
      </View>
      <View style={styles.ringAnchor}>
        <Ring delay={0} active={active} />
        <Ring delay={800} active={active} />
        <Ring delay={1600} active={active} />
      </View>
      <PopFlower x={40} y={150} petal="#F4A7B9" delay={500} active={active} />
      <PopFlower x={205} y={140} petal="#B9A5E8" delay={700} active={active} />
      <PopFlower x={70} y={60} petal="#F7D04A" delay={900} active={active} />
      <PopFlower x={190} y={55} petal="#FFFFFF" delay={1100} active={active} />
      <PopFlower x={130} y={195} petal="#F29C6B" delay={1300} active={active} />
      <Animated.View style={[styles.pin, pinStyle]}>
        <Svg width={56} height={72} viewBox="0 0 56 72">
          <Path d="M28 2 C13 2 2 13 2 28 C2 47 28 70 28 70 C28 70 54 47 54 28 C54 13 43 2 28 2 Z" fill={Colors.greenDark} />
          <Circle cx="28" cy="27" r="11" fill="#FFFFFF" />
          <Circle cx="28" cy="27" r="5" fill={Colors.honeyPrimary} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.clockBadge, clockStyle]}>
        <Text style={styles.clockIcon}>🕒</Text>
        <Text style={styles.clockText}>{nowLabel()}</Text>
      </Animated.View>
    </View>
  );
}

/* ---------- 4 · Odds: probability bars filling up ---------- */

const ODDS = [
  { name: t('onboarding.odds.plant1'), color: '#E9B949', pct: 58 },
  { name: t('onboarding.odds.plant2'), color: '#F1E2B8', pct: 27 },
  { name: t('onboarding.odds.plant3'), color: '#B78A5C', pct: 15 },
];

function OddsRow({ name, color, pct, index, active }: { name: string; color: string; pct: number; index: number; active: boolean }) {
  const t = useSharedValue(0);
  useSceneAnimation(active, [t], () => {
    t.value = withDelay(300 + index * 250, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  });
  const rowStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 3), transform: [{ translateX: (1 - Math.min(1, t.value * 2)) * 30 }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${t.value * pct}%` }));
  return (
    <Animated.View style={[styles.oddsRow, rowStyle]}>
      <View style={styles.oddsHeader}>
        <View style={[styles.oddsSwatch, { backgroundColor: color }]} />
        <Text style={styles.oddsName}>{name}</Text>
        <Text style={styles.oddsPct}>{pct}%</Text>
      </View>
      <View style={styles.oddsTrack}>
        <Animated.View style={[styles.oddsFill, { backgroundColor: color }, barStyle]} />
      </View>
    </Animated.View>
  );
}

export function OddsScene({ active }: SceneProps) {
  const enter = useSharedValue(0);
  useSceneAnimation(active, [enter], () => {
    enter.value = withSpring(1, { damping: 14 });
  });
  const cardStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ scale: 0.85 + enter.value * 0.15 }] }));

  return (
    <View style={styles.scene}>
      <Animated.View style={[styles.oddsCard, cardStyle]}>
        <View style={styles.oddsTop}>
          <Bee size={54} pollenColor="#E9B949" animated={active} />
          <View style={{ flex: 1 }}>
            <Text style={styles.oddsTitle}>{t('onboarding.odds.cardTitle')}</Text>
            <Text style={styles.oddsSub}>{t('onboarding.odds.cardSubtitle')}</Text>
          </View>
        </View>
        {ODDS.map((o, i) => (
          <OddsRow key={o.name} {...o} index={i} active={active} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { width: SCENE_SIZE, height: SCENE_SIZE, alignItems: 'center', justifyContent: 'center' },

  sunRays: { position: 'absolute', top: 10 },
  welcomeBee: { position: 'absolute', top: 70 },
  pollenDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.honeyPrimary },

  phone: { width: 170, height: 260, borderRadius: 30, backgroundColor: Colors.textPrimary, padding: 10, alignItems: 'center' },
  phoneNotch: { width: 50, height: 6, borderRadius: 3, backgroundColor: '#5A4A38', marginBottom: 8 },
  viewfinder: { flex: 1, alignSelf: 'stretch', borderRadius: 20, backgroundColor: '#EAF1DE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#FFFFFF' },
  focusRing: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 2.5, borderColor: Colors.honeyPrimary, top: 118, left: 72 },
  flash: { backgroundColor: '#FFFFFF' },
  shutter: { marginTop: 10, width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF' },

  mapCard: { position: 'absolute', width: 260, height: 220, borderRadius: 28, overflow: 'hidden', backgroundColor: '#EEF4E2', top: 30 },
  ringAnchor: { position: 'absolute', top: 150, width: 200, height: 200, marginTop: -100, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: Colors.greenPrimary },
  pin: { position: 'absolute', top: 82 },
  clockBadge: { position: 'absolute', top: 6, right: 4, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7, shadowColor: Colors.textPrimary, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  clockIcon: { fontSize: 14 },
  clockText: { fontFamily: 'Nunito-ExtraBold', fontSize: 13, color: Colors.textPrimary },

  oddsCard: { width: 260, backgroundColor: Colors.card, borderRadius: 24, padding: 18, gap: 12, shadowColor: Colors.textPrimary, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  oddsTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  oddsTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary },
  oddsSub: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted },
  oddsRow: { gap: 6 },
  oddsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oddsSwatch: { width: 16, height: 16, borderRadius: 5, borderWidth: 1, borderColor: '#00000012' },
  oddsName: { flex: 1, fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.textPrimary },
  oddsPct: { fontFamily: 'Nunito-Black', fontSize: 16, color: Colors.honeyDark },
  oddsTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: 'hidden' },
  oddsFill: { height: '100%', borderRadius: 4 },
});
