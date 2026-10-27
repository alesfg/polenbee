import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import { getCurrentPlace, locationBlocked, searchPlaces } from '@/lib/location';
import { Place } from '@/types/pollen';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: Place) => void;
}

export function LocationSearchModal({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); setGpsError(false); }
  }, [visible]);

  function handleChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.trim().length < 2) { setResults([]); return; }
      setSearching(true);
      setResults(await searchPlaces(text));
      setSearching(false);
    }, 400);
  }

  async function handleGPS() {
    setGpsLoading(true);
    setGpsError(false);
    // Once denied, iOS never shows the prompt again: send the user to Settings instead.
    if (await locationBlocked()) {
      setGpsLoading(false);
      Linking.openSettings();
      return;
    }
    const place = await getCurrentPlace();
    setGpsLoading(false);
    if (place) { onSelect(place); onClose(); } else setGpsError(true);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('location.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('location.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleChange}
            placeholder={t('location.searchPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
          {searching && <ActivityIndicator size="small" color={Colors.honeyPrimary} style={{ marginLeft: 8 }} />}
        </View>

        <TouchableOpacity style={styles.gpsRow} onPress={handleGPS} disabled={gpsLoading}>
          <View style={styles.gpsBadge}>
            {gpsLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text>📡</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsTitle}>{t('location.useCurrent')}</Text>
            <Text style={styles.gpsSub}>
              {gpsError ? t('location.gpsError') : t('location.gpsHint')}
            </Text>
          </View>
        </TouchableOpacity>

        <FlatList
          data={results}
          keyExtractor={(r, i) => `${r.latitude},${r.longitude},${i}`}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultRow} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={styles.resultPin}>📍</Text>
              <Text style={styles.resultText} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length >= 2 && !searching ? (
              <Text style={styles.emptyText}>{t('location.noResults', { query })}</Text>
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
