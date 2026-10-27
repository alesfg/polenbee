import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyzingView } from '@/components/AnalyzingView';
import { AreaCard } from '@/components/area/AreaCard';
import { BeePhotos } from '@/components/BeePhotos';
import { DateTimeModal } from '@/components/DateTimeModal';
import { HistoryRow } from '@/components/HistoryRow';
import { Bee } from '@/components/illustrations/Bee';
import { LocationSearchModal } from '@/components/LocationSearchModal';
import { ResultView } from '@/components/ResultView';
import { Colors, Spacing } from '@/constants/theme';
import { usePollenAnalyses } from '@/hooks/usePollenAnalyses';
import { APP_NAME, locale, t } from '@/i18n';
import { analyzePollen } from '@/lib/analyzePollen';
import { getCurrentPlace } from '@/lib/location';
import { exifDate, exifPlace } from '@/lib/photoMeta';
import { posthog } from '@/lib/posthog';
import { PollenAnalysis, Place } from '@/types/pollen';

const LAST_PLACE_KEY = 'last_place';

interface Draft {
  imageUri: string;
  place: Place | null;
  placeFromPhoto: boolean;
  takenAt: Date;
  dateFromPhoto: boolean;
}

type ViewState =
  | { kind: 'capture' }
  | { kind: 'review'; draft: Draft }
  | { kind: 'analyzing'; draft: Draft }
  | { kind: 'result'; imageUri: string; analysis: PollenAnalysis }
  | { kind: 'error'; draft: Draft; message: string };

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatWhen(d: Date) {
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return t('home.today', { time });
  if (d.toDateString() === yesterday.toDateString()) return t('home.yesterday', { time });
  return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}, ${time}`;
}

function EditableRow({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.placeCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.placeIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.placeLabel} numberOfLines={1}>{title}</Text>
        <Text style={styles.placeMeta} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Text style={styles.placeChange}>{t('home.edit')}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const now = useClock();
  const { analyses, addLocal } = usePollenAnalyses();
  const [view, setView] = useState<ViewState>({ kind: 'capture' });
  const [place, setPlace] = useState<Place | null>(null);
  const [locating, setLocating] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LAST_PLACE_KEY);
      if (saved) setPlace(JSON.parse(saved));
      // Also asks for permission here in case it was never answered during onboarding.
      const current = await getCurrentPlace();
      if (current) rememberPlace(current);
      setLocating(false);
    })();
  }, []);

  function rememberPlace(p: Place) {
    setPlace(p);
    AsyncStorage.setItem(LAST_PLACE_KEY, JSON.stringify(p));
  }

  const zoneAnalyses = useMemo(
    () => (place ? analyses.filter((a) => a.placeName === place.label) : []),
    [analyses, place]
  );

  async function pickImage(camera: boolean) {
    let result: ImagePicker.ImagePickerResult;
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, exif: true });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, exif: true });
    }
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    // Gallery photos may be from another day or place: prefer what the photo itself says, then let the user fix it.
    const photoDate = camera ? null : exifDate(asset.exif);
    const draft: Draft = {
      imageUri: asset.uri,
      place,
      placeFromPhoto: false,
      takenAt: photoDate ?? new Date(),
      dateFromPhoto: !!photoDate,
    };
    setView({ kind: 'review', draft });
    posthog.capture('pollen_photo_selected', { source: camera ? 'camera' : 'gallery', exif_date: !!photoDate });

    if (!camera) {
      const photoPlace = await exifPlace(asset.exif);
      if (photoPlace) {
        setView((v) => (v.kind === 'review' && v.draft.imageUri === asset.uri
          ? { kind: 'review', draft: { ...v.draft, place: photoPlace, placeFromPhoto: true } }
          : v));
      }
    }
  }

  function updateDraft(patch: Partial<Draft>) {
    setView((v) => (v.kind === 'review' ? { kind: 'review', draft: { ...v.draft, ...patch } } : v));
  }

  async function analyze(draft: Draft) {
    if (!draft.place) {
      setShowLocation(true);
      return;
    }
    setView({ kind: 'analyzing', draft });
    const res = await analyzePollen(draft.imageUri, draft.place, draft.takenAt);
    if (res.ok) {
      addLocal(res.analysis);
      setView({ kind: 'result', imageUri: draft.imageUri, analysis: res.analysis });
      posthog.capture('pollen_analysis_completed', {
        top: res.analysis.species[0]?.nombreCientifico,
        quality: res.analysis.photoQuality,
      });
    } else {
      setView({ kind: 'error', draft, message: res.message });
      posthog.capture('pollen_analysis_failed');
    }
  }

  const draft = view.kind === 'review' ? view.draft : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.brand}
          onPress={() => setView({ kind: 'capture' })}
          disabled={view.kind === 'analyzing'}
          activeOpacity={0.8}
        >
          <Bee size={38} animated={false} />
          <Text style={styles.brandText}>{APP_NAME}</Text>
        </TouchableOpacity>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/estadisticas')} activeOpacity={0.8} accessibilityLabel={t('stats.title')}>
            <Text style={styles.historyBtnText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/historial')} activeOpacity={0.8}>
            <Text style={styles.historyBtnText}>{t('home.history')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {view.kind === 'capture' && (
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity style={styles.placeCard} onPress={() => setShowLocation(true)} activeOpacity={0.8}>
              <View style={styles.placeIcon}>
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeLabel} numberOfLines={1}>
                  {place ? place.label : locating ? t('home.locating') : t('home.choosePlace')}
                </Text>
                <Text style={styles.placeMeta}>{formatWhen(now)}</Text>
              </View>
              {locating && !place ? (
                <ActivityIndicator size="small" color={Colors.honeyPrimary} />
              ) : (
                <Text style={styles.placeChange}>{place ? t('home.change') : t('home.choose')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.hero}>
              <BeePhotos height={210} />
              <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
              <Text style={styles.heroText}>
                {t('home.heroText')}
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(true)} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t('home.takePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
                <Text style={styles.linkBtnText}>{t('home.fromGallery')}</Text>
              </TouchableOpacity>
            </View>

            {place && (
              <AreaCard
                place={place}
                onPress={() =>
                  router.push({
                    pathname: '/zona',
                    params: { lat: String(place.latitude), lon: String(place.longitude), label: place.label },
                  })
                }
              />
            )}

            {zoneAnalyses.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('home.recentInArea')}</Text>
                  <TouchableOpacity onPress={() => router.push('/historial')}>
                    <Text style={styles.sectionLink}>{t('home.seeAll')}</Text>
                  </TouchableOpacity>
                </View>
                {zoneAnalyses.slice(0, 3).map((a) => (
                  <HistoryRow key={a.id} analysis={a} onPress={() => router.push({ pathname: '/historial', params: { id: a.id } })} />
                ))}
              </Animated.View>
            )}
          </Animated.View>
        )}

        {draft && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Image source={{ uri: draft.imageUri }} style={styles.reviewPhoto} contentFit="cover" />
            <Text style={styles.reviewTitle}>{t('review.title')}</Text>
            <Text style={styles.reviewText}>{t('review.text')}</Text>
            <EditableRow
              icon="📍"
              title={draft.place ? draft.place.label : t('review.choosePlace')}
              subtitle={draft.place ? (draft.placeFromPhoto ? t('review.placeFromPhoto') : t('review.placeCurrent')) : t('review.placeRequired')}
              onPress={() => setShowLocation(true)}
            />
            <EditableRow
              icon="🕒"
              title={formatWhen(draft.takenAt)}
              subtitle={draft.dateFromPhoto ? t('review.dateFromPhoto') : t('review.dateTaken')}
              onPress={() => setShowDate(true)}
            />
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => analyze(draft)} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{draft.place ? t('review.analyze') : t('review.choosePlace')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setView({ kind: 'capture' })}>
              <Text style={styles.linkBtnText}>{t('review.changePhoto')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {view.kind === 'analyzing' && <AnalyzingView imageUri={view.draft.imageUri} placeLabel={view.draft.place?.label ?? ''} />}

        {view.kind === 'result' && (
          <ResultView
            analysis={view.analysis}
            imageUri={view.imageUri}
            onNew={() => setView({ kind: 'capture' })}
            onHistory={() => router.push('/historial')}
          />
        )}

        {view.kind === 'error' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorCard}>
            <Bee size={90} pollenColor="#D9CBB0" animated={false} />
            <Text style={styles.errorTitle}>{t('error.title')}</Text>
            <Text style={styles.errorText}>{view.message}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => analyze(view.draft)} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('error.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setView({ kind: 'capture' })}>
              <Text style={styles.linkBtnText}>{t('error.back')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      <LocationSearchModal
        visible={showLocation}
        onClose={() => setShowLocation(false)}
        onSelect={(p) => {
          rememberPlace(p);
          updateDraft({ place: p, placeFromPhoto: false });
        }}
      />
      {draft && (
        <DateTimeModal
          visible={showDate}
          value={draft.takenAt}
          onClose={() => setShowDate(false)}
          onChange={(d) => updateDraft({ takenAt: d, dateFromPhoto: false })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  headerBtns: { flexDirection: 'row', gap: 8 },
  historyBtn: { backgroundColor: Colors.honeyFaint, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  historyBtnText: { fontFamily: 'Nunito-ExtraBold', fontSize: 13.5, color: Colors.honeyDark },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },

  placeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 18, padding: 12, marginBottom: 12, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  placeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  placeLabel: { fontFamily: 'NunitoSans-Bold', fontSize: 14.5, color: Colors.textPrimary },
  placeMeta: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  placeChange: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.honeyDark },

  hero: { backgroundColor: Colors.honeySoft, borderRadius: 28, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14, alignItems: 'center', marginTop: 4, marginBottom: 24, overflow: 'hidden' },
  heroTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary, textAlign: 'center', marginTop: 16, paddingHorizontal: 10 },
  heroText: { fontFamily: 'NunitoSans', fontSize: 14.5, color: Colors.textMuted2, textAlign: 'center', lineHeight: 21, marginTop: 8, marginBottom: 18, paddingHorizontal: 10 },
  primaryBtn: { alignSelf: 'stretch', backgroundColor: Colors.greenDark, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 16.5 },
  linkBtn: { paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 14.5 },

  reviewPhoto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 24, backgroundColor: Colors.honeyFaint, marginBottom: 16 },
  reviewTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  reviewText: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted2, lineHeight: 20, marginTop: 4, marginBottom: 14 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary },
  sectionLink: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.honeyDark },

  errorCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, alignItems: 'center', gap: 8, marginTop: 24 },
  errorTitle: { fontFamily: 'Nunito-Black', fontSize: 20, color: Colors.textPrimary, textAlign: 'center' },
  errorText: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted2, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
});
