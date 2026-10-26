import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { locale, t } from '@/i18n';

interface Props {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onChange: (d: Date) => void;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function Stepper({ label, value, onMinus, onPlus, plusDisabled }: { label: string; value: string; onMinus: () => void; onPlus: () => void; plusDisabled?: boolean }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={onMinus} hitSlop={6}>
          <Text style={styles.stepBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity style={[styles.stepBtn, plusDisabled && styles.stepBtnDisabled]} onPress={onPlus} disabled={plusDisabled} hitSlop={6}>
          <Text style={styles.stepBtnText}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Small cross-platform date/time editor (works the same on iOS, Android and web). Never goes into the future. */
export function DateTimeModal({ visible, value, onClose, onChange }: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (visible) setDraft(value); }, [visible]);

  const now = Date.now();
  const shift = (ms: number) => setDraft((d) => new Date(Math.min(d.getTime() + ms, now)));

  const dateLabel = draft.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = draft.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const quick = [
    { label: t('date.now'), date: () => new Date() },
    { label: t('date.hourAgo'), date: () => new Date(Date.now() - 60 * MINUTE) },
    { label: t('date.yesterday'), date: () => new Date(Date.now() - DAY) },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t('date.title')}</Text>
          <View style={styles.quickRow}>
            {quick.map((q) => (
              <TouchableOpacity key={q.label} style={styles.quickChip} onPress={() => setDraft(q.date())}>
                <Text style={styles.quickChipText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Stepper label={t('date.day')} value={dateLabel} onMinus={() => shift(-DAY)} onPlus={() => shift(DAY)} plusDisabled={draft.getTime() + DAY > now} />
          <Stepper label={t('date.time')} value={timeLabel} onMinus={() => shift(-15 * MINUTE)} onPlus={() => shift(15 * MINUTE)} plusDisabled={draft.getTime() + 15 * MINUTE > now} />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>{t('date.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { onChange(draft); onClose(); }}>
              <Text style={styles.primaryBtnText}>{t('date.save')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(58,44,29,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { fontFamily: 'Nunito-Black', fontSize: 20, color: Colors.textPrimary },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickChip: { backgroundColor: Colors.honeyFaint, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: Colors.honeyDark },
  stepper: { backgroundColor: Colors.card, borderRadius: 16, padding: 12 },
  stepperLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.honeyDark, marginTop: -2 },
  stepValue: { fontFamily: 'Nunito-ExtraBold', fontSize: 17, color: Colors.textPrimary },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryBtn: { flex: 1, backgroundColor: Colors.greenDark, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  secondaryBtn: { flex: 1, backgroundColor: Colors.honeyFaint, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
});
