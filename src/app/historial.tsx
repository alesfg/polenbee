import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryRow } from '@/components/HistoryRow';
import { BrandBee } from '@/components/illustrations/BrandBee';
import { ResultView } from '@/components/ResultView';
import { PRIVACY_POLICY_URL } from '@/constants/config';
import { confirmDeleteData, deleteMyData } from '@/lib/deleteData';
import { Colors, Spacing } from '@/constants/theme';
import { groupByZone, usePollenAnalyses } from '@/hooks/usePollenAnalyses';
import { t } from '@/i18n';
import { PollenAnalysis } from '@/types/pollen';

/** Most frequent top species across a zone's analyses. */
function dominantSpecies(list: PollenAnalysis[]) {
  const counts = new Map<string, { name: string; color: string; n: number }>();
  for (const a of list) {
    const top = a.species[0];
    const prev = counts.get(top.nombreCientifico);
    counts.set(top.nombreCientifico, { name: top.nombreComun, color: a.pollenColor ?? top.colorPolen, n: (prev?.n ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 3);
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { analyses, loading } = usePollenAnalyses();
  const [openId, setOpenId] = useState<string | null>(id ?? null);
  const [zone, setZone] = useState<string | null>(null);

  const groups = useMemo(() => groupByZone(analyses), [analyses]);
  const visibleGroups = zone ? groups.filter((g) => g.zone === zone) : groups;

  useEffect(() => {
    if (id) setOpenId(id);
  }, [id]);

  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  async function handleDelete() {
    if (!(await confirmDeleteData())) return;
    setDeleting(true);
    setDeleteFailed(false);
    const ok = await deleteMyData();
    setDeleting(false);
    if (ok) router.replace('/onboarding');
    else setDeleteFailed(true);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('history.title')}</Text>
      </View>

      {groups.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
          {[null, ...groups.map((g) => g.zone)].map((z) => {
            const selected = zone === z;
            return (
              <TouchableOpacity key={z ?? 'all'} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setZone(z)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                  {z ? z.split(',')[0] : t('history.allAreas')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={Colors.honeyPrimary} style={{ marginTop: 40 }} />}

        {analyses.length > 0 && (
          <TouchableOpacity
            style={styles.statsBtn}
            onPress={() => router.push({ pathname: '/estadisticas', params: zone ? { zone } : {} })}
            activeOpacity={0.85}
          >
            <Text style={styles.statsBtnText}>{t('stats.open')}</Text>
            <Text style={styles.statsBtnSub}>{t('stats.honeyTitle')} →</Text>
          </TouchableOpacity>
        )}

        {!loading && analyses.length === 0 && (
          <View style={styles.empty}>
            <BrandBee size={110} />
            <Text style={styles.emptyTitle}>{t('history.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('history.emptyText')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/')}>
              <Text style={styles.primaryBtnText}>{t('history.emptyCta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {visibleGroups.map((group, gi) => (
          <Animated.View key={group.zone} entering={FadeInDown.delay(gi * 80)} style={styles.zone}>
            <View style={styles.zoneHeader}>
              <Text style={styles.zoneTitle}>📍 {group.zone}</Text>
              <Text style={styles.zoneCount}>
                {group.analyses.length === 1 ? t('history.countOne') : t('history.count', { count: group.analyses.length })}
              </Text>
            </View>
            <View style={styles.dominantRow}>
              {dominantSpecies(group.analyses).map((d) => (
                <View key={d.name} style={styles.dominantChip}>
                  <View style={[styles.dominantDot, { backgroundColor: d.color }]} />
                  <Text style={styles.dominantText}>{d.name}{d.n > 1 ? ` ×${d.n}` : ''}</Text>
                </View>
              ))}
            </View>

            {group.analyses.map((a) => (
              <Animated.View key={a.id} layout={LinearTransition}>
                <HistoryRow analysis={a} onPress={() => setOpenId(openId === a.id ? null : a.id)} />
                {openId === a.id && (
                  <Animated.View entering={FadeInDown.duration(250)} style={styles.detail}>
                    <ResultView analysis={a} />
                  </Animated.View>
                )}
              </Animated.View>
            ))}
          </Animated.View>
        ))}

        <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.privacy}>
          <Text style={styles.privacyText}>{t('history.privacy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color={Colors.statusDebilFg} />
          ) : (
            <Text style={styles.deleteText}>{t('delete.button')}</Text>
          )}
        </TouchableOpacity>
        {deleteFailed && <Text style={styles.deleteError}>{t('delete.error')}</Text>}
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
  chip: { backgroundColor: Colors.card, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.border, maxWidth: 200 },
  chipSelected: { backgroundColor: Colors.greenDark, borderColor: Colors.greenDark },
  chipText: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.textMuted2 },
  chipTextSelected: { color: '#fff' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },
  statsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF8EA', borderWidth: 1.5, borderColor: Colors.honeyLight, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 18 },
  statsBtnText: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary },
  statsBtnSub: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.honeyDark },
  zone: { marginBottom: 22 },
  zoneHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  zoneTitle: { flex: 1, fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary },
  zoneCount: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted },
  dominantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  dominantChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.honeyFaint, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  dominantDot: { width: 10, height: 10, borderRadius: 5 },
  dominantText: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: Colors.textMuted2 },
  detail: { backgroundColor: Colors.bgSheet, borderRadius: 18, padding: 14, marginBottom: 10, marginTop: -2 },
  empty: { alignItems: 'center', paddingTop: 50, gap: 8 },
  emptyTitle: { fontFamily: 'Nunito-Black', fontSize: 20, color: Colors.textPrimary },
  emptyText: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted2, textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: Colors.greenDark, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  privacy: { alignItems: 'center', paddingVertical: 16 },
  privacyText: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted, textDecorationLine: 'underline' },
  deleteBtn: { alignItems: 'center', paddingVertical: 10 },
  deleteText: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12.5, color: Colors.statusDebilFg },
  deleteError: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.statusDebilFg, textAlign: 'center' },
});
