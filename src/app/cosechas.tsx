import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { posthog } from '@/lib/posthog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useHarvests } from '@/hooks/useHarvests';
import { useHives } from '@/hooks/useHives';

export default function CosechasScreen() {
  const insets = useSafeAreaInsets();
  const { harvests, loading, usingMock, mockData, addHarvest, deleteHarvest } = useHarvests();
  const { hives } = useHives();
  const [showForm, setShowForm] = useState(false);
  const [newHiveIndex, setNewHiveIndex] = useState(0);
  const [newKg, setNewKg] = useState('');
  const [newSeason, setNewSeason] = useState('');
  const [newDate, setNewDate] = useState(new Date());

  async function saveHarvest() {
    const hive = hives[newHiveIndex];
    if (!hive || !newKg) return;
    const isoDate = newDate.toISOString().split('T')[0];
    await addHarvest(hive.id, parseFloat(newKg), newSeason, isoDate);
    posthog.capture('feature_used', { feature: 'new_harvest' });
    setNewKg(''); setNewSeason(''); setNewDate(new Date()); setNewHiveIndex(0);
    setShowForm(false);
  }

  function confirmDelete(id: string, code: string) {
    Alert.alert('Eliminar cosecha', `¿Eliminar la cosecha de ${code}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteHarvest(id) },
    ]);
  }

  if (usingMock) {
    const { totalKg, avgPerHive, topProducer, seasons, byHive } = mockData;
    const maxKg = Math.max(...byHive.map((h) => h.kg));
    const chartMax = Math.max(...seasons.map((s) => s.kg));

    return (
      <ScrollView
        style={[styles.screen, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Cosechas</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <StatCards totalKg={totalKg} avgPerHive={avgPerHive} topProducer={topProducer} />
        <BarChart seasons={seasons} chartMax={chartMax} />
        <HiveList byHive={byHive} maxKg={maxKg} />
        <HarvestFormModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          hives={hives}
          newHiveIndex={newHiveIndex}
          setNewHiveIndex={setNewHiveIndex}
          newKg={newKg}
          setNewKg={setNewKg}
          newSeason={newSeason}
          setNewSeason={setNewSeason}
          newDate={newDate}
          setNewDate={setNewDate}
          onSave={saveHarvest}
          insets={insets}
        />
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.honeyPrimary} size="large" />
      </View>
    );
  }

  if (harvests.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.screenTitle}>Cosechas</Text>
        <Text style={styles.emptyText}>Aún no has registrado cosechas</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.emptyBtnText}>Registrar cosecha</Text>
        </TouchableOpacity>
        <HarvestFormModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          hives={hives}
          newHiveIndex={newHiveIndex}
          setNewHiveIndex={setNewHiveIndex}
          newKg={newKg}
          setNewKg={setNewKg}
          newSeason={newSeason}
          setNewSeason={setNewSeason}
          newDate={newDate}
          setNewDate={setNewDate}
          onSave={saveHarvest}
          insets={insets}
        />
      </View>
    );
  }

  const totalKg = harvests.reduce((s, h) => s + h.kg, 0);
  const avgPerHive = harvests.length ? +(totalKg / new Set(harvests.map((h) => h.hiveId)).size).toFixed(1) : 0;
  const topHive = harvests.reduce((best, h) => (!best || h.kg > best.kg) ? h : best, harvests[0]);
  const maxKg = Math.max(...harvests.map((h) => h.kg));

  const byHive = harvests.map((h) => ({ id: h.id, code: h.hiveCode, apiary: h.apiaryName, kg: h.kg }));

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Cosechas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <StatCards totalKg={+totalKg.toFixed(1)} avgPerHive={avgPerHive} topProducer={topHive.hiveCode} />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Por cosecha</Text>
        <HiveList byHive={byHive} maxKg={maxKg} onDelete={confirmDelete} />
      </View>
      <HarvestFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        hives={hives}
        newHiveIndex={newHiveIndex}
        setNewHiveIndex={setNewHiveIndex}
        newKg={newKg}
        setNewKg={setNewKg}
        newSeason={newSeason}
        setNewSeason={setNewSeason}
        newDate={newDate}
        setNewDate={setNewDate}
        onSave={saveHarvest}
        insets={insets}
      />
    </ScrollView>
  );
}

function StatCards({ totalKg, avgPerHive, topProducer }: { totalKg: number; avgPerHive: number; topProducer: string }) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: Colors.honeyDark }]}>{totalKg} kg</Text>
        <Text style={styles.statLabel}>Total temporada</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: Colors.greenPrimary }]}>{avgPerHive} kg</Text>
        <Text style={styles.statLabel}>Media / colmena</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: Colors.honeyDark }]}>{topProducer}</Text>
        <Text style={styles.statLabel}>Más productora</Text>
      </View>
    </View>
  );
}

function BarChart({ seasons, chartMax }: { seasons: { label: string; kg: number }[]; chartMax: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Producción por temporada</Text>
      <View style={styles.chartArea}>
        {seasons.map((s, i) => {
          const isRecent = i >= seasons.length - 2;
          const heightPct = (s.kg / chartMax) * 100;
          return (
            <View key={s.label} style={styles.barColumn}>
              <Text style={styles.barValue}>{s.kg}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height: `${heightPct}%` as any, backgroundColor: isRecent ? Colors.honeyDark : Colors.honeyLight }]} />
              </View>
              <Text style={styles.barLabel}>{s.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HiveList({ byHive, maxKg, onDelete }: { byHive: { id?: string; code: string; apiary: string; kg: number }[]; maxKg: number; onDelete?: (id: string, code: string) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Por colmena · temporada actual</Text>
      {byHive.map((h) => {
        const pct = (h.kg / maxKg) * 100;
        return (
          <TouchableOpacity
            key={h.code + h.kg}
            style={styles.hiveRow}
            onLongPress={() => h.id && onDelete?.(h.id, h.code)}
            activeOpacity={1}
          >
            <View style={styles.hiveRowLeft}>
              <Text style={styles.hiveCode}>{h.code}</Text>
              <Text style={styles.hiveApiary}>{h.apiary}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.hiveKg}>{h.kg} kg</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HarvestFormModal({
  visible, onClose, hives, newHiveIndex, setNewHiveIndex,
  newKg, setNewKg, newSeason, setNewSeason, newDate, setNewDate, onSave, insets,
}: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.dragHandle} />
          <Text style={styles.sheetTitle}>Registrar cosecha</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {hives.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Colmena</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {hives.map((h: any, i: number) => (
                      <TouchableOpacity key={h.id} style={[styles.pill, newHiveIndex === i && { backgroundColor: Colors.honeyFaint, borderColor: Colors.honeyDark }]} onPress={() => setNewHiveIndex(i)}>
                        <Text style={[styles.pillText, newHiveIndex === i && { color: Colors.honeyDark, fontFamily: 'NunitoSans-Bold' }]}>{h.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={styles.fieldLabel}>Kg recolectados</Text>
            <TextInput style={styles.formInput} value={newKg} onChangeText={setNewKg} keyboardType="decimal-pad" placeholder="Ej. 18.5" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Temporada</Text>
            <TextInput style={styles.formInput} value={newSeason} onChangeText={setNewSeason} placeholder="Ej. Primavera 2026" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Fecha</Text>
            <DateTimePicker
              value={newDate}
              mode="date"
              display="spinner"
              onChange={(_: any, date: Date | undefined) => date && setNewDate(date)}
              locale="es-ES"
              textColor={Colors.textPrimary}
              style={{ marginBottom: 8 }}
            />

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  screenTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, color: Colors.honeyDark, lineHeight: 28 },
  emptyText: { color: Colors.textMuted, fontFamily: 'NunitoSans-SemiBold', fontSize: 15, marginTop: 12, marginBottom: 20 },
  emptyBtn: { backgroundColor: Colors.honeyPrimary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNumber: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, textAlign: 'center' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans', textAlign: 'center' },

  card: { backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 20 },

  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8, justifyContent: 'center' },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 12, fontFamily: 'NunitoSans-SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  barContainer: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 6, textAlign: 'center' },

  hiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  hiveRowLeft: { width: 80 },
  hiveCode: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.textPrimary },
  hiveApiary: { fontSize: 10, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 1 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.honeyPrimary, borderRadius: 4 },
  hiveKg: { width: 52, textAlign: 'right', fontFamily: 'NunitoSans-SemiBold', fontSize: 13, color: Colors.textPrimary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(58,44,29,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: 'NunitoSans-SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  formInput: { backgroundColor: Colors.honeyFaint, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.textPrimary, fontFamily: 'NunitoSans', marginBottom: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.honeyFaint, borderWidth: 1, borderColor: 'transparent' },
  pillText: { fontSize: 13, color: Colors.textMuted, fontFamily: 'NunitoSans-Medium' },
  sheetButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.honeyFaint, alignItems: 'center' },
  cancelBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  saveBtn: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: Colors.greenDark, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
});
