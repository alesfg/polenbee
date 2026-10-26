import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { formatAnalysisDate } from '@/components/HistoryRow';
import { SpeciesCard } from '@/components/SpeciesCard';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { PollenAnalysis } from '@/types/pollen';

interface Props {
  analysis: PollenAnalysis;
  imageUri?: string | null;
  onNew?: () => void;
  onHistory?: () => void;
}

export function ResultView({ analysis, imageUri, onNew, onHistory }: Props) {
  return (
    <View>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: analysis.pollenColor ?? Colors.honeyLight }]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{analysis.photoQuality === 'sin_polen' ? t('result.estimateTitle') : t('result.title')}</Text>
          {analysis.pollenColorName ? (
            <View style={styles.colorChip}>
              <View style={[styles.colorDot, { backgroundColor: analysis.pollenColor ?? Colors.honeyPrimary }]} />
              <Text style={styles.colorChipText}>
                {analysis.photoQuality === 'sin_polen' ? t('result.expectedPollen', { color: analysis.pollenColorName }) : t('result.pollen', { color: analysis.pollenColorName })}
              </Text>
            </View>
          ) : null}
          <Text style={styles.meta}>
            {formatAnalysisDate(analysis.photoTakenAt)}
            {analysis.temperature != null ? ` · ${analysis.temperature} °C` : ''}
          </Text>
          {analysis.placeName ? <Text style={styles.meta} numberOfLines={1}>📍 {analysis.placeName}</Text> : null}
        </View>
      </Animated.View>

      {analysis.photoQuality && analysis.photoQuality !== 'clara' ? (
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.qualityBanner}>
          <Text style={styles.qualityIcon}>{analysis.photoQuality === 'sin_polen' ? '🌼' : '🔍'}</Text>
          <Text style={styles.qualityText}>
            {analysis.photoQuality === 'sin_polen'
              ? t('result.noPollenBanner')
              : t('result.unclearBanner')}
          </Text>
        </Animated.View>
      ) : null}

      {analysis.summary ? (
        <Animated.Text entering={FadeInDown.delay(100).duration(400)} style={styles.summary}>
          {analysis.summary}
        </Animated.Text>
      ) : null}

      {analysis.species.map((sp, i) => (
        <Animated.View key={`${sp.nombreCientifico}-${i}`} entering={FadeInDown.delay(150 + i * 120).duration(400)}>
          <SpeciesCard species={sp} index={i} top={i === 0} />
        </Animated.View>
      ))}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          {t('result.disclaimer')}
        </Text>
      </View>

      {(onNew || onHistory) && (
        <View style={styles.buttons}>
          {onHistory && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onHistory} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>{t('result.history')}</Text>
            </TouchableOpacity>
          )}
          {onNew && (
            <TouchableOpacity style={styles.primaryBtn} onPress={onNew} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('result.newPhoto')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  thumb: { width: 92, height: 92, borderRadius: 22 },
  kicker: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.card, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginVertical: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  colorChipText: { fontFamily: 'NunitoSans-Bold', fontSize: 12.5, color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 2 },
  qualityBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.greenLight, borderRadius: 14, padding: 12, marginBottom: 12 },
  qualityIcon: { fontSize: 16 },
  qualityText: { flex: 1, fontFamily: 'NunitoSans-SemiBold', fontSize: 13, color: Colors.greenDark, lineHeight: 19 },
  summary: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted2, lineHeight: 20, marginBottom: 14 },
  disclaimer: { backgroundColor: Colors.honeyFaint, borderRadius: 14, padding: 14, marginTop: 4, marginBottom: 18 },
  disclaimerText: { fontSize: 12, color: Colors.textMuted2, fontFamily: 'NunitoSans', lineHeight: 18 },
  buttons: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: Colors.honeyPrimary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  secondaryBtn: { flex: 1, backgroundColor: Colors.honeyFaint, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  secondaryBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
});
