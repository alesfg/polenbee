import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useApiaries } from '@/hooks/useApiaries';
import { useHives } from '@/hooks/useHives';
import { useSession } from '@/hooks/useSession';
import { useTasks } from '@/hooks/useTasks';

const weather = {
  temp: 34,
  condition: 'Soleado',
  wind: '8 km/h',
  forageIndex: 'Alto',
  humidity: 45,
  forecast: [
    { day: 'Jue', temp: 31 },
    { day: 'Vie', temp: 33 },
    { day: 'Sáb', temp: 36 },
    { day: 'Dom', temp: 32 },
  ],
};

const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function getStatusColor(status: string) {
  if (status === 'Fuerte') return { fg: Colors.statusFuerteFg, bg: Colors.statusFuerteBg };
  if (status === 'Media') return { fg: Colors.statusMediaFg, bg: Colors.statusMediaBg };
  return { fg: Colors.statusDebilFg, bg: Colors.statusDebilBg };
}

function getTaskBadgeColor(type: string) {
  switch (type) {
    case 'treatment': return { bg: '#FDECEA', fg: '#C0392B' };
    case 'feeding': return { bg: Colors.greenLight, fg: Colors.greenDark };
    case 'harvest': return { bg: Colors.honeySoft, fg: Colors.honeyDark };
    case 'inspection': return { bg: '#E8F4FD', fg: '#2980B9' };
    default: return { bg: Colors.border, fg: Colors.textMuted };
  }
}

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const { apiaries } = useApiaries();
  const { hives } = useHives();
  const { tasks, isDone } = useTasks();

  const greeting = session?.user?.email?.split('@')[0] ?? 'Elena';
  const pendingTasks = tasks.filter((t) => !isDone(t)).slice(0, 3);
  const attentionHives = hives.filter((h) => h.attentionReason);
  const totalKg = 187;

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {greeting}</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.avatar}>
          <View style={styles.beeDot} />
        </View>
      </View>

      {/* Weather widget */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherTop}>
          <View>
            <Text style={styles.weatherTemp}>{weather.temp}°</Text>
            <Text style={styles.weatherCondition}>{weather.condition} · Viento {weather.wind}</Text>
          </View>
          <View style={styles.sunIcon}>
            <View style={styles.sunCore} />
          </View>
        </View>
        <View style={styles.forageRow}>
          <View style={styles.forageDot} />
          <Text style={styles.forageText}>Índice de pecoreo: {weather.forageIndex}</Text>
          <Text style={styles.humidityText}>Humedad {weather.humidity}%</Text>
        </View>
        <View style={styles.forecastRow}>
          {weather.forecast.map((f) => (
            <View key={f.day} style={styles.forecastItem}>
              <Text style={styles.forecastDay}>{f.day}</Text>
              <Text style={styles.forecastTemp}>{f.temp}°</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.honeyDark }]}>{hives.length}</Text>
          <Text style={styles.statLabel}>Colmenas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.greenPrimary }]}>{apiaries.length}</Text>
          <Text style={styles.statLabel}>Colmenares</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.honeyDark }]}>{totalKg} kg</Text>
          <Text style={styles.statLabel}>Miel temporada</Text>
        </View>
      </View>

      {/* Pollen CTA */}
      <TouchableOpacity style={styles.pollenCTA} activeOpacity={0.85} onPress={() => router.push('/polen')}>
        <View style={styles.pollenIconBadge}>
          <View style={styles.flowerCenter} />
          {[0, 45, 90, 135].map((a) => (
            <View key={a} style={[styles.flowerPetal, { transform: [{ rotate: `${a}deg` }, { translateY: -9 }] }]} />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pollenCTATitle}>Analiza el polen de tus abejas</Text>
          <Text style={styles.pollenCTASubtitle}>Descubre qué están pecoreando ahora mismo</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Requieren atención */}
      {attentionHives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requieren atención</Text>
          {attentionHives.map((h) => {
            const sc = getStatusColor(h.status);
            return (
              <View key={h.id} style={[styles.attentionCard, { borderLeftColor: sc.fg }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCode}>{h.code}</Text>
                  <Text style={styles.attentionReason}>{h.attentionReason}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusPillText, { color: sc.fg }]}>{h.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Próximas tareas */}
      {pendingTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas tareas</Text>
            <TouchableOpacity onPress={() => router.push('/calendario')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {pendingTasks.map((t) => {
            const bc = getTaskBadgeColor(t.type);
            return (
              <View key={t.id} style={styles.taskCard}>
                <View style={[styles.taskBadge, { backgroundColor: bc.bg }]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bc.fg }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <Text style={styles.taskMeta}>{t.date}{t.apiary ? ` · ${t.apiary}` : ''}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  greeting: { fontFamily: 'Nunito-Black', fontSize: 24, color: Colors.textPrimary },
  dateText: { fontSize: 14, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans' },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.honeyLight, alignItems: 'center', justifyContent: 'center' },
  beeDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.honeyDark },

  weatherCard: { backgroundColor: Colors.honeyPrimary, borderRadius: 22, padding: 18, marginBottom: 16, shadowColor: Colors.honeyPrimary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  weatherTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weatherTemp: { fontSize: 38, fontFamily: 'Nunito-ExtraBold', color: '#fff', lineHeight: 42 },
  weatherCondition: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontFamily: 'NunitoSans' },
  sunIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  sunCore: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,228,168,0.9)' },
  forageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 8 },
  forageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAF7C9' },
  forageText: { fontSize: 13, fontFamily: 'NunitoSans-Bold', color: '#fff', flex: 1 },
  humidityText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'NunitoSans' },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  forecastItem: { alignItems: 'center', flex: 1 },
  forecastDay: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'NunitoSans' },
  forecastTemp: { fontSize: 15, fontFamily: 'NunitoSans-Bold', color: '#fff', marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNumber: { fontFamily: 'Nunito-ExtraBold', fontSize: 20 },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans', textAlign: 'center' },

  pollenCTA: { backgroundColor: Colors.greenDark, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  pollenIconBadge: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.greenPrimary, alignItems: 'center', justifyContent: 'center' },
  flowerCenter: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.honeySoft, position: 'absolute' },
  flowerPetal: { position: 'absolute', width: 6, height: 10, borderRadius: 3, backgroundColor: Colors.honeySoft },
  pollenCTATitle: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  pollenCTASubtitle: { color: '#CFE0BE', fontSize: 12.5, marginTop: 2, fontFamily: 'NunitoSans' },
  chevron: { color: '#CFE0BE', fontSize: 22, fontWeight: '300' },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 8 },
  seeAll: { fontSize: 13, color: Colors.honeyDark, fontFamily: 'NunitoSans-SemiBold' },

  attentionCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderLeftWidth: 4, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  attentionCode: { fontFamily: 'NunitoSans-Bold', fontSize: 14, color: Colors.textPrimary },
  attentionReason: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans' },
  statusPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontFamily: 'NunitoSans-SemiBold' },

  taskCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  taskBadge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskTitle: { fontFamily: 'NunitoSans-SemiBold', fontSize: 13.5, color: Colors.textPrimary },
  taskMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontFamily: 'NunitoSans' },
});
