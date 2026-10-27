import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { monthName } from '@/components/area/AreaVisuals';
import { Bee } from '@/components/illustrations/Bee';
import { HoneyJar } from '@/components/illustrations/HoneyJar';
import { PlantThumb } from '@/components/PlantThumb';
import { Colors, Spacing } from '@/constants/theme';
import { useHoney } from '@/hooks/useHoney';
import { groupByZone, usePollenAnalyses } from '@/hooks/usePollenAnalyses';
import { t } from '@/i18n';
import { usePlantPhoto } from '@/lib/plantPhoto';
import { computeStats, PlantShare } from '@/lib/pollenStats';

const MIX_ROWS = 6;
const NECTAR_PALETTE = ['#C9822B', '#E0A53A', '#EBC46B', '#9C6A3A', '#F2D99A', '#7E5229'];

const pct = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ zone?: string }>();
  const { analyses, loading } = usePollenAnalyses();
  const groups = useMemo(() => groupByZone(analyses), [analyses]);
  // Honey is per apiary, so start on the zone with the most analyses.
  const busiest = useMemo(() => [...groups].sort((a, b) => b.analyses.length - a.analyses.length)[0]?.zone ?? null, [groups]);
  const [picked, setPicked] = useState<string | null | undefined>(params.zone);
  const zone = picked === undefined ? busiest : picked;

  const list = useMemo(() => (zone ? groups.find((g) => g.zone === zone)?.analyses ?? [] : analyses), [analyses, groups, zone]);
  const stats = useMemo(() => computeStats(list), [list]);
  const { honey, loading: honeyLoading, error: honeyError } = useHoney(stats.plants, zone);

  const activeMonths = stats.byMonth.filter((n) => n > 0).length;
  const maxMonth = Math.max(...stats.byMonth, 1);
  const mixTop = stats.plants.slice(0, MIX_ROWS);
  const othersShare = stats.plants.slice(MIX_ROWS).reduce((s, p) => s + p.share, 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('stats.title')}</Text>
      </View>

      {groups.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
          {[...groups.map((g) => g.zone), null].map((z) => {
            const selected = zone === z;
            return (
              <TouchableOpacity key={z ?? 'all'} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setPicked(z)}>
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

        {!loading && stats.total === 0 && (
          <View style={styles.empty}>
            <Bee size={110} />
            <Text style={styles.emptyTitle}>{t('stats.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('stats.emptyText')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/')}>
              <Text style={styles.primaryBtnText}>{t('history.emptyCta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {stats.total > 0 && (
          <>
            <Animated.View entering={FadeInDown.duration(350)} style={styles.tiles}>
              <Tile value={stats.total} label={t('stats.analyses')} />
              <Tile value={stats.plants.length} label={t('stats.plants')} />
              <Tile value={activeMonths} label={t('stats.months')} />
            </Animated.View>

            {/* Honey */}
            <Animated.View entering={FadeInDown.delay(80).duration(350)} style={[styles.card, styles.honeyCard]}>
              <Text style={styles.cardTitle}>{t('stats.honeyTitle')}</Text>
              {honeyLoading && !honey && (
                <View style={styles.honeyLoading}>
                  <HoneyJar size={70} color={Colors.honeyLight} />
                  <Text style={styles.muted}>{t('stats.honeyLoading')}</Text>
                </View>
              )}
              {honeyError && !honey && <Text style={styles.muted}>{t('stats.honeyError')}</Text>}
              {honey && (
                <Animated.View entering={FadeIn.duration(400)}>
                  <View style={styles.honeyHead}>
                    <HoneyJar size={104} color={honey.colorMiel} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[styles.typeChip, honey.tipo === 'monofloral' && styles.typeChipMono]}>
                        <Text style={styles.typeChipText}>{t(honey.tipo === 'monofloral' ? 'stats.monofloral' : 'stats.multifloral')}</Text>
                      </View>
                      <Text style={styles.honeyName}>{honey.nombre}</Text>
                      <View style={styles.colorRow}>
                        <View style={[styles.colorDot, { backgroundColor: honey.colorMiel }]} />
                        <Text style={styles.muted}>{honey.colorNombre}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.traits}>
                    <Trait icon="👅" label={t('stats.flavour')} value={honey.sabor} />
                    <Trait icon="🌸" label={t('stats.aroma')} value={honey.aroma} />
                    <Trait icon="❄️" label={t('stats.crystallisation')} value={honey.cristalizacion} />
                  </View>

                  {honey.composicion.length > 0 && (
                    <>
                      <Text style={styles.subTitle}>{t('stats.nectarTitle')}</Text>
                      <View style={styles.stack}>
                        {honey.composicion.map((c, i) => (
                          <View key={c.nombreCientifico} style={{ flex: Math.max(c.porcentaje, 2), backgroundColor: NECTAR_PALETTE[i % NECTAR_PALETTE.length] }} />
                        ))}
                      </View>
                      {honey.composicion.map((c, i) => (
                        <View key={c.nombreCientifico} style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: NECTAR_PALETTE[i % NECTAR_PALETTE.length] }]} />
                          <Text style={styles.legendName} numberOfLines={1}>{c.nombreComun}</Text>
                          <Text style={styles.legendPct}>{c.porcentaje}%</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {honey.nota ? <Text style={styles.note}>💡 {honey.nota}</Text> : null}
                  {stats.total < 3 && (
                    <Text style={styles.warning}>
                      {stats.total === 1 ? t('stats.honeyFewOne') : t('stats.honeyFew', { count: stats.total })}
                    </Text>
                  )}
                  <Text style={styles.disclaimer}>{t('stats.honeyDisclaimer')}</Text>
                </Animated.View>
              )}
            </Animated.View>

            {/* Pollen mix */}
            <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.card}>
              <Text style={styles.cardTitle}>{t('stats.mixTitle')}</Text>
              <Text style={styles.hint}>{t('stats.mixHint')}</Text>
              <View style={styles.stack}>
                {mixTop.map((p) => (
                  <View key={p.nombreCientifico} style={{ flex: Math.max(p.share, 1.5), backgroundColor: p.colorPolen }} />
                ))}
                {othersShare > 0 && <View style={{ flex: othersShare, backgroundColor: Colors.border2 }} />}
              </View>
              {mixTop.map((p) => (
                <MixRow key={p.nombreCientifico} plant={p} />
              ))}
              {othersShare > 0.5 && (
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.border2 }]} />
                  <Text style={styles.legendName}>{t('stats.others')}</Text>
                  <Text style={styles.legendPct}>{pct(othersShare)}%</Text>
                </View>
              )}
            </Animated.View>

            {/* Pollen tray */}
            <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.card}>
              <Text style={styles.cardTitle}>{t('stats.trayTitle')}</Text>
              <Text style={styles.hint}>{t('stats.trayHint')}</Text>
              <View style={styles.tray}>
                {stats.colors.map((c) => (
                  <View key={c.id} style={[styles.pellet, { backgroundColor: c.color }]}>
                    <View style={styles.pelletShine} />
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Months */}
            <Animated.View entering={FadeInDown.delay(320).duration(350)} style={styles.card}>
              <Text style={styles.cardTitle}>{t('stats.monthsTitle')}</Text>
              <View style={styles.months}>
                {stats.byMonth.map((n, i) => (
                  <View key={i} style={styles.monthCol}>
                    <Text style={styles.monthCount}>{n > 0 ? n : ''}</Text>
                    <View style={styles.monthTrack}>
                      <View style={[styles.monthBar, { height: `${Math.max((n / maxMonth) * 100, n > 0 ? 8 : 3)}%` }, n > 0 && styles.monthBarOn]} />
                    </View>
                    <Text style={styles.monthLabel}>{monthName(i + 1, 'narrow')}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Trait({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.trait}>
      <Text style={styles.traitIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.traitLabel}>{label}</Text>
        <Text style={styles.traitValue}>{value}</Text>
      </View>
    </View>
  );
}

function MixRow({ plant }: { plant: PlantShare }) {
  const photo = usePlantPhoto(plant.nombreCientifico);
  return (
    <View style={styles.mixRow}>
      <PlantThumb photo={photo} pollenColor={plant.colorPolen} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={styles.mixName} numberOfLines={1}>{plant.nombreComun}</Text>
        {plant.topCount > 0 && <Text style={styles.mixMeta}>{t('stats.topTimes', { count: plant.topCount })}</Text>}
      </View>
      <Text style={styles.mixPct}>{pct(plant.share)}%</Text>
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
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center', gap: 12 },

  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  tileValue: { fontFamily: 'Nunito-Black', fontSize: 24, color: Colors.honeyDark },
  tileLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: Colors.textMuted },

  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 16, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  honeyCard: { backgroundColor: '#FFF8EA', borderWidth: 1.5, borderColor: Colors.honeyLight },
  cardTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 17, color: Colors.textPrimary, marginBottom: 4 },
  subTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 14, color: Colors.textPrimary, marginTop: 14, marginBottom: 8 },
  hint: { fontFamily: 'NunitoSans', fontSize: 12.5, color: Colors.textMuted, lineHeight: 17, marginBottom: 12 },
  muted: { fontFamily: 'NunitoSans-SemiBold', fontSize: 13, color: Colors.textMuted2 },

  honeyLoading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  honeyHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  typeChip: { alignSelf: 'flex-start', backgroundColor: Colors.honeyFaint, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  typeChipMono: { backgroundColor: Colors.honeySoft },
  typeChipText: { fontFamily: 'NunitoSans-Bold', fontSize: 11.5, color: Colors.honeyDark },
  honeyName: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary, lineHeight: 26 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#00000018' },
  traits: { marginTop: 14, gap: 8 },
  trait: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  traitIcon: { fontSize: 18 },
  traitLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 11, color: Colors.textMuted },
  traitValue: { fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.textPrimary },
  note: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted2, lineHeight: 19, marginTop: 12 },
  warning: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12.5, color: Colors.statusMediaFg, backgroundColor: Colors.statusMediaBg, borderRadius: 12, padding: 10, marginTop: 10, overflow: 'hidden' },
  disclaimer: { fontFamily: 'NunitoSans', fontSize: 11, color: Colors.textMuted, lineHeight: 15, marginTop: 10 },

  stack: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', gap: 2, marginBottom: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1, fontFamily: 'NunitoSans-SemiBold', fontSize: 13.5, color: Colors.textPrimary },
  legendPct: { fontFamily: 'Nunito-ExtraBold', fontSize: 14, color: Colors.textMuted2 },

  mixRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  mixName: { fontFamily: 'NunitoSans-Bold', fontSize: 14.5, color: Colors.textPrimary },
  mixMeta: { fontFamily: 'NunitoSans', fontSize: 11.5, color: Colors.textMuted },
  mixPct: { fontFamily: 'Nunito-Black', fontSize: 17, color: Colors.honeyDark },

  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: Colors.bg, borderRadius: 14, padding: 12 },
  pellet: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#00000014' },
  pelletShine: { position: 'absolute', top: 5, left: 6, width: 7, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF', opacity: 0.5 },

  months: { flexDirection: 'row', height: 110, gap: 4, alignItems: 'flex-end', marginTop: 6 },
  monthCol: { flex: 1, alignItems: 'center', height: '100%' },
  monthCount: { fontFamily: 'NunitoSans-Bold', fontSize: 10, color: Colors.textMuted2, height: 14 },
  monthTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  monthBar: { width: '100%', borderRadius: 5, backgroundColor: Colors.border },
  monthBarOn: { backgroundColor: Colors.honeyPrimary },
  monthLabel: { fontFamily: 'NunitoSans-Bold', fontSize: 11, color: Colors.textMuted, marginTop: 6 },

  empty: { alignItems: 'center', paddingTop: 50, gap: 8 },
  emptyTitle: { fontFamily: 'Nunito-Black', fontSize: 20, color: Colors.textPrimary },
  emptyText: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted2, textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: Colors.greenDark, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
});
