import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { HARVEST_DATA } from '@/data/mockData';

const maxKg = Math.max(...HARVEST_DATA.byHive.map((h) => h.kg));
const chartMax = Math.max(...HARVEST_DATA.seasons.map((s) => s.kg));

export default function CosechasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Cosechas</Text>

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.honeyDark }]}>{HARVEST_DATA.totalKg} kg</Text>
          <Text style={styles.statLabel}>Total temporada</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.greenPrimary }]}>{HARVEST_DATA.avgPerHive} kg</Text>
          <Text style={styles.statLabel}>Media / colmena</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.honeyDark }]}>{HARVEST_DATA.topProducer}</Text>
          <Text style={styles.statLabel}>Más productora</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Producción por temporada</Text>
        <View style={styles.chartArea}>
          {HARVEST_DATA.seasons.map((s, i) => {
            const isRecent = i >= HARVEST_DATA.seasons.length - 2;
            const heightPct = (s.kg / chartMax) * 100;
            return (
              <View key={s.label} style={styles.barColumn}>
                <Text style={styles.barValue}>{s.kg}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${heightPct}%` as any,
                        backgroundColor: isRecent ? Colors.honeyDark : Colors.honeyLight,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Per-hive list */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Por colmena · temporada actual</Text>
        {HARVEST_DATA.byHive.map((h) => {
          const pct = (h.kg / maxKg) * 100;
          return (
            <View key={h.code} style={styles.hiveRow}>
              <View style={styles.hiveRowLeft}>
                <Text style={styles.hiveCode}>{h.code}</Text>
                <Text style={styles.hiveApiary}>{h.apiary}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
              </View>
              <Text style={styles.hiveKg}>{h.kg} kg</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  screenTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary, marginBottom: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNumber: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, textAlign: 'center' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans', textAlign: 'center' },

  card: { backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 20 },

  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8, justifyContent: 'center' },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 12, fontFamily: 'NunitoSans-SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  barContainer: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 6, textAlign: 'center' },

  hiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  hiveRowLeft: { width: 80 },
  hiveCode: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.textPrimary },
  hiveApiary: { fontSize: 10, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 1 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.honeyPrimary, borderRadius: 4 },
  hiveKg: { width: 52, textAlign: 'right', fontFamily: 'NunitoSans-SemiBold', fontSize: 13, color: Colors.textPrimary },
});
