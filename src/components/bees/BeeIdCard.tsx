import { StyleSheet, Text, View } from 'react-native';

import { BeeProfile } from '@/components/illustrations/BeeProfile';
import { Colors } from '@/constants/theme';
import { CASTE_LOOK, CasteKey, isBeeKind, isRaceKey, KINDS, kindName, raceName, RACES, raceTraits } from '@/data/bees';
import { t, TranslationKey } from '@/i18n';
import { BeeId } from '@/types/pollen';

/** "Your bee": kind of bee the AI saw and, for honey bees, caste and likely race. */
export function BeeIdCard({ bee }: { bee: BeeId }) {
  if (bee.tipo === 'no_visible') return null;
  const notABee = bee.tipo === 'no_es_abeja';
  const kind = isBeeKind(bee.tipo) ? bee.tipo : null;
  const race = kind === 'melifera' && isRaceKey(bee.raza) ? bee.raza : null;
  const caste = kind === 'melifera' && bee.casta !== 'desconocida' ? (bee.casta as CasteKey) : null;

  // Race colours on the caste's body shape.
  const look = race
    ? { ...RACES[race].look, ...(caste && caste !== 'obrera' ? pickShape(CASTE_LOOK[caste]) : {}) }
    : caste
      ? CASTE_LOOK[caste]
      : kind
        ? KINDS[kind].look
        : KINDS.solitaria.look;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{t('beeId.title')}</Text>
      <View style={styles.row}>
        <View style={styles.art}>
          <BeeProfile look={look} size={140} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>{notABee ? t('beeId.notABee') : race ? raceName(race) : kind ? kindName(kind) : t('beeId.unknown')}</Text>
          {race ? <Text style={styles.scientific}>{RACES[race].scientific}</Text> : null}
          <View style={styles.chips}>
            {kind && race ? <Chip text={kindName(kind)} /> : null}
            {caste ? <Chip text={t(`beeId.caste.${caste}` as TranslationKey)} /> : null}
            {race ? <Chip text={t(`beeId.confidence.${bee.confianzaRaza}` as TranslationKey)} tone={bee.confianzaRaza} /> : null}
          </View>
        </View>
      </View>
      {bee.rasgos ? <Text style={styles.traits}>🔍 {bee.rasgos}</Text> : null}
      {race ? <Text style={styles.about}>{raceTraits(race)}</Text> : null}
      {kind === 'melifera' && !race ? <Text style={styles.about}>{t('beeId.raceUnknown')}</Text> : null}
      {notABee ? <Text style={styles.about}>{t('beeId.notABeeHint')}</Text> : null}
      {race ? <Text style={styles.disclaimer}>{t('beeId.disclaimer')}</Text> : null}
    </View>
  );
}

/** Body proportions of a caste without its colours. */
function pickShape(l: (typeof CASTE_LOOK)[CasteKey]) {
  return { abdomenLength: l.abdomenLength, abdomenHeight: l.abdomenHeight, bigEyes: l.bigEyes, sting: l.sting };
}

function Chip({ text, tone }: { text: string; tone?: 'alta' | 'media' | 'baja' }) {
  const bg = tone === 'alta' ? Colors.statusFuerteBg : tone === 'media' ? Colors.statusMediaBg : tone === 'baja' ? Colors.honeyFaint : Colors.bg;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  kicker: { fontFamily: 'Nunito-ExtraBold', fontSize: 13, color: Colors.honeyDark, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  art: { width: 128, height: 96, borderRadius: 16, backgroundColor: Colors.honeySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { fontFamily: 'Nunito-Black', fontSize: 19, color: Colors.textPrimary, lineHeight: 23 },
  scientific: { fontFamily: 'NunitoSans', fontStyle: 'italic', fontSize: 12, color: Colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  chip: { borderRadius: 100, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontFamily: 'NunitoSans-Bold', fontSize: 11, color: Colors.textPrimary },
  traits: { fontFamily: 'NunitoSans-SemiBold', fontSize: 13, color: Colors.textPrimary, lineHeight: 19, marginTop: 12 },
  about: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted2, lineHeight: 19, marginTop: 6 },
  disclaimer: { fontFamily: 'NunitoSans', fontSize: 11, color: Colors.textMuted, marginTop: 8 },
});
