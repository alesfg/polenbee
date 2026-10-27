import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { PlantThumb } from '@/components/PlantThumb';
import { usePlantPhoto } from '@/lib/plantPhoto';
import { PollenSpecies } from '@/types/pollen';

export function SpeciesCard({ species, index, top }: { species: PollenSpecies; index: number; top?: boolean }) {
  const fill = useSharedValue(0);
  const photo = usePlantPhoto(species.nombreCientifico);
  useEffect(() => {
    fill.value = withDelay(250 + index * 150, withTiming(species.probabilidad, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [species.probabilidad]);
  const barStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  return (
    <View style={[styles.card, top && styles.cardTop]}>
      <View style={styles.header}>
        <PlantThumb photo={photo} pollenColor={species.colorPolen} size={top ? 64 : 52} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{species.nombreComun}</Text>
          <Text style={styles.scientific}>{species.nombreCientifico}</Text>
        </View>
        <Text style={[styles.prob, top && styles.probTop]}>{species.probabilidad}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: species.colorPolen }, barStyle]} />
      </View>
      {species.motivo ? <Text style={styles.reason}>{species.motivo}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.meta}>{t('result.pollen', { color: species.colorNombre })}</Text>
        <Text style={styles.meta}>🌸 {species.floracion}</Text>
      </View>
      {photo ? <Text style={styles.photoCredit} numberOfLines={1}>{photo.attribution}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { borderWidth: 2, borderColor: Colors.honeyLight },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  name: { fontFamily: 'NunitoSans-Bold', fontSize: 15.5, color: Colors.textPrimary },
  scientific: { fontSize: 12, color: Colors.textMuted, fontFamily: 'NunitoSans', fontStyle: 'italic', marginTop: 2 },
  prob: { fontFamily: 'Nunito-Black', fontSize: 20, color: Colors.textMuted2 },
  probTop: { fontSize: 26, color: Colors.honeyDark },
  track: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  reason: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted2, lineHeight: 19, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  meta: { fontSize: 11.5, color: Colors.textMuted, fontFamily: 'NunitoSans-SemiBold' },
  photoCredit: { fontFamily: 'NunitoSans', fontSize: 10, color: Colors.textMuted, marginTop: 8, opacity: 0.8 },
});
