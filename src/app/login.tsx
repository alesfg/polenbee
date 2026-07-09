import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn, signInAnonymously, signUp } from '@/lib/auth';
import { Colors, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email || !password) { setError('Introduce email y contraseña.'); return; }
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (e: any) {
      setError(e.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBadge}>
            <View style={styles.flowerCenter} />
            {[0, 45, 90, 135].map((a) => (
              <View key={a} style={[styles.flowerPetal, { transform: [{ rotate: `${a}deg` }, { translateY: -9 }] }]} />
            ))}
          </View>
          <Text style={styles.appName}>PolenBee</Text>
          <Text style={styles.tagline}>Gestión de colmenas inteligente</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Text>

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
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            <Text style={styles.toggleText}>
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.anonBtn}
          onPress={async () => {
            setAnonLoading(true);
            setError('');
            try { await signInAnonymously(); }
            catch (e: any) { setError(e.message ?? 'Error desconocido'); }
            finally { setAnonLoading(false); }
          }}
          disabled={anonLoading}
          activeOpacity={0.7}
        >
          {anonLoading
            ? <ActivityIndicator color={Colors.textMuted} />
            : <Text style={styles.anonBtnText}>Continuar sin cuenta</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center', gap: Spacing.xl },

  logoArea: { alignItems: 'center', gap: 8 },
  logoBadge: { width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.greenDark, alignItems: 'center', justifyContent: 'center' },
  flowerCenter: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.honeySoft, position: 'absolute' },
  flowerPetal: { position: 'absolute', width: 7, height: 13, borderRadius: 4, backgroundColor: Colors.honeySoft },
  appName: { fontFamily: 'Nunito-Black', fontSize: 32, color: Colors.honeyDark },
  tagline: { fontFamily: 'NunitoSans', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  card: { backgroundColor: Colors.card, borderRadius: 24, padding: Spacing.xl, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  cardTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.lg },

  fieldLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: Colors.honeyFaint, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.textPrimary, fontFamily: 'NunitoSans', marginBottom: Spacing.md },

  errorText: { color: Colors.statusDebilFg, fontFamily: 'NunitoSans', fontSize: 13, marginBottom: 12 },

  primaryBtn: { backgroundColor: Colors.honeyPrimary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 16 },

  toggleBtn: { marginTop: Spacing.md, alignItems: 'center' },
  toggleText: { color: Colors.honeyDark, fontFamily: 'NunitoSans-SemiBold', fontSize: 13 },

  anonBtn: { alignItems: 'center', paddingVertical: 14 },
  anonBtnText: { color: Colors.textMuted, fontFamily: 'NunitoSans-SemiBold', fontSize: 14, textDecorationLine: 'underline' },
});
