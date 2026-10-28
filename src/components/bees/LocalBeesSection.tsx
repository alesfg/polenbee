import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BeeProfile } from '@/components/illustrations/BeeProfile';
import { PlantBanner } from '@/components/PlantThumb';
import { Colors } from '@/constants/theme';
import { KINDS, kindName, RaceKey, raceName, raceOrigin, RACES, racesForPlace, raceTraits } from '@/data/bees';
import { LocalBee, useLocalBees } from '@/hooks/useLocalBees';
import { t } from '@/i18n';
import { Place } from '@/types/pollen';

export function LocalBeesSection({ place }: { place: Place }) {
  const { native, kept } = racesForPlace(place.latitude, place.longitude);
  const { data, loading } = useLocalBees(place);

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('bees.racesTitle')}</Text>
      <Text style={styles.hint}>{native.length ? t('bees.racesHint') : t('bees.racesHintIntroduced')}</Text>
      {native.map((k, i) => (
        <RaceCard key={k} race={k} badge={t('bees.native')} index={i} highlight />
      ))}
      {kept.map((k, i) => (
        <RaceCard key={k} race={k} badge={t('bees.kept')} index={native.length + i} />
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>{t('bees.wildTitle')}</Text>
      <Text style={styles.hint}>
        {data ? t('bees.wildHint', { count: data.total }) : t('bees.wildHintLoading')}
      </Text>
      {loading && !data && <ActivityIndicator color={Colors.honeyPrimary} style={{ marginVertical: 20 }} />}
      <View style={styles.grid}>
        {data?.bees.map((b, i) => (
          <WildBeeCard key={b.taxonId} bee={b} index={i} />
        ))}
      </View>
      {data ? <Text style={styles.source}>{t('bees.source')}</Text> : null}
    </View>
  );
}

export function RaceCard({ race, badge, index = 0, highlight }: { race: RaceKey; badge?: string; index?: number; highlight?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 80).duration(350)} style={[styles.raceCard, highlight && styles.raceCardHighlight]}>
      <View style={styles.raceArt}>
        <BeeProfile look={RACES[race].look} size={130} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        {badge ? (
          <View style={[styles.badge, highlight && styles.badgeHighlight]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Text style={styles.raceName}>{raceName(race)}</Text>
        <Text style={styles.scientific}>{RACES[race].scientific}</Text>
        <Text style={styles.origin}>📍 {raceOrigin(race)}</Text>
        <Text style={styles.traits}>{raceTraits(race)}</Text>
      </View>
    </Animated.View>
  );
}

function WildBeeCard({ bee, index }: { bee: LocalBee; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 60).duration(350)} style={styles.wildCard}>
      {bee.photo ? (
        <PlantBanner photo={bee.photo} pollenColor={Colors.honeyLight} height={120} viewer={{ title: bee.commonName ?? bee.scientificName, subtitle: bee.scientificName }} />
      ) : (
        <View style={styles.wildArt}>
          <BeeProfile look={KINDS[bee.kind].look} size={120} animated={false} />
        </View>
      )}
      <View style={styles.wildBody}>
        <Text style={styles.wildName} numberOfLines={2}>{bee.commonName ?? bee.scientificName}</Text>
        {bee.commonName ? <Text style={styles.scientific} numberOfLines={1}>{bee.scientificName}</Text> : null}
        <View style={styles.kindRow}>
          <BeeProfile look={KINDS[bee.kind].look} size={34} animated={false} />
          <Text style={styles.kindText} numberOfLines={1}>{kindName(bee.kind)}</Text>
        </View>
        <Text style={styles.obs}>{t('bees.observations', { count: bee.observations })}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 4 },
  hint: { fontFamily: 'NunitoSans', fontSize: 12.5, color: Colors.textMuted, lineHeight: 17, marginBottom: 12 },

  raceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 20, padding: 14, marginBottom: 10, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  raceCardHighlight: { backgroundColor: '#FFF8EA', borderWidth: 1.5, borderColor: Colors.honeyLight },
  raceArt: { width: 118, height: 90, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', backgroundColor: Colors.honeyFaint, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 2 },
  badgeHighlight: { backgroundColor: Colors.statusFuerteBg },
  badgeText: { fontFamily: 'NunitoSans-Bold', fontSize: 11, color: Colors.textPrimary },
  raceName: { fontFamily: 'Nunito-ExtraBold', fontSize: 16.5, color: Colors.textPrimary },
  scientific: { fontFamily: 'NunitoSans', fontStyle: 'italic', fontSize: 11.5, color: Colors.textMuted },
  origin: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: Colors.textMuted2 },
  traits: { fontFamily: 'NunitoSans', fontSize: 12.5, color: Colors.textMuted2, lineHeight: 17 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  wildCard: { width: '48%', flexGrow: 1, backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden', shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  wildArt: { height: 120, backgroundColor: Colors.honeySoft, alignItems: 'center', justifyContent: 'center' },
  wildBody: { padding: 10, gap: 2 },
  wildName: { fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.textPrimary },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  kindText: { flex: 1, fontFamily: 'NunitoSans-SemiBold', fontSize: 11.5, color: Colors.honeyDark },
  obs: { fontFamily: 'NunitoSans', fontSize: 11, color: Colors.textMuted },
  source: { fontFamily: 'NunitoSans', fontSize: 11.5, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },
});
