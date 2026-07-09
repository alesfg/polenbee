import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  address: { city?: string; town?: string; village?: string; county?: string; state?: string; country?: string };
}

export function formatLocationResult(r: NominatimResult): string {
  const a = r.address;
  const parts = [a.city ?? a.town ?? a.village ?? r.name, a.state, a.country].filter(Boolean);
  return parts.join(', ');
}

async function searchLocations(query: string): Promise<NominatimResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=es&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PolenBee/1.0' } });
    return await res.json();
  } catch {
    return [];
  }
}

export async function getGPSLocation(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    return [place.city, place.region, place.country].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (label: string) => void;
  showGPS?: boolean;
}

export function LocationSearchModal({ visible, onClose, onSelect, showGPS = true }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); }
  }, [visible]);

  function handleChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.trim().length < 2) { setResults([]); return; }
      setSearching(true);
      const r = await searchLocations(text);
      setResults(r);
      setSearching(false);
    }, 400);
  }

  async function handleGPS() {
    setGpsLoading(true);
    const loc = await getGPSLocation();
    setGpsLoading(false);
    if (loc) { onSelect(loc); onClose(); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar ubicación</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleChange}
            placeholder="Buscar localidad, municipio…"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
          {searching && <ActivityIndicator size="small" color={Colors.honeyPrimary} style={{ marginLeft: 8 }} />}
        </View>

        {showGPS && (
          <TouchableOpacity style={styles.gpsRow} onPress={handleGPS} disabled={gpsLoading}>
            <View style={styles.gpsBadge}>
              {gpsLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text>📡</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>Usar mi ubicación actual</Text>
              <Text style={styles.gpsSub}>Detectar automáticamente via GPS</Text>
            </View>
          </TouchableOpacity>
        )}

        <FlatList
          data={results}
          keyExtractor={(r) => String(r.place_id)}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const label = formatLocationResult(item);
            return (
              <TouchableOpacity style={styles.resultRow} onPress={() => { onSelect(label); onClose(); }}>
                <Text style={styles.resultPin}>📍</Text>
                <Text style={styles.resultText} numberOfLines={2}>{label}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            query.length >= 2 && !searching ? (
              <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
            ) : null
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: Colors.textPrimary },
  closeBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  closeBtnText: { color: Colors.honeyDark, fontFamily: 'NunitoSans-SemiBold', fontSize: 15 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, marginBottom: 16, borderWidth: 1.5, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontFamily: 'NunitoSans', paddingVertical: 12 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.greenLight, borderRadius: 14, padding: 14, gap: 12, marginBottom: 16 },
  gpsBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.greenDark, alignItems: 'center', justifyContent: 'center' },
  gpsTitle: { fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.greenDark },
  gpsSub: { fontSize: 12, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  resultPin: { fontSize: 16 },
  resultText: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontFamily: 'NunitoSans' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, fontFamily: 'NunitoSans', paddingVertical: 24, fontSize: 14 },
});
