import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { useSession } from '@/hooks/useSession';
import { Colors, Spacing } from '@/constants/theme';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState('');

  const isAnon = session?.user?.is_anonymous ?? false;
  const displayName = isAnon ? 'Usuario anónimo' : (session?.user?.email ?? '');

  async function handleUpgrade() {
    if (!email || !password) { setError('Introduce email y contraseña.'); return; }
    setError('');
    setUpgradeLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ email, password });
      if (err) throw err;
      Alert.alert('¡Listo!', 'Tu cuenta ha sido creada. Revisa tu email para confirmarla.');
      setShowUpgrade(false);
    } catch (e: any) {
      setError(e.message ?? 'Error desconocido');
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleSignOut() {
    setSignOutLoading(true);
    await signOut();
    setSignOutLoading(false);
  }

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Atrás</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Mi perfil</Text>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarEmoji}>{isAnon ? '👤' : '🐝'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.displayName}>{isAnon ? 'Usuario anónimo' : displayName}</Text>
            {isAnon && <Text style={styles.anonNote}>Tu cuenta es temporal. Crea una cuenta para no perder tus datos.</Text>}
          </View>
        </View>
      </View>

      {isAnon && !showUpgrade && (
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowUpgrade(true)} activeOpacity={0.85}>
          <Text style={styles.upgradeBtnText}>Crear cuenta permanente</Text>
        </TouchableOpacity>
      )}

      {isAnon && showUpgrade && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear cuenta</Text>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.fieldLabel}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={Colors.textMuted}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUpgrade(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpgrade} disabled={upgradeLoading}>
              {upgradeLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Crear cuenta</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signOutLoading} activeOpacity={0.85}>
        {signOutLoading
          ? <ActivityIndicator color={Colors.statusDebilFg} />
          : <Text style={styles.signOutBtnText}>Cerrar sesión</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.honeyDark, fontSize: 15, fontFamily: 'NunitoSans-SemiBold' },
  screenTitle: { fontFamily: 'Nunito-Black', fontSize: 24, color: Colors.textPrimary, marginBottom: Spacing.lg },

  card: { backgroundColor: Colors.card, borderRadius: 20, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBig: { width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.honeyFaint, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 28 },
  displayName: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary },
  anonNote: { fontSize: 12, color: Colors.textMuted, fontFamily: 'NunitoSans', marginTop: 4, lineHeight: 17 },

  cardTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontFamily: 'NunitoSans-SemiBold', color: Colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: Colors.honeyFaint, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.textPrimary, fontFamily: 'NunitoSans', marginBottom: Spacing.md },
  errorText: { color: Colors.statusDebilFg, fontFamily: 'NunitoSans', fontSize: 13, marginBottom: 10 },

  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.honeyFaint, alignItems: 'center' },
  cancelBtnText: { color: Colors.honeyDark, fontFamily: 'Nunito-ExtraBold', fontSize: 15 },
  saveBtn: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: Colors.greenDark, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 15 },

  upgradeBtn: { backgroundColor: Colors.greenDark, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: Spacing.md },
  upgradeBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 16 },

  signOutBtn: { backgroundColor: Colors.statusDebilBg, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: Spacing.md },
  signOutBtnText: { color: Colors.statusDebilFg, fontFamily: 'Nunito-ExtraBold', fontSize: 16 },
});
