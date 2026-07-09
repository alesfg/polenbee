import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { TASKS, Task } from '@/data/mockData';

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

export default function CalendarioScreen() {
  const insets = useSafeAreaInsets();
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>({});

  function isDone(t: Task) {
    return doneOverrides[t.id] !== undefined ? doneOverrides[t.id] : t.done;
  }

  function toggleDone(id: string, current: boolean) {
    setDoneOverrides((prev) => ({ ...prev, [id]: !current }));
  }

  const pending = TASKS.filter((t) => !isDone(t));
  const done = TASKS.filter((t) => isDone(t));

  function TaskCard({ task }: { task: Task }) {
    const done_ = isDone(task);
    const bc = taskBadgeColors(task.type);
    return (
      <View style={[styles.taskCard, done_ && { opacity: 0.6 }]}>
        <TouchableOpacity
          style={[styles.checkbox, done_ && { backgroundColor: Colors.greenPrimary, borderColor: Colors.greenPrimary }]}
          onPress={() => toggleDone(task.id, done_)}
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
          <Text style={styles.taskMeta}>{task.date} · {task.apiary}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Calendario</Text>
      <Text style={styles.screenSubtitle}>Verano 2026 · floración de jara y romero</Text>

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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
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
});
