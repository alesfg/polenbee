import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { locale } from '@/i18n';
import { PollenAnalysis } from '@/types/pollen';

export function formatAnalysisDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
}

export function HistoryRow({ analysis, onPress, showPlace }: { analysis: PollenAnalysis; onPress?: () => void; showPlace?: boolean }) {
  const top = analysis.species[0];
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.75 : 1} disabled={!onPress}>
      <View style={[styles.swatch, { backgroundColor: analysis.pollenColor ?? top.colorPolen }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.species} numberOfLines={1}>{top.nombreComun}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatAnalysisDate(analysis.photoTakenAt)}
          {showPlace && analysis.placeName ? ` · ${analysis.placeName}` : ''}
        </Text>
      </View>
      <Text style={styles.prob}>{top.probabilidad}%</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: Colors.card, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#00000014' },
  species: { fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.textPrimary },
  meta: { fontSize: 11.5, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 2 },
  prob: { fontSize: 16, fontFamily: 'Nunito-ExtraBold', color: Colors.honeyDark },
});
