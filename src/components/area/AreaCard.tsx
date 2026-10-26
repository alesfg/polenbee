import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { monthName, PollenPalette } from '@/components/area/AreaVisuals';
import { Colors } from '@/constants/theme';
import { useAreaBloom } from '@/hooks/useAreaBloom';
import { t } from '@/i18n';
import { Place } from '@/types/pollen';

/** Home teaser for "Your area": palette of expected pollen colours + top plants. */
export function AreaCard({ place, onPress }: { place: Place; onPress: () => void }) {
  const month = new Date().getMonth() + 1;
  const { area, loading, error } = useAreaBloom(place, month);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!area}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('area.cardTitle', { month: monthName(month).toLowerCase() })}</Text>
          <Text style={styles.subtitle}>{t('area.cardSubtitle')}</Text>
        </View>
        {area && <Text style={styles.link}>{t('area.seeMore')} ›</Text>}
      </View>

      {!area && loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.honeyPrimary} />
          <Text style={styles.loadingText}>{t('area.loading')}</Text>
        </View>
      )}
      {!area && !loading && error && <Text style={styles.loadingText}>{t('area.error')}</Text>}

      {area && (
        <Animated.View entering={FadeIn.duration(300)}>
          <PollenPalette plants={area.plants} />
          <View style={styles.topList}>
            {area.plants.slice(0, 3).map((p) => (
              <View key={p.nombreCientifico} style={styles.topRow}>
                <View style={[styles.dot, { backgroundColor: p.colorPolen }]} />
                <Text style={styles.topName} numberOfLines={1}>{p.nombreComun}</Text>
                <Text style={styles.topShare}>{Math.round(p.share)}%</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 24, padding: 16, marginBottom: 24, gap: 12, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { fontFamily: 'Nunito-Black', fontSize: 18, color: Colors.textPrimary },
  subtitle: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  link: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.honeyDark, marginTop: 3 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted },
  topList: { marginTop: 12, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#00000014' },
  topName: { flex: 1, fontFamily: 'NunitoSans-SemiBold', fontSize: 14, color: Colors.textPrimary },
  topShare: { fontFamily: 'Nunito-ExtraBold', fontSize: 14, color: Colors.honeyDark },
});
