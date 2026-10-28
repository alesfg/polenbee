import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalBeesSection } from '@/components/bees/LocalBeesSection';
import { AreaPlantCard, BloomCurve, monthName, PollenBubbles, PollenPalette } from '@/components/area/AreaVisuals';
import { Colors, Spacing } from '@/constants/theme';
import { useAreaBloom } from '@/hooks/useAreaBloom';
import { t } from '@/i18n';
import { Place } from '@/types/pollen';

export default function AreaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lon?: string; label?: string; tab?: string }>();
  const place: Place | null =
    params.lat && params.lon ? { latitude: Number(params.lat), longitude: Number(params.lon), label: params.label ?? '' } : null;
  const [tab, setTab] = useState<'plants' | 'bees'>(params.tab === 'bees' ? 'bees' : 'plants');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const { area, loading, error } = useAreaBloom(place, month);
  // The year curve doesn't depend on the month, so keep showing it while another month loads.
  const [monthly, setMonthly] = useState<number[] | null>(null);
  if (area && area.monthly !== monthly) setMonthly(area.monthly);

  const shift = (delta: number) => setMonth((m) => ((m - 1 + delta + 12) % 12) + 1);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('area.screenTitle')}</Text>
          {place?.label ? <Text style={styles.place} numberOfLines={1}>📍 {place.label}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {!place && <Text style={styles.muted}>{t('area.noPlace')}</Text>}

        {place && (
          <View style={styles.tabs}>
            {(['plants', 'bees'] as const).map((k) => (
              <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabOn]} onPress={() => setTab(k)} activeOpacity={0.8}>
                <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{k === 'plants' ? t('area.tabPlants') : t('area.tabBees')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {place && tab === 'bees' && (
          <Animated.View entering={FadeIn.duration(250)}>
            <LocalBeesSection place={place} />
          </Animated.View>
        )}

        {place && tab === 'plants' && (
          <>
            <View style={styles.monthPicker}>
              <TouchableOpacity style={styles.monthBtn} onPress={() => shift(-1)} hitSlop={6}>
                <Text style={styles.monthBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthName(month)}</Text>
              <TouchableOpacity style={styles.monthBtn} onPress={() => shift(1)} hitSlop={6}>
                <Text style={styles.monthBtnText}>›</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator color={Colors.honeyPrimary} />
                <Text style={styles.muted}>{t('area.loading')}</Text>
              </View>
            )}
            {!loading && error && !area && <Text style={styles.muted}>{t('area.error')}</Text>}

            {area && area.month === month && (
              <Animated.View key={month} entering={FadeIn.duration(300)}>
                <View style={styles.heroCard}>
                  <PollenBubbles plants={area.plants} />
                  <Text style={styles.summary}>{area.summary}</Text>
                </View>

                <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('area.palette')}</Text>
                  <PollenPalette plants={area.plants} height={28} />
                  <Text style={styles.hint}>{t('area.paletteHint')}</Text>
                </Animated.View>
              </Animated.View>
            )}

            {monthly && (
              <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                <Text style={styles.sectionTitle}>{t('area.yearTitle')}</Text>
                <BloomCurve monthly={monthly} selected={month} onSelect={setMonth} />
                <Text style={styles.hint}>{area?.curveSource === 'flowering' ? t('area.yearHintFlowering') : t('area.yearHintAll')}</Text>
              </Animated.View>
            )}

            {area && area.month === month && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 4 }]}>{t('area.plantsTitle')}</Text>
                {area.plants.map((p, i) => (
                  <AreaPlantCard key={`${month}-${p.nombreCientifico}`} plant={p} index={i} />
                ))}
                <Text style={styles.source}>{t('area.source')}</Text>
              </>
            )}
          </>
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
  place: { fontFamily: 'NunitoSans', fontSize: 12.5, color: Colors.textMuted },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },

  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  monthBtnText: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.honeyDark, marginTop: -2 },
  monthTitle: { fontFamily: 'Nunito-Black', fontSize: 20, color: Colors.textPrimary },

  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, justifyContent: 'center' },
  heroCard: { backgroundColor: Colors.honeySoft, borderRadius: 26, padding: 16, marginBottom: 18, gap: 12 },
  summary: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted2, lineHeight: 20, textAlign: 'center' },
  section: { backgroundColor: Colors.card, borderRadius: 22, padding: 16, marginBottom: 18, gap: 10 },
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 2 },
  hint: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  muted: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.honeyFaint, borderRadius: 14, padding: 4, marginBottom: 14 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11 },
  tabOn: { backgroundColor: Colors.card, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  tabText: { fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.textMuted2 },
  tabTextOn: { color: Colors.textPrimary },
  source: { fontFamily: 'NunitoSans', fontSize: 11.5, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});
