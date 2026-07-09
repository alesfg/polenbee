import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { HiveStatus } from '@/data/mockData';
import { getGPSLocation } from '@/components/LocationSearchModal';
import { useApiaries } from '@/hooks/useApiaries';
import { useHives } from '@/hooks/useHives';
import { useInspections } from '@/hooks/useInspections';
import { posthog } from '@/lib/posthog';

type InspectionDraft = {
  queenSeen: 'Sí' | 'No' | '';
  brood: 'Abundante' | 'Moderada' | 'Escasa' | 'Ninguna' | '';
  honey: 'Altas' | 'Medias' | 'Bajas' | '';
  pollen: 'Altas' | 'Medias' | 'Bajas' | '';
  varroa: 'Ninguno' | 'Leve' | 'Moderado' | 'Alto' | '';
  temperament: 'Tranquila' | 'Normal' | 'Agresiva' | '';
  loque: boolean;
  notes: string;
};

const emptyDraft: InspectionDraft = {
  queenSeen: '', brood: '', honey: '', pollen: '', varroa: '', temperament: '', loque: false, notes: '',
};

function statusColors(status: HiveStatus) {
  if (status === 'Fuerte') return { fg: Colors.statusFuerteFg, bg: Colors.statusFuerteBg };
  if (status === 'Media') return { fg: Colors.statusMediaFg, bg: Colors.statusMediaBg };
  return { fg: Colors.statusDebilFg, bg: Colors.statusDebilBg };
}

function PillSelector<T extends string>({
  label, options, value, onSelect, colorMap,
}: {
  label: string; options: readonly T[]; value: T | ''; onSelect: (v: T) => void;
  colorMap?: (v: T) => { fg: string; bg: string };
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const selected = value === opt;
          const cm = colorMap ? colorMap(opt) : null;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, selected && { backgroundColor: cm ? cm.bg : Colors.honeyFaint, borderColor: cm ? cm.fg : Colors.honeyDark }]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.pillText, selected && { color: cm ? cm.fg : Colors.honeyDark, fontFamily: 'NunitoSans-Bold' }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MapPlaceholder() {
  return (
    <View style={styles.mapArea}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[styles.mapStripe, { top: i * 20 - 10, backgroundColor: i % 2 === 0 ? '#D4C9B0' : '#C8BC9E' }]} />
      ))}
      <View style={styles.mapPin}>
        <View style={styles.mapPinHead} />
        <View style={styles.mapPinTail} />
      </View>
    </View>
  );
}

export default function ColmenaresScreen() {
  const insets = useSafeAreaInsets();
  const [apiaryId, setApiaryId] = useState<string | null>(null);
  const [hiveId, setHiveId] = useState<string | null>(null);
  const [showInspForm, setShowInspForm] = useState(false);
  const [showApiaryForm, setShowApiaryForm] = useState(false);
  const [showHiveForm, setShowHiveForm] = useState(false);
  const [draft, setDraft] = useState<InspectionDraft>(emptyDraft);

  // Apiary form state
  const [newApiaryName, setNewApiaryName] = useState('');
  const [newApiaryLocation, setNewApiaryLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Array<{ place_id: number; display_name: string; name: string; address: { city?: string; town?: string; village?: string; county?: string; state?: string; country?: string } }>>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hive form state
  const [newHiveCode, setNewHiveCode] = useState('');
  const [newHiveType, setNewHiveType] = useState<'Langstroth' | 'Layens' | 'Dadant'>('Langstroth');
  const [newHiveQueenAge, setNewHiveQueenAge] = useState('');
  const [newHiveMarking, setNewHiveMarking] = useState('');

  const { apiaries, loading: apiariesLoading, addApiary, deleteApiary } = useApiaries();
  const { hives, loading: hivesLoading, addHive, deleteHive } = useHives(apiaryId);
  const { inspections, addInspection } = useInspections(hiveId);

  const apiary = apiaries.find((a) => a.id === apiaryId);
  const hive = hives.find((h) => h.id === hiveId);
  const sc = hive ? statusColors(hive.status) : null;

  function varroaColorMap(v: string) {
    if (v === 'Ninguno') return { fg: Colors.statusFuerteFg, bg: Colors.statusFuerteBg };
    if (v === 'Leve') return { fg: Colors.statusMediaFg, bg: Colors.statusMediaBg };
    return { fg: Colors.statusDebilFg, bg: Colors.statusDebilBg };
  }

  async function saveInspection() {
    if (!hive) return;
    await addInspection(hive.id, {
      queenSeen: draft.queenSeen !== 'No',
      brood: draft.brood || 'Moderada',
      honey: draft.honey || 'Medias',
      pollen: draft.pollen || 'Medias',
      varroa: draft.varroa || 'Ninguno',
      loque: draft.loque,
      temperament: draft.temperament || 'Normal',
      notes: draft.notes,
    });
    posthog.capture('feature_used', { feature: 'new_inspection' });
    setShowInspForm(false);
    setDraft(emptyDraft);
  }

  function confirmDeleteApiary(id: string, name: string) {
    Alert.alert('Eliminar colmenar', `¿Eliminar "${name}"? Se eliminarán todas sus colmenas e inspecciones.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteApiary(id) },
    ]);
  }

  function confirmDeleteHive(id: string, code: string) {
    Alert.alert('Eliminar colmena', `¿Eliminar la colmena ${code}? Se eliminarán sus inspecciones.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteHive(id) },
    ]);
  }

  function handleLocationQuery(text: string) {
    setLocationQuery(text);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (text.trim().length < 2) { setLocationResults([]); return; }
    locationDebounceRef.current = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&accept-language=es&addressdetails=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'PolenBee/1.0' } });
        setLocationResults(await res.json());
      } catch { setLocationResults([]); }
      setLocationSearching(false);
    }, 400);
  }

  function selectLocation(r: { name: string; address: { city?: string; town?: string; village?: string; state?: string; country?: string } }) {
    const a = r.address;
    const label = [a.city ?? a.town ?? a.village ?? r.name, a.state, a.country].filter(Boolean).join(', ');
    setNewApiaryLocation(label);
    setShowLocationSearch(false);
    setLocationQuery('');
    setLocationResults([]);
  }

  async function saveApiary() {
    if (!newApiaryName) return;
    await addApiary(newApiaryName, newApiaryLocation);
    setNewApiaryName(''); setNewApiaryLocation('');
    setShowApiaryForm(false);
  }

  async function saveHive() {
    if (!apiaryId || !newHiveCode) return;
    await addHive(apiaryId, newHiveCode, newHiveType, parseInt(newHiveQueenAge) || 2, newHiveMarking);
    setNewHiveCode(''); setNewHiveQueenAge(''); setNewHiveMarking(''); setNewHiveType('Langstroth');
    setShowHiveForm(false);
  }

  const loading = apiariesLoading || hivesLoading;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        {(apiaryId || hiveId) && (
          <TouchableOpacity onPress={() => { if (hiveId) setHiveId(null); else setApiaryId(null); }} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Atrás</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>
              {hive ? `Colmena ${hive.code}` : apiary ? apiary.name : 'Colmenares'}
            </Text>
            {apiary && !hive && <Text style={styles.screenSubtitle}>{apiary.location}</Text>}
          </View>
          {!hiveId && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => hiveId ? null : apiaryId ? setShowHiveForm(true) : setShowApiaryForm(true)}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !hiveId ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.honeyPrimary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]} showsVerticalScrollIndicator={false}>
          {/* LIST VIEW */}
          {!apiaryId && (
            <>
              {apiaries.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyHex} />
                  <Text style={styles.emptyTitle}>Aún no tienes colmenares</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowApiaryForm(true)}>
                    <Text style={styles.emptyBtnText}>Añadir colmenar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                apiaries.map((a) => (
                  <TouchableOpacity key={a.id} style={styles.apiaryCard} onPress={() => setApiaryId(a.id)} onLongPress={() => confirmDeleteApiary(a.id, a.name)} activeOpacity={0.85}>
                    <MapPlaceholder />
                    <View style={styles.apiaryCardBottom}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.apiaryName}>{a.name}</Text>
                        <Text style={styles.apiaryLocation}>{a.location}</Text>
                      </View>
                      <View style={styles.hivePill}>
                        <Text style={styles.hivePillText}>{a.hiveCount} colmenas</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* APIARY DETAIL */}
          {apiaryId && !hiveId && (
            <>
              {hives.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Sin colmenas en este colmenar</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowHiveForm(true)}>
                    <Text style={styles.emptyBtnText}>Añadir colmena</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                hives.map((h) => {
                  const s = statusColors(h.status);
                  return (
                    <TouchableOpacity key={h.id} style={styles.hiveCard} onPress={() => setHiveId(h.id)} onLongPress={() => confirmDeleteHive(h.id, h.code)} activeOpacity={0.85}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={styles.hiveCode}>{h.code}</Text>
                          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                            <Text style={[styles.statusPillText, { color: s.fg }]}>{h.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.hiveMeta}>
                          {h.type} · Reina {h.queenAge} año{h.queenAge !== 1 ? 's' : ''}{h.lastInspection ? ` · Últ. ${h.lastInspection}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {/* HIVE DETAIL */}
          {hive && sc && (
            <>
              <View style={styles.infoGrid}>
                {[
                  { label: 'Tipo', value: hive.type },
                  { label: 'Estado', value: hive.status },
                  { label: 'Edad de la reina', value: `${hive.queenAge} año${hive.queenAge !== 1 ? 's' : ''}` },
                  { label: 'Marcaje', value: hive.queenMark || '—' },
                ].map((item) => (
                  <View key={item.label} style={styles.infoCell}>
                    <Text style={styles.infoCellLabel}>{item.label}</Text>
                    {item.label === 'Estado' ? (
                      <View style={[styles.statusPill, { backgroundColor: sc.bg, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.statusPillText, { color: sc.fg }]}>{item.value}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoCellValue}>{item.value}</Text>
                    )}
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.newInspBtn} onPress={() => setShowInspForm(true)}>
                <Text style={styles.newInspBtnText}>+ Nueva inspección</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Historial de inspecciones</Text>

              {inspections.length === 0 && (
                <Text style={[styles.hiveMeta, { textAlign: 'center', marginTop: 8 }]}>Sin inspecciones registradas</Text>
              )}

              {inspections.map((ins) => {
                const tc = ins.temperament === 'Tranquila'
                  ? { fg: Colors.statusFuerteFg, bg: Colors.statusFuerteBg }
                  : ins.temperament === 'Agresiva'
                  ? { fg: Colors.statusDebilFg, bg: Colors.statusDebilBg }
                  : { fg: Colors.statusMediaFg, bg: Colors.statusMediaBg };
                const vc = ins.varroa === 'Ninguno'
                  ? { fg: Colors.statusFuerteFg, bg: Colors.statusFuerteBg }
                  : ins.varroa === 'Leve'
                  ? { fg: Colors.statusMediaFg, bg: Colors.statusMediaBg }
                  : { fg: Colors.statusDebilFg, bg: Colors.statusDebilBg };

                return (
                  <View key={ins.id} style={styles.inspCard}>
                    <View style={styles.inspCardHeader}>
                      <Text style={styles.inspDate}>{ins.date}</Text>
                      <View style={[styles.statusPill, { backgroundColor: tc.bg }]}>
                        <Text style={[styles.statusPillText, { color: tc.fg }]}>{ins.temperament}</Text>
                      </View>
                    </View>
                    <View style={styles.chipRow}>
                      {[
                        { label: `Reina ${ins.queenSeen}`, color: ins.queenSeen === 'Sí' ? Colors.statusFuerteBg : Colors.statusDebilBg, fg: ins.queenSeen === 'Sí' ? Colors.statusFuerteFg : Colors.statusDebilFg },
                        { label: `Cría ${ins.brood}`, color: Colors.honeyFaint, fg: Colors.honeyDark },
                        { label: `Miel ${ins.honey}`, color: Colors.honeySoft, fg: Colors.honeyDark },
                        { label: `Polen ${ins.pollen}`, color: Colors.greenLight, fg: Colors.greenDark },
                        { label: `Varroa ${ins.varroa}`, color: vc.bg, fg: vc.fg },
                      ].map((chip) => (
                        <View key={chip.label} style={[styles.chip, { backgroundColor: chip.color }]}>
                          <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
                        </View>
                      ))}
                    </View>
                    {ins.notes ? <Text style={styles.inspNotes}>{ins.notes}</Text> : null}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* INSPECTION FORM MODAL */}
      <Modal visible={showInspForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Nueva inspección</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <PillSelector label="¿Se ha visto a la reina?" options={['Sí', 'No'] as const} value={draft.queenSeen} onSelect={(v) => setDraft((d) => ({ ...d, queenSeen: v }))}
                colorMap={(v) => v === 'Sí' ? { fg: Colors.statusFuerteFg, bg: Colors.statusFuerteBg } : { fg: Colors.statusDebilFg, bg: Colors.statusDebilBg }} />
              <PillSelector label="Cría" options={['Abundante', 'Moderada', 'Escasa', 'Ninguna'] as const} value={draft.brood} onSelect={(v) => setDraft((d) => ({ ...d, brood: v }))} />
              <PillSelector label="Reservas de miel" options={['Altas', 'Medias', 'Bajas'] as const} value={draft.honey} onSelect={(v) => setDraft((d) => ({ ...d, honey: v }))} />
              <PillSelector label="Reservas de polen" options={['Altas', 'Medias', 'Bajas'] as const} value={draft.pollen} onSelect={(v) => setDraft((d) => ({ ...d, pollen: v }))} />
              <PillSelector label="Varroa" options={['Ninguno', 'Leve', 'Moderado', 'Alto'] as const} value={draft.varroa} onSelect={(v) => setDraft((d) => ({ ...d, varroa: v }))}
                colorMap={varroaColorMap as (v: 'Ninguno' | 'Leve' | 'Moderado' | 'Alto') => { fg: string; bg: string }} />
              <PillSelector label="Temperamento" options={['Tranquila', 'Normal', 'Agresiva'] as const} value={draft.temperament} onSelect={(v) => setDraft((d) => ({ ...d, temperament: v }))} />
              <TouchableOpacity style={styles.loqueRow} onPress={() => setDraft((d) => ({ ...d, loque: !d.loque }))}>
                <View style={[styles.checkbox, draft.loque && { backgroundColor: Colors.statusDebilFg, borderColor: Colors.statusDebilFg }]}>
                  {draft.loque && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={styles.loqueText}>Signos de loque americana/europea</Text>
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>Notas</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Observaciones..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={draft.notes}
                onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
              />
              <View style={styles.sheetButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowInspForm(false); setDraft(emptyDraft); }}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveInspection}>
                  <Text style={styles.saveBtnText}>Guardar inspección</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* NUEVO COLMENAR MODAL */}
      <Modal visible={showApiaryForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Nuevo colmenar</Text>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput style={styles.formInput} value={newApiaryName} onChangeText={setNewApiaryName} placeholder="Ej. Valle del Jerte" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.fieldLabel}>Ubicación</Text>
            {!showLocationSearch ? (
              <TouchableOpacity
                style={[styles.formInput, styles.locationPicker]}
                onPress={() => setShowLocationSearch(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.locationPickerText, !newApiaryLocation && { color: Colors.textMuted }]}>
                  {newApiaryLocation || 'Buscar localidad…'}
                </Text>
                <Text style={styles.locationPickerIcon}>📍</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.locationInlineSearch}>
                <View style={styles.locationSearchRow}>
                  <TextInput
                    style={styles.locationSearchInput}
                    value={locationQuery}
                    onChangeText={handleLocationQuery}
                    placeholder="Escribe una localidad…"
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                  />
                  {locationSearching && <ActivityIndicator size="small" color={Colors.honeyPrimary} />}
                </View>
                <TouchableOpacity style={styles.locationGpsRow} onPress={async () => {
                  const loc = await getGPSLocation();
                  if (loc) { setNewApiaryLocation(loc); setShowLocationSearch(false); setLocationQuery(''); setLocationResults([]); }
                }}>
                  <Text style={styles.locationGpsText}>📡 Usar mi ubicación GPS</Text>
                </TouchableOpacity>
                {locationResults.map((r) => (
                  <TouchableOpacity key={r.place_id} style={styles.locationResultRow} onPress={() => selectLocation(r)}>
                    <Text style={styles.locationResultPin}>📍</Text>
                    <Text style={styles.locationResultText} numberOfLines={2}>
                      {[r.address.city ?? r.address.town ?? r.address.village ?? r.name, r.address.state, r.address.country].filter(Boolean).join(', ')}
                    </Text>
                  </TouchableOpacity>
                ))}
                {locationQuery.length >= 2 && !locationSearching && locationResults.length === 0 && (
                  <Text style={styles.locationEmpty}>Sin resultados</Text>
                )}
              </View>
            )}
            <View style={[styles.sheetButtons, { marginTop: 8 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowApiaryForm(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveApiary}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NUEVA COLMENA MODAL */}
      <Modal visible={showHiveForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Nueva colmena</Text>
            <Text style={styles.fieldLabel}>Código</Text>
            <TextInput style={styles.formInput} value={newHiveCode} onChangeText={setNewHiveCode} placeholder="Ej. C-01" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.pillRow}>
              {(['Langstroth', 'Layens', 'Dadant'] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.pill, newHiveType === t && { backgroundColor: Colors.honeyFaint, borderColor: Colors.honeyDark }]} onPress={() => setNewHiveType(t)}>
                  <Text style={[styles.pillText, newHiveType === t && { color: Colors.honeyDark, fontFamily: 'NunitoSans-Bold' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Edad de la reina (años)</Text>
            <TextInput style={styles.formInput} value={newHiveQueenAge} onChangeText={setNewHiveQueenAge} keyboardType="number-pad" placeholder="Ej. 2" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.fieldLabel}>Marcaje</Text>
            <TextInput style={styles.formInput} value={newHiveMarking} onChangeText={setNewHiveMarking} placeholder="Ej. Blanco · 2024" placeholderTextColor={Colors.textMuted} />
            <View style={[styles.sheetButtons, { marginTop: 8 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowHiveForm(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveHive}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  topHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  backBtn: { marginBottom: 4 },
  backText: { color: Colors.honeyDark, fontSize: 15, fontFamily: 'NunitoSans-SemiBold' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  screenTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  screenSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans' },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, color: Colors.honeyDark, lineHeight: 28 },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyHex: { width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.honeyFaint, transform: [{ rotate: '30deg' }] },
  emptyTitle: { fontFamily: 'NunitoSans-SemiBold', fontSize: 15, color: Colors.textMuted },
  emptyBtn: { backgroundColor: Colors.honeyPrimary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 14 },

  content: { paddingHorizontal: Spacing.lg, paddingTop: 4 },

  apiaryCard: { backgroundColor: Colors.card, borderRadius: 18, marginBottom: 10, overflow: 'hidden', shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  mapArea: { height: 84, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  mapStripe: { position: 'absolute', left: -20, right: -20, height: 20, transform: [{ rotate: '-20deg' }] },
  mapPin: { alignItems: 'center', zIndex: 2 },
  mapPinHead: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.honeyDark, marginBottom: -2 },
  mapPinTail: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.honeyDark },
  apiaryCardBottom: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  apiaryName: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary },
  apiaryLocation: { fontSize: 12, color: Colors.textMuted, fontFamily: 'NunitoSans' },
  hivePill: { backgroundColor: Colors.honeyFaint, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  hivePillText: { fontSize: 12, color: Colors.honeyDark, fontFamily: 'NunitoSans-SemiBold' },

  hiveCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  hiveCode: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary },
  hiveMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4, fontFamily: 'NunitoSans' },
  statusPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontFamily: 'NunitoSans-SemiBold' },
  chevron: { color: Colors.textMuted, fontSize: 20, fontWeight: '300' },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden', marginBottom: 14, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoCell: { width: '50%', padding: 16, borderBottomWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  infoCellLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: 'NunitoSans', marginBottom: 4 },
  infoCellValue: { fontFamily: 'NunitoSans-SemiBold', fontSize: 14, color: Colors.textPrimary },

  newInspBtn: { backgroundColor: Colors.honeyPrimary, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 20, shadowColor: Colors.honeyPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  newInspBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 16 },

  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 8 },

  inspCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  inspCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inspDate: { fontFamily: 'NunitoSans-Bold', fontSize: 13.5, color: Colors.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontFamily: 'NunitoSans-SemiBold' },
  inspNotes: { fontSize: 12.5, color: Colors.textMuted2, fontFamily: 'NunitoSans', marginTop: 6, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(58,44,29,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: 'NunitoSans-SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.honeyFaint, borderWidth: 1, borderColor: 'transparent' },
  pillText: { fontSize: 13, color: Colors.textMuted, fontFamily: 'NunitoSans-Medium' },
  loqueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center' },
  loqueText: { fontSize: 13, color: Colors.textPrimary, fontFamily: 'NunitoSans' },
  notesInput: { backgroundColor: Colors.bg, borderRadius: 12, padding: 12, fontSize: 13, color: Colors.textPrimary, fontFamily: 'NunitoSans', minHeight: 72, marginBottom: 20, textAlignVertical: 'top' },
  formInput: { backgroundColor: Colors.honeyFaint, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.textPrimary, fontFamily: 'NunitoSans', marginBottom: 14 },
  locationPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationPickerText: { fontSize: 14, color: Colors.textPrimary, fontFamily: 'NunitoSans', flex: 1 },
  locationPickerIcon: { fontSize: 16 },
  locationInlineSearch: { marginBottom: 14 },
  locationSearchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.honeyFaint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2, marginBottom: 8, gap: 8 },
  locationSearchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontFamily: 'NunitoSans', paddingVertical: 12 },
  locationGpsRow: { backgroundColor: Colors.greenLight, borderRadius: 10, padding: 10, marginBottom: 6 },
  locationGpsText: { fontSize: 13, color: Colors.greenDark, fontFamily: 'NunitoSans-SemiBold' },
  locationResultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  locationResultPin: { fontSize: 14 },
  locationResultText: { flex: 1, fontSize: 13.5, color: Colors.textPrimary, fontFamily: 'NunitoSans' },
  locationEmpty: { fontSize: 13, color: Colors.textMuted, fontFamily: 'NunitoSans', textAlign: 'center', paddingVertical: 10 },
  sheetButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.honeyFaint, alignItems: 'center' },
  cancelBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  saveBtn: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: Colors.greenDark, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
});
