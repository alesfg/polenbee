import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { language } from '@/i18n';

// Learning content is bilingual inline: { es, en } picked by the app language.
export type L = { es: string; en: string };
export const tl = (t: L) => t[language];

/** Counts up from 0 to `to` once, on the JS thread. */
export function useCountUp(to: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let start = 0;
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        setValue(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [to, duration, delay]);
  return value;
}

export function CountUp({ to, decimals = 0, prefix = '', suffix = '', delay = 0, style }: { to: number; decimals?: number; prefix?: string; suffix?: string; delay?: number; style?: object }) {
  const v = useCountUp(to, 1300, delay);
  const text = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
  return <Text style={style}>{`${prefix}${text}${suffix}`}</Text>;
}

/** Horizontal bar that grows to `pct` %. */
export function GrowBar({ pct, color, delay = 0, height = 12 }: { pct: number; color: string; delay?: number; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [pct, delay]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, style]} />;
}

/** Gentle up-and-down float for illustrations. */
export function Float({ children, amount = 6, duration = 1600, delay = 0 }: { children: ReactNode; amount?: number; duration?: number; delay?: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (t.value - 0.5) * amount * 2 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Slow pulse (scale) to draw attention. */
export function Pulse({ children, amount = 0.08, duration = 1200 }: { children: ReactNode; amount?: number; duration?: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(t);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + t.value * amount }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function Card({ children, index = 0, tint }: { children: ReactNode; index?: number; tint?: string }) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 90).duration(400)} style={[styles.card, tint ? { backgroundColor: tint } : null]}>
      {children}
    </Animated.View>
  );
}

export function Intro({ title, text }: { title: L; text: L }) {
  return (
    <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 14 }}>
      <Text style={styles.h1}>{tl(title)}</Text>
      <Text style={styles.lead}>{tl(text)}</Text>
    </Animated.View>
  );
}

export const learnStyles = StyleSheet.create({
  h2: { fontFamily: 'Nunito-ExtraBold', fontSize: 17, color: Colors.textPrimary },
  body: { fontFamily: 'NunitoSans', fontSize: 13.5, color: Colors.textMuted2, lineHeight: 20 },
  small: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  big: { fontFamily: 'Nunito-Black', fontSize: 28, color: Colors.honeyDark },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  h1: { fontFamily: 'Nunito-Black', fontSize: 24, color: Colors.textPrimary },
  lead: { fontFamily: 'NunitoSans', fontSize: 14.5, color: Colors.textMuted2, lineHeight: 21, marginTop: 6 },
});
