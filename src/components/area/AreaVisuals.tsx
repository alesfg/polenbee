import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { locale, t, TranslationKey } from '@/i18n';
import { AreaPlant } from '@/types/pollen';

export function monthName(month: number, style: 'long' | 'short' | 'narrow' = 'long') {
  const name = new Date(2024, month - 1, 1).toLocaleDateString(locale, { month: style });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The AI sometimes answers "9-11"; show it as "Sep – Nov". */
export function formatBloom(floracion: string) {
  const m = floracion.trim().match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
  if (!m) return floracion;
  const [from, to] = [Number(m[1]), Number(m[2])];
  if (from < 1 || from > 12 || to < 1 || to > 12) return floracion;
  return `${monthName(from, 'short')} – ${monthName(to, 'short')}`;
}

/* ---------- Palette: one strip, each plant's pollen colour sized by its share ---------- */

function PaletteSegment({ plant, index }: { plant: AreaPlant; index: number }) {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withDelay(index * 90, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [plant.share]);
  const style = useAnimatedStyle(() => ({ flexGrow: Math.max(plant.share, 4) * grow.value }));
  return <Animated.View style={[styles.segment, { backgroundColor: plant.colorPolen }, style]} />;
}

export function PollenPalette({ plants, height = 22 }: { plants: AreaPlant[]; height?: number }) {
  return (
    <View style={[styles.palette, { height, borderRadius: height / 2 }]}>
      {plants.map((p, i) => (
        <PaletteSegment key={p.nombreCientifico} plant={p} index={i} />
      ))}
    </View>
  );
}

/* ---------- Bubbles: pollen loads sized by share ---------- */

function Bubble({ plant, index, max }: { plant: AreaPlant; index: number; max: number }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(index * 110, withSpring(1, { damping: 9, stiffness: 140 }));
  }, [plant.nombreCientifico]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const size = 34 + 54 * Math.sqrt(plant.share / max);
  return (
    <Animated.View style={[styles.bubbleWrap, style]}>
      <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: plant.colorPolen }]}>
        <View style={[styles.bubbleShine, { width: size * 0.28, height: size * 0.18, borderRadius: size }]} />
      </View>
      <Text style={styles.bubbleLabel} numberOfLines={1}>{plant.nombreComun}</Text>
    </Animated.View>
  );
}

export function PollenBubbles({ plants }: { plants: AreaPlant[] }) {
  const max = Math.max(...plants.map((p) => p.share), 1);
  return (
    <View style={styles.bubbles}>
      {plants.map((p, i) => (
        <Bubble key={p.nombreCientifico} plant={p} index={i} max={max} />
      ))}
    </View>
  );
}

/* ---------- Year curve: 12 bars, tap one to switch month ---------- */

function MonthBar({ value, max, index, selected, current, onPress }: { value: number; max: number; index: number; selected: boolean; current: boolean; onPress?: () => void }) {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withDelay(index * 45, withTiming(value / max, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [value, max]);
  const barStyle = useAnimatedStyle(() => ({ height: `${Math.max(grow.value * 100, 4)}%` }));
  return (
    <TouchableOpacity style={styles.monthCol} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.monthTrack}>
        <Animated.View style={[styles.monthBar, selected ? styles.monthBarSelected : current ? styles.monthBarCurrent : null, barStyle]} />
      </View>
      <Text style={[styles.monthLabel, selected && styles.monthLabelSelected]}>{monthName(index + 1, 'narrow')}</Text>
    </TouchableOpacity>
  );
}

export function BloomCurve({ monthly, selected, onSelect }: { monthly: number[]; selected: number; onSelect?: (month: number) => void }) {
  const max = Math.max(...monthly, 1);
  const current = new Date().getMonth() + 1;
  return (
    <View style={styles.curve}>
      {monthly.map((v, i) => (
        <MonthBar
          key={i}
          value={v}
          max={max}
          index={i}
          selected={selected === i + 1}
          current={current === i + 1}
          onPress={onSelect ? () => onSelect(i + 1) : undefined}
        />
      ))}
    </View>
  );
}

/* ---------- Plant card ---------- */

const SUPPLY_ICON = { polen: '🟠', nectar: '💧', ambos: '🟠💧' } as const;

export function AreaPlantCard({ plant, index }: { plant: AreaPlant; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(120 + index * 70).duration(350)} style={styles.plantCard}>
      <View style={styles.plantHeader}>
        <View style={[styles.plantSwatch, { backgroundColor: plant.colorPolen }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.nombreComun}</Text>
          <Text style={styles.plantScientific} numberOfLines={1}>{plant.nombreCientifico}</Text>
        </View>
        <View style={[styles.importance, styles[`importance${plant.importancia}` as const]]}>
          <Text style={styles.importanceText}>{t(`area.importance.${plant.importancia}` as TranslationKey)}</Text>
        </View>
      </View>
      <View style={styles.tags}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{SUPPLY_ICON[plant.aporte]} {t(`area.supply.${plant.aporte}` as TranslationKey)}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{t('result.pollen', { color: plant.colorNombre })}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>🌸 {formatBloom(plant.floracion)}</Text>
        </View>
      </View>
      {plant.nota ? <Text style={styles.plantNote}>{plant.nota}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  palette: { flexDirection: 'row', overflow: 'hidden', backgroundColor: Colors.border, gap: 2 },
  segment: { height: '100%', flexBasis: 0 },

  bubbles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 10, paddingVertical: 6 },
  bubbleWrap: { alignItems: 'center', maxWidth: 96 },
  bubble: { borderWidth: 1, borderColor: '#00000014', shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  bubbleShine: { position: 'absolute', top: '18%', left: '22%', backgroundColor: '#FFFFFF', opacity: 0.45 },
  bubbleLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 11.5, color: Colors.textMuted2, marginTop: 5, textAlign: 'center' },

  curve: { flexDirection: 'row', height: 120, gap: 4, alignItems: 'flex-end' },
  monthCol: { flex: 1, alignItems: 'center', height: '100%' },
  monthTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  monthBar: { width: '100%', borderRadius: 6, backgroundColor: Colors.honeyLight },
  monthBarCurrent: { backgroundColor: Colors.honeyPrimary, opacity: 0.55 },
  monthBarSelected: { backgroundColor: Colors.honeyPrimary },
  monthLabel: { fontFamily: 'NunitoSans-Bold', fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  monthLabelSelected: { color: Colors.honeyDark },

  plantCard: { backgroundColor: Colors.card, borderRadius: 18, padding: 14, marginBottom: 10, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  plantHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plantSwatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#00000014' },
  plantName: { fontFamily: 'NunitoSans-Bold', fontSize: 15, color: Colors.textPrimary },
  plantScientific: { fontFamily: 'NunitoSans', fontStyle: 'italic', fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  importance: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  importance3: { backgroundColor: Colors.statusFuerteBg },
  importance2: { backgroundColor: Colors.statusMediaBg },
  importance1: { backgroundColor: Colors.honeyFaint },
  importanceText: { fontFamily: 'NunitoSans-Bold', fontSize: 11.5, color: Colors.textPrimary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: Colors.bg, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontFamily: 'NunitoSans-SemiBold', fontSize: 11.5, color: Colors.textMuted2 },
  plantNote: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted2, lineHeight: 18, marginTop: 8 },
});
