import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { FALLBACK_POLLEN, PollenResult } from '@/data/mockData';
import { posthog } from '@/lib/posthog';
import { usePollenAnalyses } from '@/hooks/usePollenAnalyses';

type ViewState = 'capture' | 'analyzing' | 'results' | 'history';

const ANALYZING_MESSAGES = [
  'Detectando el color del polen…',
  'Cruzando ubicación y fecha…',
  'Calculando especies en floración…',
];

async function getLocationLabel(): Promise<string> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'España';
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    return [place.city, place.region, place.country].filter(Boolean).join(', ');
  } catch {
    return 'España';
  }
}

async function analyzePollenImage(base64: string): Promise<PollenResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_KEY;
  if (!apiKey) return FALLBACK_POLLEN;

  try {
    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const location = await getLocationLabel();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [
          {
            role: 'system',
            content: `Eres un experto en botánica y apicultura. La ubicación aproximada es ${location}. La fecha de hoy es ${today}.`,
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
              { type: 'text', text: 'Analiza el color del polen en las corbículas de la abeja. Cruza con la ubicación y época del año. Devuelve SOLO JSON sin markdown con esta forma: {"especies":[{"nombreComun":"...","nombreCientifico":"...","probabilidad":45,"colorPolen":"#hex","colorNombre":"rojo oscuro","floracion":"Abril - Junio"}]}. Entre 3 y 5 especies, probabilidades sumando ~100.' },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(text.trim());
    return parsed.especies as PollenResult[];
  } catch {
    return FALLBACK_POLLEN;
  }
}

export default function PolenScreen() {
  const insets = useSafeAreaInsets();
  const { analyses: pollenHistory, saveAnalysis } = usePollenAnalyses();
  const [view, setView] = useState<ViewState>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [results, setResults] = useState<PollenResult[]>([]);
  const [msgIndex, setMsgIndex] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (view === 'analyzing') {
      spinRef.current = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
      );
      spinRef.current.start();
      const interval = setInterval(() => setMsgIndex((i) => (i + 1) % ANALYZING_MESSAGES.length), 1000);
      return () => {
        clearInterval(interval);
        spinRef.current?.stop();
        spinAnim.setValue(0);
      };
    }
  }, [view]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  async function pickImage(camera: boolean) {
    let result;
    if (camera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    }
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setView('analyzing');
      posthog.capture('feature_used', { feature: 'pollen_analyzer' });
      const res = await analyzePollenImage(asset.base64 ?? '');
      setResults(res);
      setView('results');
    }
  }

  function saveToHistory() {
    if (!results.length) return;
    saveAnalysis(results, imageUri ?? undefined);
    setView('history');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Analizador de polen</Text>
        <TouchableOpacity onPress={() => setView(view === 'history' ? 'capture' : 'history')} style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>{view === 'history' ? '←' : '⏱'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* CAPTURE */}
        {view === 'capture' && (
          <>
            <Text style={styles.captureIntro}>
              Fotografía a tus abejas cuando vuelven a la colmena cargadas de polen. El analizador identificará las plantas que están visitando en tu zona.
            </Text>
            <View style={styles.uploadCard}>
              <View style={styles.cameraIconContainer}>
                <View style={styles.cameraIconBody}>
                  <View style={styles.cameraLens} />
                </View>
              </View>
              <Text style={styles.uploadLabel}>Sube o toma una foto</Text>
              <View style={styles.uploadBtns}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(true)}>
                  <Text style={styles.primaryBtnText}>Hacer foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(false)}>
                  <Text style={styles.secondaryBtnText}>Galería</Text>
                </TouchableOpacity>
              </View>
            </View>

            {pollenHistory.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Análisis recientes</Text>
                {pollenHistory.slice(0, 2).map((h) => (
                  <View key={h.id} style={styles.historyRow}>
                    <View style={[styles.colorSwatch, { backgroundColor: h.topSpecies.colorPolen }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historySpecies}>{h.topSpecies.nombreComun}</Text>
                      <Text style={styles.historyMeta}>{h.date} · {h.apiary}</Text>
                    </View>
                    <Text style={styles.historyProb}>{h.topSpecies.probabilidad}%</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ANALYZING */}
        {view === 'analyzing' && (
          <View style={styles.analyzingCard}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.thumbImg} />
            )}
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
            <Text style={styles.analyzingMsg}>{ANALYZING_MESSAGES[msgIndex]}</Text>
          </View>
        )}

        {/* RESULTS */}
        {view === 'results' && results.length > 0 && (
          <>
            <View style={styles.resultHeader}>
              {imageUri && <Image source={{ uri: imageUri }} style={styles.resultThumb} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>Resultado del análisis</Text>
                <Text style={styles.resultDate}>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
              </View>
            </View>

            {results.map((sp, i) => (
              <View key={i} style={styles.speciesCard}>
                <View style={styles.speciesHeader}>
                  <View style={[styles.colorSwatchLarge, { backgroundColor: sp.colorPolen }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.speciesName}>{sp.nombreComun}</Text>
                    <Text style={styles.speciesScientific}>{sp.nombreCientifico}</Text>
                  </View>
                  <Text style={styles.speciesProb}>{sp.probabilidad}%</Text>
                </View>
                <View style={styles.probBarBg}>
                  <View style={[styles.probBarFill, { width: `${sp.probabilidad}%` as any, backgroundColor: sp.colorPolen }]} />
                </View>
                <View style={styles.speciesFooter}>
                  <Text style={styles.speciesMeta}>Polen {sp.colorNombre}</Text>
                  <Text style={styles.speciesMeta}>Floración: {sp.floracion}</Text>
                </View>
              </View>
            ))}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                ⚠ Estimación orientativa basada en color, ubicación y época del año — no sustituye un análisis palinológico de laboratorio.
              </Text>
            </View>

            <View style={styles.resultBtns}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setImageUri(null); setResults([]); setView('capture'); }}>
                <Text style={styles.secondaryBtnText}>Nuevo análisis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnGreen} onPress={saveToHistory}>
                <Text style={styles.primaryBtnGreenText}>Guardar en historial</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* HISTORY */}
        {view === 'history' && (
          <>
            <Text style={styles.sectionTitle}>Historial de análisis</Text>
            {pollenHistory.map((h) => (
              <View key={h.id} style={styles.historyCard}>
                <View style={[styles.colorSwatchLarge, { backgroundColor: h.topSpecies.colorPolen }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historySpecies}>{h.topSpecies.nombreComun}</Text>
                  <Text style={styles.historyScientific}>{h.topSpecies.nombreCientifico}</Text>
                  <Text style={styles.historyMeta}>{h.date} · {h.apiary}</Text>
                </View>
                <Text style={[styles.historyProb, { color: Colors.honeyDark }]}>{h.topSpecies.probabilidad}%</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.sm },
  screenTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  headerIconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontSize: 18, color: Colors.honeyDark },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 4 },

  captureIntro: { fontSize: 13.5, color: Colors.textMuted, fontFamily: 'NunitoSans', lineHeight: 20, marginBottom: 20 },
  uploadCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: Colors.border2, borderStyle: 'dashed', marginBottom: 24 },
  cameraIconContainer: { marginBottom: 14 },
  cameraIconBody: { width: 52, height: 38, borderRadius: 8, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  cameraLens: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.honeyDark },
  uploadLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 },
  uploadBtns: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: Colors.honeyPrimary, borderRadius: 14, padding: 13, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 14 },
  secondaryBtn: { flex: 1, backgroundColor: Colors.honeyFaint, borderRadius: 14, padding: 13, alignItems: 'center' },
  secondaryBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 14 },
  primaryBtnGreen: { flex: 1, backgroundColor: Colors.greenDark, borderRadius: 14, padding: 13, alignItems: 'center' },
  primaryBtnGreenText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 14 },

  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 10 },

  historyRow: { backgroundColor: Colors.card, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  colorSwatch: { width: 32, height: 32, borderRadius: 8 },
  historySpecies: { fontFamily: 'NunitoSans-Bold', fontSize: 13.5, color: Colors.textPrimary },
  historyScientific: { fontFamily: 'NunitoSans', fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  historyMeta: { fontSize: 11.5, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 2 },
  historyProb: { fontSize: 15, fontFamily: 'Nunito-ExtraBold', color: Colors.textMuted },

  analyzingCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 32, alignItems: 'center', gap: 20, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  thumbImg: { width: 96, height: 96, borderRadius: 12 },
  spinner: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: Colors.border2, borderTopColor: Colors.greenPrimary },
  analyzingMsg: { fontSize: 14, color: Colors.textMuted, fontFamily: 'NunitoSans-SemiBold', textAlign: 'center' },

  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  resultThumb: { width: 64, height: 64, borderRadius: 12 },
  resultTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary },
  resultDate: { fontSize: 13, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 4 },

  speciesCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  speciesHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  colorSwatchLarge: { width: 40, height: 40, borderRadius: 10 },
  speciesName: { fontFamily: 'NunitoSans-Bold', fontSize: 15, color: Colors.textPrimary },
  speciesScientific: { fontSize: 12, color: Colors.textMuted, fontFamily: 'NunitoSans', fontStyle: 'italic', marginTop: 2 },
  speciesProb: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.honeyDark },
  probBarBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  probBarFill: { height: '100%', borderRadius: 3 },
  speciesFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  speciesMeta: { fontSize: 11.5, color: Colors.textMuted, fontFamily: 'NunitoSans' },

  disclaimer: { backgroundColor: Colors.honeyFaint, borderRadius: 14, padding: 14, marginBottom: 20, marginTop: 4 },
  disclaimerText: { fontSize: 12, color: Colors.textMuted2, fontFamily: 'NunitoSans', lineHeight: 18 },

  resultBtns: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  historyCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
});
