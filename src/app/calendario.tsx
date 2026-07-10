import { useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { Task } from '@/data/mockData';
import { useApiaries } from '@/hooks/useApiaries';
import { useTasks } from '@/hooks/useTasks';

function taskBadgeColors(type: Task['type']) {
  switch (type) {
    case 'treatment': return { bg: '#FDECEA', fg: '#C0392B' };
    case 'feeding':   return { bg: Colors.greenLight, fg: Colors.greenDark };
    case 'harvest':   return { bg: Colors.honeySoft, fg: Colors.honeyDark };
    case 'inspection': return { bg: '#E8F4FD', fg: '#2980B9' };
  }
}

function taskTypeLabel(type: Task['type']) {
  switch (type) {
    case 'treatment': return '💊';
    case 'feeding':   return '🍽';
    case 'harvest':   return '🍯';
    case 'inspection': return '🔍';
  }
}

const TASK_TYPES: Task['type'][] = ['treatment', 'feeding', 'harvest', 'inspection'];
const TASK_TYPE_LABELS: Record<Task['type'], string> = {
  treatment: 'Tratamiento',
  feeding: 'Alimentación',
  harvest: 'Cosecha',
  inspection: 'Inspección',
};

function currentSeason(): string {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  if (m >= 3 && m <= 5) return `Primavera ${y}`;
  if (m >= 6 && m <= 8) return `Verano ${y}`;
  if (m >= 9 && m <= 11) return `Otoño ${y}`;
  return `Invierno ${y}`;
}

export default function CalendarioScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, isDone, toggleTask, addTask, updateTask, deleteTask } = useTasks();
  const { apiaries } = useApiaries();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newType, setNewType] = useState<Task['type']>('inspection');
  const [newApiaryIndex, setNewApiaryIndex] = useState(0);

  const pending = tasks.filter((t) => !isDone(t));
  const done = tasks.filter((t) => isDone(t));

  function openNewTask() {
    setEditingTask(null);
    setNewTitle('');
    setNewDate(new Date());
    setNewType('inspection');
    setNewApiaryIndex(0);
    setShowForm(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setNewTitle(task.title);
    const parsed = new Date(task.date);
    setNewDate(isNaN(parsed.getTime()) ? new Date() : parsed);
    setNewType(task.type);
    const idx = apiaries.findIndex((a) => a.name === task.apiary);
    setNewApiaryIndex(idx >= 0 ? idx : 0);
    setShowForm(true);
  }

  async function saveTask() {
    if (!newTitle) return;
    const apiary = apiaries[newApiaryIndex];
    const isoDate = newDate.toISOString().split('T')[0];
    Keyboard.dismiss();
    if (editingTask) {
      await updateTask(editingTask.id, newTitle, isoDate, newType, apiary?.id, apiary?.name);
    } else {
      await addTask(newTitle, isoDate, newType, apiary?.id, apiary?.name);
    }
    setShowForm(false);
    setEditingTask(null);
  }

  function confirmDelete(id: string, title: string) {
    Alert.alert('Eliminar tarea', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  }

  function TaskCard({ task }: { task: Task }) {
    const done_ = isDone(task);
    const bc = taskBadgeColors(task.type);
    return (
      <TouchableOpacity
        style={[styles.taskCard, done_ && { opacity: 0.6 }]}
        onPress={() => openEditTask(task)}
        onLongPress={() => confirmDelete(task.id, task.title)}
        activeOpacity={0.85}
      >
        <TouchableOpacity
          style={[styles.checkbox, done_ && { backgroundColor: Colors.greenPrimary, borderColor: Colors.greenPrimary }]}
          onPress={() => toggleTask(task.id, done_)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {done_ && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
        <View style={[styles.taskBadge, { backgroundColor: bc.bg }]}>
          <Text style={{ fontSize: 14 }}>{taskTypeLabel(task.type)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, done_ && { textDecorationLine: 'line-through' }]}>
            {task.title}
          </Text>
          <Text style={styles.taskMeta}>{task.date}{task.apiary ? ` · ${task.apiary}` : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Calendario</Text>
        <Text style={styles.screenSubtitle}>{currentSeason()}</Text>

        <Text style={styles.sectionTitle}>Pendientes</Text>
        {pending.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay tareas pendientes 🎉</Text>
          </View>
        ) : (
          pending.map((t) => <TaskCard key={t.id} task={t} />)
        )}

        {done.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Completadas</Text>
            {done.map((t) => <TaskCard key={t.id} task={t} />)}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: TAB_BAR_HEIGHT + 16 }]} onPress={openNewTask} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Título</Text>
              <TextInput
                style={styles.formInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Ej. Tratamiento varroa"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Fecha</Text>
              <DateTimePicker
                value={newDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => date && setNewDate(date)}
                locale="es-ES"
                textColor={Colors.textPrimary}
                style={{ marginBottom: 8 }}
              />

              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={styles.pillRow}>
                {TASK_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, newType === t && { backgroundColor: Colors.honeyFaint, borderColor: Colors.honeyDark }]}
                    onPress={() => setNewType(t)}
                  >
                    <Text style={[styles.pillText, newType === t && { color: Colors.honeyDark, fontFamily: 'NunitoSans-Bold' }]}>
                      {TASK_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {apiaries.length > 0 && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Colmenar</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {apiaries.map((a, i) => (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.pill, newApiaryIndex === i && { backgroundColor: Colors.honeyFaint, borderColor: Colors.honeyDark }]}
                          onPress={() => setNewApiaryIndex(i)}
                        >
                          <Text style={[styles.pillText, newApiaryIndex === i && { color: Colors.honeyDark, fontFamily: 'NunitoSans-Bold' }]}>
                            {a.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <View style={[styles.sheetButtons, { marginTop: 16 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { Keyboard.dismiss(); setShowForm(false); setEditingTask(null); }}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveTask}>
                  <Text style={styles.saveBtnText}>{editingTask ? 'Guardar cambios' : 'Guardar tarea'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.bg },
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  screenTitle: { fontFamily: 'Nunito-Black', fontSize: 22, color: Colors.textPrimary },
  screenSubtitle: { fontSize: 13, color: Colors.textMuted, fontFamily: 'NunitoSans', marginBottom: 20, marginTop: 2 },
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 10 },

  taskCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  taskBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskTitle: { fontFamily: 'NunitoSans-SemiBold', fontSize: 13.5, color: Colors.textPrimary },
  taskMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans' },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 8 },
  emptyText: { color: Colors.textMuted, fontFamily: 'NunitoSans-SemiBold', fontSize: 14 },

  fab: { position: 'absolute', right: 20, width: 54, height: 54, borderRadius: 17, backgroundColor: Colors.honeyPrimary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.honeyPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(58,44,29,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
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
